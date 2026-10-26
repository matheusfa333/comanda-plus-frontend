'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Product, adjustStock } from '@/lib/api/products'
import { weight, CATEGORY_LABEL, CATEGORY_ORDER } from '@/lib/utils/format'

interface StockTabProps {
  products: Product[]
  loading: boolean
  onChange: () => void
}

type Movement = 'ENTRADA' | 'SAIDA' | 'CONTAGEM'

const MOVEMENTS: { key: Movement; icon: string; label: string; hint: string }[] = [
  { key: 'ENTRADA', icon: '📦', label: 'Entrada', hint: 'Chegou mercadoria' },
  { key: 'SAIDA', icon: '🗑️', label: 'Saída', hint: 'Perda, quebra, vencido' },
  { key: 'CONTAGEM', icon: '📋', label: 'Contagem', hint: 'Corrigir pelo inventário' },
]

const REASONS: Record<Movement, string[]> = {
  ENTRADA: ['Compra de fornecedor', 'Devolução', 'Outro'],
  SAIDA: ['Quebra', 'Vencido / estragado', 'Consumo interno', 'Cortesia', 'Outro'],
  CONTAGEM: ['Inventário', 'Erro de lançamento', 'Outro'],
}

const emptyForm = { movement: 'ENTRADA' as Movement, quantity: '', reason: REASONS.ENTRADA[0], note: '' }

export default function StockTab({ products, loading, onChange }: StockTabProps) {
  const [target, setTarget] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const low = products.filter((p) => p.lowStock)

  // Carne: ajustes em kg (estoque guardado em gramas). Demais: em unidades.
  const factor = (p: Product) => (p.isMeat ? 1000 : 1)
  const show = (p: Product, value: number) => (p.isMeat ? weight(value) : `${value} un`)

  const open = (p: Product) => { setTarget(p); setForm(emptyForm) }

  // Novo estoque calculado a partir do movimento escolhido
  const preview = (() => {
    if (!target) return null
    const qty = parseFloat(form.quantity.replace(',', '.'))
    if (!form.quantity.trim() || !Number.isFinite(qty) || qty < 0) return null
    const amount = Math.round(qty * factor(target))
    if (form.movement === 'ENTRADA') return amount > 0 ? target.stock + amount : null
    if (form.movement === 'SAIDA') return amount > 0 ? target.stock - amount : null
    return amount
  })()

  const handleSave = async () => {
    if (!target) return
    if (preview === null) { toast.error(target.isMeat ? 'Digite a quantidade em kg (ex: 5 ou 2,5)' : 'Digite a quantidade em unidades (ex: 12)'); return }
    if (preview < 0) { toast.error('A saída é maior que o estoque atual'); return }
    if (preview === target.stock) { toast.error('O estoque continua igual — nada a ajustar'); return }
    if (form.reason === 'Outro' && !form.note.trim()) { toast.error('Descreva o motivo do ajuste'); return }

    const label = MOVEMENTS.find((m) => m.key === form.movement)!.label
    const detail = form.reason === 'Outro' ? form.note.trim() : form.note.trim() ? `${form.reason}: ${form.note.trim()}` : form.reason
    setSaving(true)
    try {
      await adjustStock(target.id, preview, `${label} · ${detail}`)
      toast.success(`Estoque de ${target.name}: ${show(target, preview)}`)
      setTarget(null)
      onChange()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao ajustar estoque')
    } finally {
      setSaving(false)
    }
  }

  const grouped: Record<string, Product[]> = {}
  products.forEach((p) => { (grouped[p.category] = grouped[p.category] || []).push(p) })

  const unit = target?.isMeat ? 'kg' : 'unidades'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#2a1f14]" style={{ fontFamily: 'Georgia, serif' }}>Estoque</h2>
        {low.length > 0 && (
          <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: 'rgba(217,83,79,0.12)', color: '#d9534f' }}>⚠ {low.length} {low.length === 1 ? 'item' : 'itens'} com estoque baixo</span>
        )}
      </div>

      {low.length > 0 && (
        <div className="rounded-2xl p-4 mb-6" style={{ background: 'rgba(217,83,79,0.06)', border: '1px solid rgba(217,83,79,0.25)' }}>
          <p className="text-sm font-semibold mb-3" style={{ color: '#c0392b' }}>⚠ Itens abaixo do estoque mínimo</p>
          <div className="flex flex-wrap gap-2">
            {low.map((p) => (
              <span key={p.id} className="text-xs px-3 py-1.5 rounded-full" style={{ background: 'rgba(217,83,79,0.12)', color: '#b03a2e' }}>
                {p.name} — {p.isMeat ? weight(p.stock) : `${p.stock} restantes`}
              </span>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3, 4].map((i) => <div key={i} className="rounded-2xl animate-pulse" style={{ background: '#f5f0eb', height: '60px' }} />)}</div>
      ) : (
        <div className="space-y-6">
          {CATEGORY_ORDER.filter((c) => grouped[c]?.length).map((cat) => (
            <div key={cat}>
              <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#c45c2a' }}>{CATEGORY_LABEL[cat]}</p>
              <div className="space-y-2">
                {grouped[cat].map((p) => {
                  const pct = Math.min(100, (p.stock / Math.max(1, p.minStock * 5)) * 100)
                  return (
                    <div key={p.id} className="rounded-2xl p-3 flex flex-wrap items-center gap-3" style={{ background: '#fff9f2', border: `1px solid ${p.lowStock ? 'rgba(232,160,74,0.6)' : '#d9cfc2'}` }}>
                      <div className="flex-1 min-w-[150px]">
                        <p className="font-semibold text-[#2a1f14] text-sm">{p.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-24 h-1.5 rounded-full" style={{ background: '#ece3d8' }}>
                            <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: p.lowStock ? '#e8a04a' : '#3d5c3a' }} />
                          </div>
                          <span className="text-xs font-medium" style={{ color: p.lowStock ? '#b8741f' : '#7a6650' }}>
                            {show(p, p.stock)}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => open(p)} className="px-4 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'rgba(61,92,58,0.12)', color: '#3d5c3a' }}>Ajustar estoque</button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          <p className="text-xs" style={{ color: '#8a7060' }}>Carnes são controladas em kg e os demais itens em unidades. O estoque também baixa automaticamente a cada pedido lançado. Todo ajuste manual fica registrado nos logs com o motivo.</p>
        </div>
      )}

      {target && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-xl font-bold text-[#2a1f14]" style={{ fontFamily: 'Georgia, serif' }}>Ajustar Estoque</h3>
              <p className="text-sm mt-1" style={{ color: '#7a6650' }}>{target.name} · atual <strong>{show(target, target.stock)}</strong></p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#7a6650] mb-1.5">Tipo de movimentação *</label>
              <div className="grid grid-cols-3 gap-2">
                {MOVEMENTS.map((m) => {
                  const active = form.movement === m.key
                  return (
                    <button
                      key={m.key}
                      onClick={() => setForm((f) => ({ ...f, movement: m.key, reason: REASONS[m.key][0] }))}
                      className="p-2 rounded-lg border text-left"
                      style={{ background: active ? 'rgba(61,92,58,0.1)' : '#fff', borderColor: active ? '#3d5c3a' : '#e8ddd2' }}
                    >
                      <p className="text-sm font-semibold" style={{ color: active ? '#3d5c3a' : '#2a1f14' }}>{m.icon} {m.label}</p>
                      <p className="text-[11px] leading-tight" style={{ color: '#8a7060' }}>{m.hint}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#7a6650] mb-1.5">
                {form.movement === 'CONTAGEM' ? `Quantidade contada (${unit}) *` : `Quantidade (${unit}) *`}
              </label>
              <input inputMode="decimal" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" style={{ borderColor: '#d9cfc2' }} placeholder={target.isMeat ? 'Ex: 5 ou 2,5' : 'Ex: 24'} />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#7a6650] mb-1.5">Motivo *</label>
              <select value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} className="w-full px-3 py-2 border rounded-lg bg-white" style={{ borderColor: '#d9cfc2' }}>
                {REASONS[form.movement].map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#7a6650] mb-1.5">Observação{form.reason === 'Outro' ? ' *' : ''}</label>
              <input value={form.note} maxLength={80} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" style={{ borderColor: '#d9cfc2' }} placeholder="Ex: nota fiscal 1234" />
            </div>

            <div className="p-3 rounded-lg text-sm flex justify-between" style={{ background: '#f5f0eb' }}>
              <span style={{ color: '#7a6650' }}>Estoque após o ajuste</span>
              <span className="font-bold" style={{ color: preview !== null && preview < 0 ? '#d9534f' : '#2a1f14' }}>
                {preview === null ? '—' : `${show(target, target.stock)} → ${preview < 0 ? 'negativo' : show(target, preview)}`}
              </span>
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setTarget(null)} disabled={saving} className="flex-1 py-2 rounded-lg font-semibold" style={{ background: '#f0f0f0', color: '#7a6650' }}>Cancelar</button>
              <button onClick={handleSave} disabled={saving || preview === null} className="flex-1 py-2 rounded-lg font-semibold text-white disabled:opacity-40" style={{ background: '#3d5c3a', opacity: saving ? 0.6 : undefined }}>{saving ? 'Salvando…' : 'Confirmar ajuste'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
