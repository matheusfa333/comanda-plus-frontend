'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { listProducts, Product } from '@/lib/api/products'
import { createOrder } from '@/lib/api/orders'

interface CartItem {
  productId: string
  name: string
  quantity: number // gramas (carne) ou unidades
  unitPrice: number
  isMeat: boolean
  subtotal: number
}

interface AddItemsModalProps {
  tableId: string
  tableNumber: number
  onClose: () => void
  onSuccess: () => void
}

const money = (cents: number) => `R$ ${(cents / 100).toFixed(2)}`

export default function AddItemsModal({ tableId, tableNumber, onClose, onSuccess }: AddItemsModalProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [grams, setGrams] = useState<{ [id: string]: string }>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    listProducts()
      .then((data) => setProducts(data.filter((p) => p.available)))
      .catch((e) => toast.error(e.message || 'Erro ao carregar cardápio'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return products.filter((p) => p.name.toLowerCase().includes(q))
  }, [products, search])

  const grouped = useMemo(() => {
    const g: { [cat: string]: Product[] } = {}
    filtered.forEach((p) => {
      ;(g[p.category] = g[p.category] || []).push(p)
    })
    return g
  }, [filtered])

  const addToCart = (p: Product) => {
    if (p.isMeat) {
      const min = p.minGrams ?? 0
      const val = parseInt(grams[p.id] || String(min))
      if (isNaN(val) || val < min) {
        toast.error(`${p.name}: mínimo ${min}g`)
        return
      }
      const unit = p.pricePerGram ?? 0
      setCart((c) => [...c, { productId: p.id, name: `${p.name} (${val}g)`, quantity: val, unitPrice: unit, isMeat: true, subtotal: val * unit }])
    } else {
      const unit = p.price
      setCart((c) => {
        const existing = c.find((i) => i.productId === p.id)
        if (existing) {
          return c.map((i) => i.productId === p.id ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * unit } : i)
        }
        return [...c, { productId: p.id, name: p.name, quantity: 1, unitPrice: unit, isMeat: false, subtotal: unit }]
      })
    }
    toast.success('Item adicionado')
  }

  const removeItem = (idx: number) => setCart((c) => c.filter((_, i) => i !== idx))

  const subtotal = cart.reduce((s, i) => s + i.subtotal, 0)
  const serviceFee = Math.round(subtotal * 0.1)
  const total = subtotal + serviceFee

  const handleConfirm = async () => {
    if (cart.length === 0) {
      toast.error('Adicione itens ao pedido')
      return
    }
    setSaving(true)
    try {
      await createOrder({
        tableId,
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      })
      toast.success('Pedido enviado para a cozinha!')
      onSuccess()
      onClose()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao lançar pedido')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b" style={{ borderColor: '#d9cfc2' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-[#2a1f14]">Adicionar Itens — Mesa {tableNumber}</h2>
            <button onClick={onClose} className="text-2xl text-[#7a6650] hover:text-[#2a1f14]">×</button>
          </div>
          <input
            type="text"
            placeholder="🔍 Buscar carne, acompanhamento, bebida..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border outline-none"
            style={{ borderColor: '#d9cfc2' }}
          />
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <p className="text-center py-8 text-[#7a6650]">Carregando cardápio...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center py-8 text-[#7a6650]">Nenhum item encontrado</p>
          ) : (
            Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <p className="text-xs font-bold uppercase mb-2" style={{ color: '#c45c2a' }}>{cat}</p>
                <div className="space-y-2">
                  {items.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 p-3 rounded-lg border" style={{ borderColor: '#e8ddd2' }}>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#2a1f14] text-sm">{p.name}</p>
                        <p className="text-xs" style={{ color: '#7a6650' }}>
                          {p.isMeat ? `${money(p.pricePerGram ?? 0)}/g · mín ${p.minGrams}g` : money(p.price)}
                        </p>
                      </div>
                      {p.isMeat && (
                        <input
                          type="number"
                          min={p.minGrams ?? 0}
                          step={50}
                          placeholder={`${p.minGrams}g`}
                          value={grams[p.id] ?? ''}
                          onChange={(e) => setGrams((g) => ({ ...g, [p.id]: e.target.value }))}
                          className="w-20 px-2 py-1.5 rounded border text-sm"
                          style={{ borderColor: '#d9cfc2' }}
                        />
                      )}
                      <button
                        onClick={() => addToCart(p)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                        style={{ background: '#3d5c3a' }}
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Carrinho */}
        {cart.length > 0 && (
          <div className="border-t p-4 space-y-3" style={{ borderColor: '#d9cfc2' }}>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="text-[#2a1f14]">{item.name}{!item.isMeat && ` x${item.quantity}`}</span>
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-[#2a1f14]">{money(item.subtotal)}</span>
                    <button onClick={() => removeItem(idx)} className="text-xs text-red-600">remover</button>
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t pt-2 space-y-1 text-sm" style={{ borderColor: '#e8ddd2' }}>
              <div className="flex justify-between"><span style={{ color: '#7a6650' }}>Subtotal</span><span>{money(subtotal)}</span></div>
              <div className="flex justify-between"><span style={{ color: '#7a6650' }}>Taxa garçom (10%)</span><span style={{ color: '#c45c2a' }}>{money(serviceFee)}</span></div>
              <div className="flex justify-between text-base font-bold"><span>Total</span><span style={{ color: '#c45c2a' }}>{money(total)}</span></div>
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
