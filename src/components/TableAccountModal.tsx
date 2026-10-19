'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Table, closeTable } from '@/lib/api/tables'
import { getTableAccount, TableAccount } from '@/lib/api/orders'
import { money, weight } from '@/lib/utils/format'

interface TableAccountModalProps {
  table: Table
  onClose: () => void
  onClosed: () => void
}

export default function TableAccountModal({ table, onClose, onClosed }: TableAccountModalProps) {
  const [account, setAccount] = useState<TableAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [closing, setClosing] = useState(false)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    getTableAccount(table.id)
      .then(setAccount)
      .catch((e) => toast.error(e.message || 'Erro ao carregar a conta'))
      .finally(() => setLoading(false))
  }, [table.id])

  const items = account?.orders.flatMap((o) => o.items) ?? []
  const inKitchen = account?.orders.filter((o) => o.status === 'PENDING' || o.status === 'PREPARING').length ?? 0

  const handleClose = async () => {
    setClosing(true)
    try {
      const res = await closeTable(table.id)
      toast.success(`Conta da mesa ${table.identifier} fechada — ${money(res.total)}`)
      onClosed()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao fechar a conta')
      setConfirming(false)
    } finally {
      setClosing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto">
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
            <p className="text-sm text-[#2a1f14]">{items.length === 0 ? <>Liberar a mesa <strong>{table.identifier}</strong> sem consumo?</> : <>Confirmar o pagamento de <strong>{money(account?.total ?? 0)}</strong> e liberar a mesa?</>}</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirming(false)} disabled={closing} className="flex-1 py-2 rounded-lg font-semibold text-sm" style={{ background: '#fff', color: '#7a6650' }}>Voltar</button>
              <button onClick={handleClose} disabled={closing} className="flex-1 py-2 rounded-lg font-semibold text-sm text-white" style={{ background: '#3d5c3a', opacity: closing ? 0.6 : 1 }}>{closing ? 'Fechando…' : 'Confirmar'}</button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3 pt-5">
            <button onClick={onClose} className="flex-1 py-2 rounded-lg font-semibold text-sm" style={{ background: '#f0f0f0', color: '#7a6650' }}>Voltar</button>
            <button onClick={() => setConfirming(true)} disabled={loading} className="flex-1 py-2 rounded-lg font-semibold text-sm text-white disabled:opacity-40" style={{ background: '#3d5c3a' }}>{items.length === 0 && !loading ? 'Liberar Mesa' : 'Fechar Conta'}</button>
          </div>
        )}
      </div>
    </div>
  )
}
