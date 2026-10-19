'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { listLogs, AuditLog } from '@/lib/api/reports'
import { time } from '@/lib/utils/format'

const ACTION: Record<string, { label: string; dot: string; bg: string; fg: string }> = {
  CONTA_FECHADA: { label: 'Conta fechada', dot: '#3d5c3a', bg: 'rgba(61,92,58,0.15)', fg: '#3d5c3a' },
  STATUS_ALTERADO: { label: 'Status alterado', dot: '#4a7bd0', bg: 'rgba(74,123,208,0.15)', fg: '#3a64ad' },
  PEDIDO_LANCADO: { label: 'Pedido lançado', dot: '#c45c2a', bg: 'rgba(196,92,42,0.15)', fg: '#c45c2a' },
  MESA_ABERTA: { label: 'Mesa aberta', dot: '#e8a04a', bg: 'rgba(232,160,74,0.18)', fg: '#b8741f' },
  SENHA_RESETADA: { label: 'Senha resetada', dot: '#e8a04a', bg: 'rgba(232,160,74,0.18)', fg: '#b8741f' },
  USUARIO_CRIADO: { label: 'Usuário criado', dot: '#6b4fb8', bg: 'rgba(107,79,184,0.15)', fg: '#6b4fb8' },
  USUARIO_EXCLUIDO: { label: 'Usuário excluído', dot: '#d9534f', bg: 'rgba(217,83,79,0.15)', fg: '#d9534f' },
  USUARIO_DESATIVADO: { label: 'Usuário desativado', dot: '#7a6650', bg: 'rgba(122,102,80,0.15)', fg: '#7a6650' },
  USUARIO_ATIVADO: { label: 'Usuário reativado', dot: '#3d5c3a', bg: 'rgba(61,92,58,0.15)', fg: '#3d5c3a' },
  ITEM_CRIADO: { label: 'Item adicionado', dot: '#6b4fb8', bg: 'rgba(107,79,184,0.15)', fg: '#6b4fb8' },
  ITEM_REMOVIDO: { label: 'Item removido', dot: '#d9534f', bg: 'rgba(217,83,79,0.15)', fg: '#d9534f' },
  ESTOQUE_AJUSTADO: { label: 'Estoque ajustado', dot: '#7a6650', bg: 'rgba(122,102,80,0.15)', fg: '#7a6650' },
}

export default function LogsTab() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setLogs(await listLogs())
    } catch (e: any) {
      toast.error(e.message || 'Erro ao carregar logs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#2a1f14]" style={{ fontFamily: 'Georgia, serif' }}>Logs do Sistema</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-full border" style={{ borderColor: '#d9cfc2', color: '#7a6650' }}>Hoje · {logs.length} {logs.length === 1 ? 'registro' : 'registros'}</span>
          <button onClick={load} className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: '#f0f0f0', color: '#7a6650' }}>↻ Atualizar</button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3, 4].map((i) => <div key={i} className="rounded-xl animate-pulse" style={{ background: '#f5f0eb', height: '56px' }} />)}</div>
      ) : logs.length === 0 ? (
        <p className="text-center py-12" style={{ color: '#8a7060' }}>Nenhuma atividade registrada hoje.</p>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: '#fff9f2', border: '1px solid #d9cfc2' }}>
          {logs.map((l, i) => {
            const a = ACTION[l.action] ?? { label: l.action, dot: '#7a6650', bg: 'rgba(0,0,0,0.06)', fg: '#7a6650' }
            return (
              <div key={l.id} className="px-4 py-3 flex items-start gap-3" style={{ borderTop: i === 0 ? 'none' : '1px solid #ece3d8' }}>
                <span className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: a.dot }} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: a.bg, color: a.fg }}>{a.label}</span>
                    <span className="text-xs font-semibold text-[#2a1f14]">{l.actor}</span>
                    <span className="text-xs" style={{ color: '#8a7060' }}>{time(l.createdAt)}</span>
                  </div>
                  <p className="text-sm mt-0.5" style={{ color: '#5a4a3a' }}>{l.details}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
