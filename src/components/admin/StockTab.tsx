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

export default function StockTab({ products, loading, onChange }: StockTabProps) {
  const [deltas, setDeltas] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)

  const low = products.filter((p) => p.lowStock)

  // Carne: ajustes em kg (estoque guardado em gramas). Demais: em unidades.
  const factor = (p: Product) => (p.isMeat ? 1000 : 1)

  const apply = async (p: Product, deltaInDisplayUnit: number) => {
    const next = p.stock + Math.round(deltaInDisplayUnit * factor(p))
    if (next < 0) { toast.error('O estoque não pode ficar negativo'); return }
    setSaving(p.id)
    try {
      await adjustStock(p.id, next)
      setDeltas((d) => ({ ...d, [p.id]: '' }))
      onChange()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao ajustar estoque')
    } finally {
      setSaving(null)
    }
  }

  const applyCustom = (p: Product) => {
    const raw = (deltas[p.id] ?? '').replace(',', '.').trim()
    const value = parseFloat(raw)
    if (!raw || !Number.isFinite(value) || value === 0) {
      toast.error(p.isMeat ? 'Digite quantos kg somar (ex: 5) ou tirar (ex: -2,5)' : 'Digite quantas unidades somar (ex: 12) ou tirar (ex: -3)')
      return
    }
    apply(p, value)
  }

  const grouped: Record<string, Product[]> = {}
  products.forEach((p) => { (grouped[p.category] = grouped[p.category] || []).push(p) })

  const btn = 'w-9 h-8 rounded-lg text-xs font-semibold border disabled:opacity-40'

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
                  const busy = saving === p.id
                  const unit = p.isMeat ? 'kg' : 'un'
                  return (
                    <div key={p.id} className="rounded-2xl p-3 flex flex-wrap items-center gap-3" style={{ background: '#fff9f2', border: `1px solid ${p.lowStock ? 'rgba(232,160,74,0.6)' : '#d9cfc2'}` }}>
                      <div className="flex-1 min-w-[150px]">
                        <p className="font-semibold text-[#2a1f14] text-sm">{p.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-24 h-1.5 rounded-full" style={{ background: '#ece3d8' }}>
                            <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: p.lowStock ? '#e8a04a' : '#3d5c3a' }} />
                          </div>
                          <span className="text-xs font-medium" style={{ color: p.lowStock ? '#b8741f' : '#7a6650' }}>
                            {p.isMeat ? weight(p.stock) : `${p.stock} un`}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button disabled={busy} onClick={() => apply(p, -5)} className={btn} style={{ borderColor: '#e8ddd2', color: '#7a6650' }}>−5</button>
                        <button disabled={busy} onClick={() => apply(p, -1)} className={btn} style={{ borderColor: '#e8ddd2', color: '#7a6650' }}>−1</button>
                        <button disabled={busy} onClick={() => apply(p, 1)} className={`${btn} text-white`} style={{ background: '#3d5c3a', borderColor: '#3d5c3a' }}>+1</button>
                        <button disabled={busy} onClick={() => apply(p, 10)} className={btn} style={{ background: 'rgba(61,92,58,0.12)', borderColor: 'transparent', color: '#3d5c3a' }}>+10</button>
                        <input
                          inputMode="decimal"
                          value={deltas[p.id] ?? ''}
                          onChange={(e) => setDeltas((d) => ({ ...d, [p.id]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === 'Enter') applyCustom(p) }}
                          placeholder={`± ${unit}`}
                          className="w-16 h-8 px-2 rounded-lg border text-xs text-center"
                          style={{ borderColor: '#e8ddd2' }}
                          aria-label={`Ajuste de estoque de ${p.name} em ${unit}`}
                        />
                        <button disabled={busy} onClick={() => applyCustom(p)} className="h-8 px-3 rounded-lg text-xs font-semibold text-white" style={{ background: '#c45c2a' }}>OK</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          <p className="text-xs" style={{ color: '#8a7060' }}>Carnes são controladas em kg (os botões somam ou tiram kg). Os demais itens, em unidades. O estoque também baixa automaticamente a cada pedido lançado.</p>
        </div>
      )}
    </div>
  )
}
