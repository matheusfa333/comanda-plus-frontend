'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { getReports, Reports, ReportPeriod } from '@/lib/api/reports'
import { money, weight, CATEGORY_LABEL } from '@/lib/utils/format'

type ReportKey = 'revenue' | 'employees' | 'beers' | 'meats' | 'categories' | 'ticket'

const REPORTS: { key: ReportKey; icon: string; label: string }[] = [
  { key: 'revenue', icon: '💰', label: 'Faturamento' },
  { key: 'employees', icon: '🏆', label: 'Funcionário que Mais Vendeu' },
  { key: 'beers', icon: '🍺', label: 'Cervejas Mais Vendidas' },
  { key: 'meats', icon: '🥩', label: 'Carnes com Mais Saída' },
  { key: 'categories', icon: '📊', label: 'Vendas por Categoria' },
  { key: 'ticket', icon: '🧾', label: 'Ticket Médio por Mesa' },
]

const PERIODS: { key: ReportPeriod; label: string }[] = [
  { key: 'today', label: 'Hoje' },
  { key: '7d', label: 'Últimos 7 dias' },
  { key: '30d', label: 'Últimos 30 dias' },
]

function Bars({ rows }: { rows: { label: string; value: number; display: string; hint?: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <div className="space-y-3">
      {rows.map((r, i) => (
        <div key={r.label}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-[#2a1f14] font-medium">{i === 0 ? '🥇 ' : ''}{r.label}{r.hint && <span className="text-xs font-normal" style={{ color: '#8a7060' }}> · {r.hint}</span>}</span>
            <span className="font-semibold" style={{ color: '#c45c2a' }}>{r.display}</span>
          </div>
          <div className="h-2 rounded-full" style={{ background: '#ece3d8' }}>
            <div className="h-2 rounded-full" style={{ width: `${(r.value / max) * 100}%`, background: i === 0 ? '#c45c2a' : '#d9a37f' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ReportsTab() {
  const [period, setPeriod] = useState<ReportPeriod>('today')
  const [selected, setSelected] = useState<ReportKey>('revenue')
  const [data, setData] = useState<Reports | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await getReports(period))
    } catch (e: any) {
      toast.error(e.message || 'Erro ao carregar relatórios')
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => { load() }, [load])

  const empty = <p className="text-center py-10" style={{ color: '#8a7060' }}>Nenhuma venda fechada no período.</p>
  const periodLabel = PERIODS.find((p) => p.key === period)?.label.toLowerCase()

  const render = () => {
    if (!data) return null
    switch (selected) {
      case 'revenue':
        return data.revenue.accounts === 0 ? empty : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><p className="text-xs" style={{ color: '#7a6650' }}>Vendas (sem taxa)</p><p className="text-2xl font-bold text-[#2a1f14]" style={{ fontFamily: 'Georgia, serif' }}>{money(data.revenue.subtotal)}</p></div>
            <div><p className="text-xs" style={{ color: '#7a6650' }}>Taxa de serviço (10%)</p><p className="text-2xl font-bold" style={{ color: '#3d5c3a', fontFamily: 'Georgia, serif' }}>{money(data.revenue.serviceFee)}</p></div>
            <div><p className="text-xs" style={{ color: '#7a6650' }}>Total recebido</p><p className="text-2xl font-bold" style={{ color: '#c45c2a', fontFamily: 'Georgia, serif' }}>{money(data.revenue.total)}</p></div>
            <p className="sm:col-span-3 text-xs" style={{ color: '#8a7060' }}>{data.revenue.accounts} {data.revenue.accounts === 1 ? 'conta fechada' : 'contas fechadas'} ({periodLabel}).</p>
          </div>
        )
      case 'employees':
        return data.topEmployees.length === 0 ? empty : (
          <Bars rows={data.topEmployees.map((e) => ({ label: e.name, value: e.subtotal, display: money(e.subtotal), hint: `${e.orders} ${e.orders === 1 ? 'pedido' : 'pedidos'}` }))} />
        )
      case 'beers':
        return data.topBeers.length === 0 ? empty : (
          <Bars rows={data.topBeers.map((b) => ({ label: b.name, value: b.quantity, display: `${b.quantity} un`, hint: money(b.subtotal) }))} />
        )
      case 'meats':
        return data.topMeats.length === 0 ? empty : (
          <Bars rows={data.topMeats.map((m) => ({ label: m.name, value: m.grams, display: weight(m.grams), hint: money(m.subtotal) }))} />
        )
      case 'categories':
        return data.byCategory.length === 0 ? empty : (
          <Bars rows={data.byCategory.map((c) => ({ label: CATEGORY_LABEL[c.category] ?? c.category, value: c.subtotal, display: money(c.subtotal) }))} />
        )
      case 'ticket':
        return data.revenue.accounts === 0 ? empty : (
          <div>
            <p className="text-xs" style={{ color: '#7a6650' }}>Valor médio por conta fechada (com taxa)</p>
            <p className="text-4xl font-bold mt-1" style={{ color: '#c45c2a', fontFamily: 'Georgia, serif' }}>{money(data.averageTicket)}</p>
            <p className="text-xs mt-2" style={{ color: '#8a7060' }}>Base: {data.revenue.accounts} {data.revenue.accounts === 1 ? 'conta' : 'contas'} ({periodLabel}).</p>
          </div>
        )
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold text-[#2a1f14]" style={{ fontFamily: 'Georgia, serif' }}>Relatórios</h2>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#f0e8de' }}>
          {PERIODS.map((p) => (
            <button key={p.key} onClick={() => setPeriod(p.key)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: period === p.key ? '#fff9f2' : 'transparent', color: period === p.key ? '#2a1f14' : '#7a6650' }}>{p.label}</button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {REPORTS.map((r) => (
          <button key={r.key} onClick={() => setSelected(r.key)} className="px-4 py-2 rounded-xl text-sm font-medium border" style={{ background: selected === r.key ? '#c45c2a' : '#fff9f2', color: selected === r.key ? '#faf6ef' : '#2a1f14', borderColor: selected === r.key ? '#c45c2a' : '#d9cfc2' }}>
            {r.icon} {r.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl p-6" style={{ background: '#fff9f2', border: '1px solid #d9cfc2' }}>
        <p className="font-semibold mb-4 text-[#2a1f14]">{REPORTS.find((r) => r.key === selected)?.icon} {REPORTS.find((r) => r.key === selected)?.label}</p>
        {loading ? <div className="h-32 rounded-xl animate-pulse" style={{ background: '#f5f0eb' }} /> : render()}
      </div>
      <p className="text-xs mt-3" style={{ color: '#8a7060' }}>Os relatórios consideram apenas contas já fechadas.</p>
    </div>
  )
}
