'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { AppUser, UserRole, createUser, deleteUser, resetUserPassword, setUserActive } from '@/lib/api/users'
import { ROLE_LABEL } from '@/lib/utils/format'
import ConfirmModal from '@/components/ui/ConfirmModal'

const ROLE_STYLE: Record<string, { bg: string; fg: string }> = {
  ADMIN: { bg: 'rgba(196,92,42,0.15)', fg: '#c45c2a' },
  GERENTE: { bg: 'rgba(122,102,80,0.15)', fg: '#7a6650' },
  GARCOM: { bg: 'rgba(61,92,58,0.15)', fg: '#3d5c3a' },
  COZINHA: { bg: 'rgba(124,92,196,0.15)', fg: '#6b4fb8' },
  CAIXA: { bg: 'rgba(42,31,20,0.08)', fg: '#5a4a3a' },
}

type Pending = { kind: 'delete' | 'reset' | 'toggle'; user: AppUser } | null

interface UsersTabProps {
  users: AppUser[]
  loading: boolean
  currentUserId?: string
  onChange: () => void
}

export default function UsersTab({ users, loading, currentUserId, onChange }: UsersTabProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', username: '', role: 'GARCOM' as UserRole })
  const [creating, setCreating] = useState(false)
  const [pending, setPending] = useState<Pending>(null)
  const [busy, setBusy] = useState(false)

  const handleCreate = async () => {
    if (!form.name.trim() || !form.username.trim()) {
      toast.error('Preencha o nome e o usuário')
      return
    }
    setCreating(true)
    try {
      await createUser({ name: form.name.trim(), username: form.username.trim().toLowerCase(), role: form.role })
      toast.success(`Usuário ${form.name.trim()} criado! Senha inicial: 123`)
      setForm({ name: '', username: '', role: 'GARCOM' })
      setShowCreate(false)
      onChange()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao criar usuário')
    } finally {
      setCreating(false)
    }
  }

  const confirmPending = async () => {
    if (!pending) return
    setBusy(true)
    const { kind, user } = pending
    try {
      if (kind === 'delete') {
        await deleteUser(user.id)
        toast.success(`Usuário ${user.name} excluído`)
      } else if (kind === 'reset') {
        await resetUserPassword(user.id)
        toast.success(`Senha de ${user.name} redefinida para 123`)
      } else {
        await setUserActive(user.id, !user.active)
        toast.success(`Usuário ${user.name} ${user.active ? 'desativado' : 'reativado'}`)
      }
      setPending(null)
      onChange()
    } catch (e: any) {
      toast.error(e.message || 'Não foi possível concluir a ação')
    } finally {
      setBusy(false)
    }
  }

  // Sugere o login a partir do primeiro nome
  const suggestUsername = (name: string) =>
    name.trim().split(/\s+/)[0]?.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '') ?? ''

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#2a1f14]" style={{ fontFamily: 'Georgia, serif' }}>Gerenciar Usuários</h2>
        <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 rounded-xl font-semibold" style={{ background: '#3d5c3a', color: '#faf6ef' }}>+ Criar Usuário</button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="rounded-2xl animate-pulse" style={{ background: '#f5f0eb', height: '68px' }} />)}</div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => {
            const isMe = u.id === currentUserId
            const rs = ROLE_STYLE[u.role] ?? ROLE_STYLE.CAIXA
            return (
              <div key={u.id} className="rounded-2xl p-4 flex flex-wrap items-center gap-2" style={{ background: '#fff9f2', border: '1px solid #d9cfc2', opacity: u.active ? 1 : 0.6 }}>
                <div className="flex-1 min-w-[140px]">
                  <p className="font-semibold text-[#2a1f14]">{u.name}{isMe && <span className="text-xs font-normal" style={{ color: '#8a7060' }}> (você)</span>}</p>
                  <p className="text-xs" style={{ color: '#8a7060' }}>{u.username}</p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: rs.bg, color: rs.fg }}>{ROLE_LABEL[u.role] ?? u.role}</span>
                {!u.active ? (
                  <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.06)', color: '#7a6650' }}>Inativo</span>
                ) : u.needsPasswordChange ? (
                  <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(232,160,74,0.18)', color: '#b8741f' }}>Aguardando 1º acesso</span>
                ) : (
                  <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(61,92,58,0.15)', color: '#3d5c3a' }}>✓ Ativo</span>
                )}
                {!isMe && (
                  <>
                    <button onClick={() => setPending({ kind: 'reset', user: u })} className="px-3 py-1.5 rounded-lg text-xs font-semibold border" style={{ borderColor: '#e8ddd2', color: '#7a6650' }}>Resetar senha</button>
                    <button onClick={() => setPending({ kind: 'toggle', user: u })} className="px-3 py-1.5 rounded-lg text-xs font-semibold border" style={{ borderColor: '#e8ddd2', color: '#7a6650' }}>{u.active ? 'Desativar' : 'Reativar'}</button>
                    <button onClick={() => setPending({ kind: 'delete', user: u })} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'rgba(217,83,79,0.12)', color: '#d9534f' }}>Excluir</button>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-xl font-bold text-[#2a1f14]" style={{ fontFamily: 'Georgia, serif' }}>Criar Novo Usuário</h3>
            <div>
              <label className="block text-sm font-medium text-[#7a6650] mb-1.5">Nome *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value
                  setForm((f) => ({ ...f, name, username: f.username && f.username !== suggestUsername(f.name) ? f.username : suggestUsername(name) }))
                }}
                className="w-full px-3 py-2 border rounded-lg"
                style={{ borderColor: '#d9cfc2' }}
                placeholder="Ex: João da Silva"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#7a6650] mb-1.5">Usuário (login) *</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.toLowerCase().replace(/\s/g, '') }))}
                className="w-full px-3 py-2 border rounded-lg"
                style={{ borderColor: '#d9cfc2' }}
                placeholder="Ex: joao"
                autoCapitalize="none"
              />
              <p className="text-xs mt-1" style={{ color: '#8a7060' }}>Letras minúsculas, números, ponto ou hífen.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#7a6650] mb-1.5">Função *</label>
              <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))} className="w-full px-3 py-2 border rounded-lg" style={{ borderColor: '#d9cfc2' }}>
                <option value="GARCOM">Garçom</option>
                <option value="CAIXA">Caixa</option>
                <option value="COZINHA">Cozinha</option>
                <option value="GERENTE">Gerente</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
            <p className="text-xs" style={{ color: '#7a6650' }}>ℹ️ A senha inicial será <strong>123</strong> e o usuário deverá trocá-la no primeiro acesso.</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowCreate(false)} disabled={creating} className="flex-1 py-2 rounded-lg font-semibold" style={{ background: '#f0f0f0', color: '#7a6650' }}>Cancelar</button>
              <button onClick={handleCreate} disabled={creating} className="flex-1 py-2 rounded-lg font-semibold text-white" style={{ background: '#3d5c3a', opacity: creating ? 0.6 : 1 }}>{creating ? 'Criando…' : 'Criar'}</button>
            </div>
          </div>
        </div>
      )}

      {pending && (
        <ConfirmModal
          title={pending.kind === 'delete' ? 'Excluir Usuário' : pending.kind === 'reset' ? 'Resetar Senha' : pending.user.active ? 'Desativar Usuário' : 'Reativar Usuário'}
          message={
            pending.kind === 'delete' ? (
              <>Excluir <strong>{pending.user.name}</strong>? Esta ação não pode ser desfeita. Se o usuário já lançou pedidos, desative-o em vez de excluir.</>
            ) : pending.kind === 'reset' ? (
              <>Redefinir a senha de <strong>{pending.user.name}</strong> para <strong>123</strong>? Ele precisará criar uma nova senha no próximo acesso.</>
            ) : pending.user.active ? (
              <><strong>{pending.user.name}</strong> não conseguirá mais entrar no sistema até ser reativado. O histórico de pedidos é mantido.</>
            ) : (
              <><strong>{pending.user.name}</strong> poderá voltar a entrar no sistema.</>
            )
          }
          confirmLabel={pending.kind === 'delete' ? 'Excluir' : pending.kind === 'reset' ? 'Resetar' : pending.user.active ? 'Desativar' : 'Reativar'}
          tone={pending.kind === 'delete' ? 'danger' : 'primary'}
          loading={busy}
          onConfirm={confirmPending}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  )
}
