'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Table, closeTable, PaymentMethod } from '@/lib/api/tables'
import { getTableAccount, TableAccount } from '@/lib/api/orders'
import { money, weight, toCents, centsToInput, PAYMENT_LABEL } from '@/lib/utils/format'

interface TableAccountModalProps {
  table: Table
  onClose: () => void
  onClosed: () => void
}

interface PaymentLine {
  method: PaymentMethod | null
  amount: string // R$ digitado
  installments: number
  received: string // dinheiro entregue pelo cliente (só para calcular troco)
}

const METHODS: PaymentMethod[] = ['DINHEIRO', 'PIX', 'DEBITO', 'CREDITO']
const MAX_INSTALLMENTS = 12

export default function TableAccountModal({ table, onClose, onClosed }: TableAccountModalProps) {
  const [account, setAccount] = useState<TableAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [closing, setClosing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [lines, setLines] = useState<PaymentLine[]>([])

  useEffect(() => {
    getTableAccount(table.id)
      .then(setAccount)
      .catch((e) => toast.error(e.message || 'Erro ao carregar a conta'))
      .finally(() => setLoading(false))
  }, [table.id])

  const items = account?.orders.flatMap((o) => o.items) ?? []
  const inKitchen = account?.orders.filter((o) => o.status === 'PENDING' || o.status === 'PREPARING').length ?? 0
  const total = account?.total ?? 0
  const needsPayment = total > 0

  const cents = (l: PaymentLine) => { const c = toCents(l.amount); return Number.isFinite(c) ? c : 0 }
  const paid = lines.reduce((s, l) => s + cents(l), 0)
  const remaining = total - paid
  const paymentOk = !needsPayment || (lines.length > 0 && lines.every((l) => l.method && cents(l) > 0) && remaining === 0)

  const startClosing = () => {
    setLines([{ method: null, amount: centsToInput(total), installments: 1, received: '' }])
    setConfirming(true)
  }

  const updateLine = (i: number, patch: Partial<PaymentLine>) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))

  const addLine = () =>
    setLines((ls) => [...ls, { method: null, amount: remaining > 0 ? centsToInput(remaining) : '', installments: 1, received: '' }])

  const removeLine = (i: number) => setLines((ls) => ls.filter((_, idx) => idx !== i))

  const handleClose = async () => {
    if (!paymentOk) {
      toast.error(lines.some((l) => !l.method) ? 'Escolha a forma de pagamento' : 'A soma dos pagamentos precisa ser igual ao total')
      return
    }
    setClosing(true)
    try {
      const payments = needsPayment
        ? lines.map((l) => ({ method: l.method as PaymentMethod, amount: cents(l), installments: l.method === 'CREDITO' ? l.installments : 1 }))
        : []
      const res = await closeTable(table.id, payments)
      toast.success(`Conta da mesa ${table.identifier} fechada — ${money(res.total)}`)
      onClosed()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao fechar a conta')
    } finally {
      setClosing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-[#2a1f14]" style={{ fontFamily: 'Georgia, serif' }}>Conta — Mesa {table.identifier}</h3>
          <button onClick={onClose} className="text-2xl text-[#7a6650]" aria-label="Fechar">×</button>
        </div>

        {table.clientName && (
          <div className="mb-4 p-3 rounded-lg" style={{ background: '#f5f0eb' }}>
            <p className="text-xs" style={{ color: '#8a7060' }}>Cliente</p>
            <p className="font-semibold text-[#2a1f14]">{table.clientName}</p>
          </div>
        )}

        {loading ? (
          <div className="h-32 rounded-xl animate-pulse" style={{ background: '#f5f0eb' }} />
        ) : (
          <>
            <div className="mb-4 space-y-1">
              {items.length === 0 ? (
                <p className="text-center py-4 text-[#7a6650]">Nenhum item consumido</p>
              ) : (
                items.map((it) => (
                  <div key={it.id} className="flex justify-between text-sm text-[#2a1f14] py-1">
                    <span>{it.productName} <span style={{ color: '#8a7060' }}>{it.isMeat ? weight(it.quantity) : `x${it.quantity}`}</span></span>
                    <span>{money(it.subtotal)}</span>
                  </div>
                ))
              )}
            </div>
            {account && (
              <div className="border-t pt-3 space-y-1" style={{ borderColor: '#d9cfc2' }}>
                <div className="flex justify-between text-sm"><span style={{ color: '#7a6650' }}>Subtotal</span><span>{money(account.subtotal)}</span></div>
                <div className="flex justify-between text-sm"><span style={{ color: '#7a6650' }}>Taxa de serviço (10%)</span><span style={{ color: '#c45c2a' }}>{money(account.serviceFee)}</span></div>
                <div className="flex justify-between text-lg font-bold pt-1"><span className="text-[#2a1f14]">Total</span><span style={{ color: '#c45c2a' }}>{money(account.total)}</span></div>
              </div>
            )}
            {inKitchen > 0 && (
              <p className="text-xs mt-3 p-2 rounded-lg" style={{ background: 'rgba(232,160,74,0.15)', color: '#9a5f14' }}>
                ⏳ {inKitchen} {inKitchen === 1 ? 'pedido ainda está' : 'pedidos ainda estão'} na cozinha. A conta só pode ser fechada quando estiverem prontos.
              </p>
            )}
          </>
        )}

        {confirming ? (
          <div className="mt-5 p-3 rounded-xl space-y-3" style={{ background: '#f5f0eb' }}>
            {!needsPayment ? (
              <p className="text-sm text-[#2a1f14]">Liberar a mesa <strong>{table.identifier}</strong> sem consumo?</p>
            ) : (
              <>
                <p className="text-sm font-semibold text-[#2a1f14]">Forma de pagamento</p>
                {lines.map((l, i) => {
                  const amount = cents(l)
                  const received = toCents(l.received)
                  const change = l.method === 'DINHEIRO' && Number.isFinite(received) ? received - amount : NaN
                  return (
                    <div key={i} className="p-3 rounded-lg bg-white space-y-2" style={{ border: '1px solid #e8ddd2' }}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold" style={{ color: '#7a6650' }}>{lines.length > 1 ? `Pagamento ${i + 1}` : 'Pagamento'}</span>
                        {lines.length > 1 && (
                          <button onClick={() => removeLine(i)} className="text-xs font-semibold" style={{ color: '#d9534f' }}>Remover</button>
                        )}
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {METHODS.map((m) => {
                          const active = l.method === m
                          return (
                            <button
                              key={m}
                              onClick={() => updateLine(i, { method: m, installments: 1 })}
                              className="py-2 rounded-lg text-xs font-semibold border"
                              style={{ background: active ? '#3d5c3a' : '#fff', color: active ? '#fff' : '#5a4a3a', borderColor: active ? '#3d5c3a' : '#e8ddd2' }}
                            >
                              <span className="block text-base leading-none mb-0.5">{PAYMENT_LABEL[m].icon}</span>
                              {PAYMENT_LABEL[m].label}
                            </button>
                          )
                        })}
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-[11px] mb-0.5" style={{ color: '#8a7060' }}>Valor (R$)</label>
                          <input inputMode="decimal" value={l.amount} onChange={(e) => updateLine(i, { amount: e.target.value })} className="w-full px-2 py-1.5 border rounded-lg text-sm" style={{ borderColor: '#d9cfc2' }} />
                        </div>
                        {l.method === 'CREDITO' && (
                          <div className="flex-1">
                            <label className="block text-[11px] mb-0.5" style={{ color: '#8a7060' }}>Parcelas</label>
                            <select value={l.installments} onChange={(e) => updateLine(i, { installments: Number(e.target.value) })} className="w-full px-2 py-1.5 border rounded-lg text-sm bg-white" style={{ borderColor: '#d9cfc2' }}>
                              {Array.from({ length: MAX_INSTALLMENTS }, (_, k) => k + 1).map((n) => (
                                <option key={n} value={n}>{n === 1 ? 'À vista' : `${n}x de ${money(Math.round(amount / n))}`}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        {l.method === 'DINHEIRO' && (
                          <div className="flex-1">
                            <label className="block text-[11px] mb-0.5" style={{ color: '#8a7060' }}>Recebido (troco)</label>
                            <input inputMode="decimal" value={l.received} onChange={(e) => updateLine(i, { received: e.target.value })} placeholder="Opcional" className="w-full px-2 py-1.5 border rounded-lg text-sm" style={{ borderColor: '#d9cfc2' }} />
                          </div>
                        )}
                      </div>
                      {Number.isFinite(change) && (
                        <p className="text-xs font-semibold" style={{ color: change >= 0 ? '#3d5c3a' : '#d9534f' }}>
                          {change >= 0 ? `Troco: ${money(change)}` : `Faltam ${money(-change)} do cliente`}
                        </p>
                      )}
                    </div>
                  )
                })}
                <div className="flex items-center justify-between gap-2">
                  <button onClick={addLine} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: '#fff', color: '#3d5c3a', border: '1px dashed #3d5c3a' }}>+ Dividir pagamento</button>
                  <span className="text-xs font-semibold" style={{ color: remaining === 0 ? '#3d5c3a' : '#d9534f' }}>
                    {remaining === 0 ? '✓ Valor completo' : remaining > 0 ? `Falta ${money(remaining)}` : `Passou ${money(-remaining)}`}
                  </span>
                </div>
              </>
            )}
            <div className="flex gap-2">
              <button onClick={() => setConfirming(false)} disabled={closing} className="flex-1 py-2 rounded-lg font-semibold text-sm" style={{ background: '#fff', color: '#7a6650' }}>Voltar</button>
              <button onClick={handleClose} disabled={closing || !paymentOk} className="flex-1 py-2 rounded-lg font-semibold text-sm text-white disabled:opacity-40" style={{ background: '#3d5c3a', opacity: closing ? 0.6 : undefined }}>
                {closing ? 'Fechando…' : needsPayment ? `Confirmar ${money(total)}` : 'Confirmar'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3 pt-5">
            <button onClick={onClose} className="flex-1 py-2 rounded-lg font-semibold text-sm" style={{ background: '#f0f0f0', color: '#7a6650' }}>Voltar</button>
            <button onClick={startClosing} disabled={loading} className="flex-1 py-2 rounded-lg font-semibold text-sm text-white disabled:opacity-40" style={{ background: '#3d5c3a' }}>{items.length === 0 && !loading ? 'Liberar Mesa' : 'Fechar Conta'}</button>
          </div>
        )}
      </div>
    </div>
  )
}
