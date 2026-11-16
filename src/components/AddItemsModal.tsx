'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { listProducts, Product } from '@/lib/api/products'
import { createOrder } from '@/lib/api/orders'
import { money, weight, meatSubtotal, CATEGORY_LABEL, CATEGORY_ORDER } from '@/lib/utils/format'

interface CartItem {
  key: string
  productId: string
  name: string
  isMeat: boolean
  quantity: number // gramas (carne) ou unidades
  subtotal: number
  notes: string // observação do item (ex: com gelo e limão)
}

interface AddItemsModalProps {
  tableId: string
  tableIdentifier: string
  onClose: () => void
  onSuccess: () => void
}

export default function AddItemsModal({ tableId, tableIdentifier, onClose, onSuccess }: AddItemsModalProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [grams, setGrams] = useState<Record<string, string>>({})
  const [cart, setCart] = useState<CartItem[]>([])
  const [saving, setSaving] = useState(false)
  const [editingNote, setEditingNote] = useState<string | null>(null)

  useEffect(() => {
    listProducts()
      .then(setProducts)
      .catch((e) => toast.error(e.message || 'Erro ao carregar o cardápio'))
      .finally(() => setLoading(false))
  }, [])

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase()
    const g: Record<string, Product[]> = {}
    products
      .filter((p) => p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q))
      .forEach((p) => { (g[p.category] = g[p.category] || []).push(p) })
    return g
  }, [products, search])

  // Quanto do estoque já está reservado no carrinho
  const inCart = (productId: string) => cart.filter((i) => i.productId === productId).reduce((s, i) => s + i.quantity, 0)

  const addMeat = (p: Product) => {
    const min = p.minGrams ?? 300
    const value = parseInt(grams[p.id] ?? String(min), 10)
    if (!Number.isFinite(value) || value < min) {
      toast.error(`${p.name}: o pedido mínimo é de ${min} g`)
      return
    }
    if (inCart(p.id) + value > p.stock) {
      toast.error(`Estoque insuficiente de ${p.name} (disponível: ${weight(p.stock - inCart(p.id))})`)
      return
    }
    setCart((c) => [
      ...c,
      { key: `${p.id}-${Date.now()}`, productId: p.id, name: p.name, isMeat: true, quantity: value, subtotal: meatSubtotal(value, p.pricePerKg ?? 0), notes: '' },
    ])
    setGrams((g) => ({ ...g, [p.id]: '' }))
  }

  const changeUnits = (p: Product, delta: number) => {
    const current = inCart(p.id)
    if (delta > 0 && current + delta > p.stock) {
      toast.error(`Estoque insuficiente de ${p.name} (disponível: ${p.stock} un)`)
      return
    }
    setCart((c) => {
      const existing = c.find((i) => i.productId === p.id)
      if (!existing) {
        return delta > 0 ? [...c, { key: p.id, productId: p.id, name: p.name, isMeat: false, quantity: delta, subtotal: p.price * delta, notes: '' }] : c
      }
      const quantity = existing.quantity + delta
      if (quantity <= 0) return c.filter((i) => i.productId !== p.id)
      return c.map((i) => (i.productId === p.id ? { ...i, quantity, subtotal: p.price * quantity } : i))
    })
  }

  const setNote = (key: string, notes: string) => setCart((c) => c.map((i) => (i.key === key ? { ...i, notes } : i)))

  const subtotal = cart.reduce((s, i) => s + i.subtotal, 0)
  const serviceFee = Math.round(subtotal * 0.1)

  const handleConfirm = async () => {
    if (cart.length === 0) { toast.error('Adicione itens ao pedido'); return }
    setSaving(true)
    try {
      await createOrder({ tableId, items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity, notes: i.notes.trim() || undefined })) })
      toast.success('Pedido enviado para a cozinha!')
      onSuccess()
      onClose()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao lançar o pedido')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-2xl w-full max-h-[94vh] sm:max-h-[90vh] flex flex-col">
        <div className="p-4 border-b" style={{ borderColor: '#d9cfc2' }}>
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-lg sm:text-xl font-bold text-[#2a1f14] min-w-0 break-words" style={{ fontFamily: 'Georgia, serif' }}>Adicionar Itens — Mesa {tableIdentifier}</h2>
            <button onClick={onClose} className="text-2xl text-[#7a6650] hover:text-[#2a1f14]" aria-label="Fechar">×</button>
          </div>
          <input
            type="text"
            placeholder="🔍 Buscar no cardápio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border outline-none"
            style={{ borderColor: '#d9cfc2' }}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
          {loading ? (
            <div className="space-y-2">{[1, 2, 3, 4].map((i) => <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: '#f5f0eb' }} />)}</div>
          ) : Object.keys(grouped).length === 0 ? (
            <p className="text-center py-8 text-[#7a6650]">Nenhum item encontrado</p>
          ) : (
            CATEGORY_ORDER.filter((cat) => grouped[cat]?.length).map((cat) => (
              <div key={cat}>
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#c45c2a' }}>{CATEGORY_LABEL[cat]}</p>
                <div className="space-y-2">
                  {grouped[cat].map((p) => {
                    const out = p.stock - inCart(p.id) <= 0 || (p.isMeat && p.stock - inCart(p.id) < (p.minGrams ?? 300))
                    const units = cart.find((i) => i.productId === p.id && !i.isMeat)?.quantity ?? 0
                    return (
                      <div key={p.id} className="flex flex-wrap min-[420px]:flex-nowrap items-center gap-x-3 gap-y-2 p-3 rounded-lg border" style={{ borderColor: '#e8ddd2', opacity: out ? 0.5 : 1 }}>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#2a1f14] text-sm">
                            {p.name}
                            {p.lowStock && !out && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(232,160,74,0.18)', color: '#b8741f' }}>últimas unidades</span>}
                            {out && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(217,83,79,0.15)', color: '#d9534f' }}>esgotado</span>}
                          </p>
                          {p.description && <p className="text-xs truncate" style={{ color: '#8a7060' }}>{p.description}</p>}
                          <p className="text-xs font-semibold mt-0.5" style={{ color: '#c45c2a' }}>
                            {p.isMeat ? `${money(p.pricePerKg ?? 0)}/kg · mínimo ${p.minGrams ?? 300} g` : money(p.price)}
                          </p>
                        </div>

                        {p.isMeat ? (
                          <div className="flex items-center gap-2 ml-auto">
                            <div className="relative">
                              <input
                                type="number"
                                inputMode="numeric"
                                min={p.minGrams ?? 300}
                                step={50}
                                placeholder={String(p.minGrams ?? 300)}
                                value={grams[p.id] ?? ''}
                                onChange={(e) => setGrams((g) => ({ ...g, [p.id]: e.target.value }))}
                                disabled={out}
                                className="w-24 pl-2 pr-6 py-1.5 rounded border text-sm"
                                style={{ borderColor: '#d9cfc2' }}
                                aria-label={`Gramas de ${p.name}`}
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#8a7060' }}>g</span>
                            </div>
                            <button onClick={() => addMeat(p)} disabled={out} className="px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: '#3d5c3a' }}>+ Add</button>
                          </div>
                        ) : units > 0 ? (
                          <div className="flex items-center gap-2 ml-auto">
                            <button onClick={() => changeUnits(p, -1)} className="w-9 h-9 sm:w-7 sm:h-7 rounded-full font-bold" style={{ background: '#f0f0f0', color: '#7a6650' }}>−</button>
                            <span className="w-5 text-center font-semibold">{units}</span>
                            <button onClick={() => changeUnits(p, 1)} className="w-9 h-9 sm:w-7 sm:h-7 rounded-full font-bold text-white" style={{ background: '#3d5c3a' }}>+</button>
                          </div>
                        ) : (
                          <button onClick={() => changeUnits(p, 1)} disabled={out} className="ml-auto px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: '#3d5c3a' }}>+ Add</button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-4 space-y-3" style={{ borderColor: '#d9cfc2' }}>
            <div className="space-y-2 max-h-40 sm:max-h-48 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.key}>
                  <div className="flex flex-wrap justify-between items-center text-sm gap-x-2 gap-y-0.5">
                    <span className="flex-1 min-w-[45%] text-[#2a1f14]">{item.name} <span style={{ color: '#8a7060' }}>{item.isMeat ? weight(item.quantity) : `x${item.quantity}`}</span></span>
                    <span className="font-semibold text-[#2a1f14]">{money(item.subtotal)}</span>
                    {editingNote !== item.key && (
                      <button onClick={() => setEditingNote(item.key)} className="text-xs" style={{ color: '#3d5c3a' }}>{item.notes ? 'editar obs' : '+ obs'}</button>
                    )}
                    <button onClick={() => setCart((c) => c.filter((i) => i.key !== item.key))} className="text-xs" style={{ color: '#d9534f' }}>remover</button>
                  </div>
                  {editingNote === item.key ? (
                    <div className="flex gap-2 mt-1">
                      <input
                        autoFocus
                        value={item.notes}
                        maxLength={120}
                        onChange={(e) => setNote(item.key, e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') setEditingNote(null) }}
                        placeholder="Ex: com gelo e limão, sem cebola, bem passada..."
                        className="flex-1 px-2 py-1 rounded border text-xs"
                        style={{ borderColor: '#d9cfc2' }}
                        aria-label={`Observação de ${item.name}`}
                      />
                      <button onClick={() => setEditingNote(null)} className="px-2 py-1 rounded text-xs font-semibold text-white" style={{ background: '#3d5c3a' }}>OK</button>
                    </div>
                  ) : item.notes.trim() ? (
                    <p className="text-xs italic mt-0.5" style={{ color: '#b8741f' }}>↳ {item.notes.trim()}</p>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="border-t pt-2 space-y-1 text-sm" style={{ borderColor: '#e8ddd2' }}>
              <div className="flex justify-between"><span style={{ color: '#7a6650' }}>Subtotal</span><span>{money(subtotal)}</span></div>
              <div className="flex justify-between"><span style={{ color: '#7a6650' }}>Taxa de serviço (10%)</span><span style={{ color: '#c45c2a' }}>{money(serviceFee)}</span></div>
              <div className="flex justify-between text-base font-bold"><span>Total</span><span style={{ color: '#c45c2a' }}>{money(subtotal + serviceFee)}</span></div>
            </div>
            <button
              onClick={handleConfirm}
              disabled={saving}
              className="w-full py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90"
              style={{ background: saving ? 'rgba(196,92,42,0.5)' : '#c45c2a' }}
            >
              {saving ? 'Enviando...' : 'Confirmar Pedido'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
