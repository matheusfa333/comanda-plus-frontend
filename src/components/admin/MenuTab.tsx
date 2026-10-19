'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Product, ProductCategory, createProduct, removeProduct } from '@/lib/api/products'
import { money, weight, CATEGORY_LABEL, CATEGORY_ORDER } from '@/lib/utils/format'
import ConfirmModal from '@/components/ui/ConfirmModal'

// "12,50" → 1250 centavos
const toCents = (value: string) => Math.round(parseFloat(value.replace(/\./g, '').replace(',', '.')) * 100)

interface MenuTabProps {
  products: Product[]
  loading: boolean
  onChange: () => void
}

export default function MenuTab({ products, loading, onChange }: MenuTabProps) {
  const empty = { name: '', category: 'CARNE' as ProductCategory, description: '', price: '', minGrams: '300', stock: '' }
  const [form, setForm] = useState(empty)
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toRemove, setToRemove] = useState<Product | null>(null)
  const [removing, setRemoving] = useState(false)

  const isMeat = form.category === 'CARNE'

  const handleCreate = async () => {
    const cents = toCents(form.price)
    if (!form.name.trim()) { toast.error('Informe o nome do item'); return }
    if (!Number.isFinite(cents) || cents <= 0) { toast.error(isMeat ? 'Informe o preço por kg' : 'Informe o preço'); return }
    const minGrams = parseInt(form.minGrams, 10)
    if (isMeat && (!Number.isFinite(minGrams) || minGrams <= 0)) { toast.error('Informe o pedido mínimo em gramas'); return }
    const stockNumber = parseFloat((form.stock || '0').replace(',', '.'))
    const stock = Number.isFinite(stockNumber) ? (isMeat ? Math.round(stockNumber * 1000) : Math.round(stockNumber)) : 0

    setSaving(true)
    try {
      await createProduct({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        category: form.category,
        ...(isMeat ? { pricePerKg: cents, minGrams } : { price: cents }),
        stock,
      })
      toast.success(`${form.name.trim()} adicionado ao cardápio`)
      setForm(empty)
      setShowCreate(false)
      onChange()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao adicionar item')
    } finally {
      setSaving(false)
    }
  }

  const confirmRemove = async () => {
    if (!toRemove) return
    setRemoving(true)
    try {
      await removeProduct(toRemove.id)
      toast.success(`${toRemove.name} removido do cardápio`)
      setToRemove(null)
      onChange()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao remover item')
    } finally {
      setRemoving(false)
    }
  }

  const grouped: Record<string, Product[]> = {}
  products.forEach((p) => { (grouped[p.category] = grouped[p.category] || []).push(p) })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#2a1f14]" style={{ fontFamily: 'Georgia, serif' }}>Cardápio</h2>
        <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 rounded-xl font-semibold" style={{ background: '#3d5c3a', color: '#faf6ef' }}>+ Adicionar Item</button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3, 4].map((i) => <div key={i} className="rounded-2xl animate-pulse" style={{ background: '#f5f0eb', height: '64px' }} />)}</div>
      ) : (
        <div className="space-y-6">
          {CATEGORY_ORDER.filter((c) => grouped[c]?.length).map((cat) => (
            <div key={cat}>
              <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#c45c2a' }}>{CATEGORY_LABEL[cat]}</p>
              <div className="space-y-2">
                {grouped[cat].map((p) => (
                  <div key={p.id} className="rounded-2xl p-4 flex items-center gap-3" style={{ background: '#fff9f2', border: '1px solid #d9cfc2' }}>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#2a1f14] flex flex-wrap items-center gap-2">
                        {p.name}
                        {p.isMeat && <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(196,92,42,0.12)', color: '#c45c2a' }}>por grama · mín. {p.minGrams ?? 300} g</span>}
                        {p.lowStock && <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(217,83,79,0.12)', color: '#d9534f' }}>⚠ Estoque baixo ({p.isMeat ? weight(p.stock) : p.stock})</span>}
                      </p>
                      {p.description && <p className="text-xs mt-0.5" style={{ color: '#8a7060' }}>{p.description}</p>}
                    </div>
                    <span className="font-bold whitespace-nowrap" style={{ color: '#c45c2a' }}>{p.isMeat ? `${money(p.pricePerKg ?? 0)}/kg` : money(p.price)}</span>
                    <button onClick={() => setToRemove(p)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'rgba(217,83,79,0.12)', color: '#d9534f' }}>Remover</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-[#2a1f14]" style={{ fontFamily: 'Georgia, serif' }}>Adicionar Item ao Cardápio</h3>
            <div>
              <label className="block text-sm font-medium text-[#7a6650] mb-1.5">Categoria *</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ProductCategory }))} className="w-full px-3 py-2 border rounded-lg" style={{ borderColor: '#d9cfc2' }}>
                <option value="CARNE">Carne (vendida por grama)</option>
                <option value="ACOMPANHAMENTO">Acompanhamento</option>
                <option value="CALDO">Caldo</option>
                <option value="BEBIDA">Bebida</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#7a6650] mb-1.5">Nome *</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" style={{ borderColor: '#d9cfc2' }} placeholder={isMeat ? 'Ex: Linguiça' : 'Ex: Mandioca Frita'} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#7a6650] mb-1.5">Descrição</label>
              <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" style={{ borderColor: '#d9cfc2' }} placeholder="Ex: Crocante por fora, macia por dentro." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#7a6650] mb-1.5">{isMeat ? 'Preço por kg (R$) *' : 'Preço (R$) *'}</label>
                <input inputMode="decimal" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" style={{ borderColor: '#d9cfc2' }} placeholder={isMeat ? '178,00' : '22,00'} />
              </div>
              {isMeat ? (
                <div>
                  <label className="block text-sm font-medium text-[#7a6650] mb-1.5">Mínimo (g) *</label>
                  <input inputMode="numeric" value={form.minGrams} onChange={(e) => setForm((f) => ({ ...f, minGrams: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" style={{ borderColor: '#d9cfc2' }} />
                </div>
              ) : <div />}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#7a6650] mb-1.5">{isMeat ? 'Estoque inicial (kg)' : 'Estoque inicial (unidades)'}</label>
              <input inputMode="decimal" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" style={{ borderColor: '#d9cfc2' }} placeholder="0" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowCreate(false)} disabled={saving} className="flex-1 py-2 rounded-lg font-semibold" style={{ background: '#f0f0f0', color: '#7a6650' }}>Cancelar</button>
              <button onClick={handleCreate} disabled={saving} className="flex-1 py-2 rounded-lg font-semibold text-white" style={{ background: '#3d5c3a', opacity: saving ? 0.6 : 1 }}>{saving ? 'Salvando…' : 'Adicionar'}</button>
            </div>
          </div>
        </div>
      )}

      {toRemove && (
        <ConfirmModal
          title="Remover Item"
          message={<>Remover <strong>{toRemove.name}</strong> do cardápio? Ele deixa de aparecer para os garçons. Pedidos antigos continuam no histórico.</>}
          confirmLabel="Remover"
          tone="danger"
          loading={removing}
          onConfirm={confirmRemove}
          onCancel={() => setToRemove(null)}
        />
      )}
    </div>
  )
}
