'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { listClosedAccounts, ClosedAccountsResult } from '@/lib/api/reports'
import { money, weight, time, dateTime, todayISO, PAYMENT_LABEL } from '@/lib/utils/format'
import { Payment } from '@/lib/api/tables'
import DateRangeFilter from '@/components/ui/DateRangeFilter'

const duration = (from: string, to: string) => {
  const min = Math.max(0, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60000))
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}`
}

const paymentText = (p: Payment) =>
  `${PAYMENT_LABEL[p.method]?.label ?? p.method}${p.method === 'CREDITO' && p.installments > 1 ? ` ${p.installments}x` : ''}`

export default function ClosedAccountsTab() {
  const [range, setRange] = useState({ from: todayISO(), to: todayISO() })
  const [data, setData] = useState<ClosedAccountsResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await listClosedAccounts(range.from, range.to))
    } catch (e: any) {
      toast.error(e.message || 'Erro ao carregar as mesas fechadas')
    } finally {
      setLoading(false)
    }
  }, [range])

  useEffect(() => { load() }, [load])

  const multiDay = range.from !== range.to
  const accounts = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q || !data) return data?.accounts ?? []
    return data.accounts.filter((a) =>
      a.tableIdentifier.toLowerCase().includes(q) ||
      (a.clientName ?? '').toLowerCase().includes(q) ||
      a.closedBy.toLowerCase().includes(q) ||
      a.payments.some((p) => paymentText(p).toLowerCase().includes(q)) ||
      a.orders.some((o) => o.waiter.toLowerCase().includes(q)),
    )
  }, [data, search])
  const divergent = data?.accounts.filter((a) => a.divergent).length ?? 0

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 className="text-2xl font-bold text-[#2a1f14]" style={{ fontFamily: 'Georgia, serif' }}>Mesas Fechadas</h2>
        <button onClick={load} className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: '#f0f0f0', color: '#7a6650' }}>↻ Atualizar</button>
      </div>

      <div className="rounded-2xl p-4 mb-5" style={{ background: '#fff9f2', border: '1px solid #d9cfc2' }}>
        <DateRangeFilter from={range.from} to={range.to} onChange={setRange} />
      </div>

      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[
            { l: 'Contas fechadas', v: String(data.summary.count), c: '#2a1f14' },
            { l: 'Vendas (sem taxa)', v: money(data.summary.subtotal), c: '#2a1f14' },
            { l: 'Taxa de serviço', v: money(data.summary.serviceFee), c: '#3d5c3a' },
            { l: 'Total recebido', v: money(data.summary.total), c: '#c45c2a' },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl p-4" style={{ background: '#fff9f2', border: '1px solid #d9cfc2' }}>
              <p className="text-xs" style={{ color: '#7a6650' }}>{s.l}</p>
              <p className="text-xl font-bold mt-1" style={{ color: s.c, fontFamily: 'Georgia, serif' }}>{s.v}</p>
            </div>
          ))}
        </div>
      )}

      {data && data.summary.byPayment.length > 0 && (
        <div className="rounded-2xl p-4 mb-5" style={{ background: '#fff9f2', border: '1px solid #d9cfc2' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: '#7a6650' }}>Recebido por forma de pagamento</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {data.summary.byPayment.map((m) => (
              <div key={m.method}>
                <p className="text-sm text-[#2a1f14]">{PAYMENT_LABEL[m.method]?.icon} {PAYMENT_LABEL[m.method]?.label ?? m.method}</p>
                <p className="font-bold" style={{ color: '#c45c2a' }}>{money(m.amount)}</p>
                <p className="text-[11px]" style={{ color: '#8a7060' }}>{m.count} {m.count === 1 ? 'pagamento' : 'pagamentos'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {divergent > 0 && (
        <p className="text-sm mb-4 p-3 rounded-xl" style={{ background: 'rgba(217,83,79,0.08)', color: '#b03a2e', border: '1px solid rgba(217,83,79,0.25)' }}>
          ⚠ {divergent} {divergent === 1 ? 'conta tem' : 'contas têm'} diferença entre pedidos, valor cobrado e pagamentos. Abra a conta para conferir.
        </p>
      )}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍 Filtrar por mesa, cliente, funcionário ou pagamento (ex: pix)..."
        className="w-full px-4 py-2.5 rounded-xl border mb-4 text-sm"
        style={{ borderColor: '#d9cfc2', background: '#fff' }}
      />

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: '#f5f0eb' }} />)}</div>
      ) : accounts.length === 0 ? (
        <p className="text-center py-12" style={{ color: '#8a7060' }}>{search ? 'Nenhuma conta encontrada com esse filtro.' : 'Nenhuma mesa fechada no período.'}</p>
      ) : (
        <div className="space-y-2">
          {accounts.map((a) => {
            const expanded = open === a.id
            return (
              <div key={a.id} className="rounded-2xl overflow-hidden" style={{ background: '#fff9f2', border: `1px solid ${a.divergent ? 'rgba(217,83,79,0.5)' : '#d9cfc2'}` }}>
                <button onClick={() => setOpen(expanded ? null : a.id)} className="w-full text-left p-4 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="text-lg" style={{ color: '#c45c2a' }}>{expanded ? '▾' : '▸'}</span>
                  <div className="min-w-[120px]">
                    <p className="font-semibold text-[#2a1f14]">Mesa {a.tableIdentifier}</p>
                    {a.clientName && <p className="text-xs" style={{ color: '#8a7060' }}>👤 {a.clientName}</p>}
                  </div>
                  <div className="text-xs flex-1 min-w-[180px]" style={{ color: '#7a6650' }}>
                    <p>{multiDay ? dateTime(a.openedAt) : time(a.openedAt)} → {multiDay ? dateTime(a.closedAt) : time(a.closedAt)} <span style={{ color: '#8a7060' }}>({duration(a.openedAt, a.closedAt)})</span></p>
                    <p>Fechada por <strong>{a.closedBy}</strong> · {a.orders.length} {a.orders.length === 1 ? 'pedido' : 'pedidos'}</p>
                    {a.payments.length > 0 && <p>{a.payments.map((p) => `${PAYMENT_LABEL[p.method]?.icon ?? ''} ${paymentText(p)}`).join(' + ')}</p>}
                  </div>
                  {a.divergent && <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(217,83,79,0.12)', color: '#d9534f' }}>⚠ divergência</span>}
                  <span className="font-bold text-lg" style={{ color: '#c45c2a' }}>{money(a.total)}</span>
                </button>

                {expanded && (
                  <div className="px-4 pb-4 pt-1 border-t" style={{ borderColor: '#ece3d8' }}>
                    {a.orders.length === 0 ? (
                      <p className="text-sm py-3" style={{ color: '#8a7060' }}>Mesa fechada sem consumo.</p>
                    ) : (
                      a.orders.map((o) => (
                        <div key={o.id} className="mt-3">
                          <p className="text-xs font-semibold mb-1" style={{ color: '#7a6650' }}>Pedido às {time(o.createdAt)} · lançado por {o.waiter}</p>
                          <table className="w-full text-sm">
                            <tbody>
                              {o.items.map((it, i) => (
                                <tr key={i} className="border-b last:border-0" style={{ borderColor: '#f0e8de' }}>
                                  <td className="py-1 text-[#2a1f14]">{it.productName}</td>
                                  <td className="py-1 text-right whitespace-nowrap" style={{ color: '#7a6650' }}>{it.isMeat ? weight(it.quantity) : `${it.quantity} un`}</td>
                                  <td className="py-1 pl-3 text-right whitespace-nowrap text-xs" style={{ color: '#8a7060' }}>{it.isMeat ? `${money(it.unitPrice)}/kg` : `${money(it.unitPrice)} cada`}</td>
                                  <td className="py-1 pl-3 text-right whitespace-nowrap font-medium text-[#2a1f14]">{money(it.subtotal)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))
                    )}
                    <div className="mt-3 pt-2 border-t text-sm space-y-0.5" style={{ borderColor: '#ece3d8' }}>
                      <div className="flex justify-between"><span style={{ color: '#7a6650' }}>Subtotal</span><span>{money(a.subtotal)}</span></div>
                      <div className="flex justify-between"><span style={{ color: '#7a6650' }}>Taxa de serviço (10%)</span><span>{money(a.serviceFee)}</span></div>
                      <div className="flex justify-between font-bold"><span>Total cobrado</span><span style={{ color: '#c45c2a' }}>{money(a.total)}</span></div>
                      {a.payments.length > 0 ? (
                        <div className="pt-2">
                          <p className="text-xs font-semibold mb-0.5" style={{ color: '#7a6650' }}>Pagamento</p>
                          {a.payments.map((p, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span>{PAYMENT_LABEL[p.method]?.icon} {paymentText(p)}{p.method === 'CREDITO' && p.installments > 1 && <span className="text-xs" style={{ color: '#8a7060' }}> (de {money(Math.round(p.amount / p.installments))})</span>}</span>
                              <span>{money(p.amount)}</span>
                            </div>
                          ))}
                        </div>
                      ) : a.total > 0 && (
                        <p className="text-xs pt-1" style={{ color: '#8a7060' }}>Forma de pagamento não registrada.</p>
                      )}
                      {a.divergent && (
                        <p className="text-xs pt-1" style={{ color: '#d9534f' }}>
                          ⚠ Conferir: pedidos somam {money(a.orders.reduce((s, o) => s + o.subtotal, 0))} (subtotal cobrado {money(a.subtotal)}){a.payments.length > 0 && <> e os pagamentos somam {money(a.payments.reduce((s, p) => s + p.amount, 0))} (total {money(a.total)})</>}.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      <p className="text-xs mt-3" style={{ color: '#8a7060' }}>Contas fechadas antes desta atualização não aparecem aqui, pois o registro detalhado de cada fechamento começou agora.</p>
    </div>
  )
}
