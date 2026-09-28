'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { listUsers, createUser, deleteUser, resetUserPassword, AppUser, UserRole } from '@/lib/api/users'
import { listTables, openTable, closeTable, Table } from '@/lib/api/tables'
import { getTableAccount, listKitchenOrders, updateOrderStatus, TableAccount, KitchenOrder } from '@/lib/api/orders'
import AddItemsModal from '@/components/AddItemsModal'

const money = (cents: number) => `R$ ${(cents / 100).toFixed(2)}`

const STATUS_LABEL: { [k: string]: string } = {
  PENDING: 'Aguardando', PREPARING: 'Preparando', READY: 'Pronto', DELIVERED: 'Entregue',
}
const NEXT_STATUS: { [k: string]: string } = {
  PENDING: 'PREPARING', PREPARING: 'READY', READY: 'DELIVERED',
}
const NEXT_LABEL: { [k: string]: string } = {
  PENDING: 'Iniciar preparo', PREPARING: 'Marcar pronto', READY: 'Marcar entregue',
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)

  // Admin
  const [users, setUsers] = useState<AppUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null)
  const [deletingUser, setDeletingUser] = useState(false)
  const [userToReset, setUserToReset] = useState<AppUser | null>(null)
  const [resettingUser, setResettingUser] = useState(false)
  const [showCreateUserModal, setShowCreateUserModal] = useState(false)
  const [newUserName, setNewUserName] = useState('')
  const [newUserRole, setNewUserRole] = useState<UserRole>('GARCOM')
  const [creatingUser, setCreatingUser] = useState(false)
  const [activeAdminTab, setActiveAdminTab] = useState<'users' | 'reports' | 'logs'>('users')

  // Mesas / Pedidos
  const [tables, setTables] = useState<Table[]>([])
  const [loadingTables, setLoadingTables] = useState(false)
  const [showOpenTableModal, setShowOpenTableModal] = useState(false)
  const [tableNumber, setTableNumber] = useState('')
  const [clientName, setClientName] = useState('')
  const [openingTable, setOpeningTable] = useState(false)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [account, setAccount] = useState<TableAccount | null>(null)
  const [loadingAccount, setLoadingAccount] = useState(false)
  const [modal, setModal] = useState<'orders' | 'account' | 'addItems' | null>(null)
  const [closingTable, setClosingTable] = useState(false)

  // Cozinha
  const [kitchen, setKitchen] = useState<KitchenOrder[]>([])
  const [loadingKitchen, setLoadingKitchen] = useState(false)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) setUser(JSON.parse(userStr))
  }, [])

  const isChef = user?.role === 'COZINHA'
  const isAdmin = user?.role === 'ADMIN'

  // ----- Admin: usuários -----
  const loadUsers = useCallback(async () => {
    setLoadingUsers(true)
    try {
      setUsers(await listUsers())
    } catch (e: any) {
      toast.error(e.message || 'Erro ao carregar usuários')
    } finally {
      setLoadingUsers(false)
    }
  }, [])

  const handleCreateUser = async () => {
    if (!newUserName.trim()) { toast.error('Digite o nome do usuário'); return }
    setCreatingUser(true)
    try {
      await createUser({ name: newUserName.trim(), role: newUserRole })
      toast.success(`Usuário ${newUserName.trim()} criado! Senha padrão: 123`)
      setNewUserName(''); setNewUserRole('GARCOM'); setShowCreateUserModal(false)
      await loadUsers()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao criar usuário')
    } finally {
      setCreatingUser(false)
    }
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return
    setDeletingUser(true)
    try {
      await deleteUser(userToDelete.id)
      toast.success(`Usuário ${userToDelete.name} excluído`)
      setUserToDelete(null)
      await loadUsers()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao excluir usuário')
    } finally {
      setDeletingUser(false)
    }
  }

  const confirmResetPassword = async () => {
    if (!userToReset) return
    setResettingUser(true)
    try {
      await resetUserPassword(userToReset.id)
      toast.success(`Senha de ${userToReset.name} redefinida para 123`)
      setUserToReset(null)
      await loadUsers()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao redefinir senha')
    } finally {
      setResettingUser(false)
    }
  }

  // ----- Mesas -----
  const loadTables = useCallback(async () => {
    setLoadingTables(true)
    try {
      setTables(await listTables())
    } catch (e: any) {
      toast.error(e.message || 'Erro ao carregar mesas')
    } finally {
      setLoadingTables(false)
    }
  }, [])

  const handleOpenTable = async () => {
    if (!tableNumber) { toast.error('Digite o número da mesa'); return }
    setOpeningTable(true)
    try {
      await openTable({ number: parseInt(tableNumber), clientName: clientName || undefined })
      toast.success(`Mesa ${tableNumber} aberta`)
      setShowOpenTableModal(false); setTableNumber(''); setClientName('')
      await loadTables()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao abrir mesa')
    } finally {
      setOpeningTable(false)
    }
  }

  const openTableModal = async (table: Table, which: 'orders' | 'account') => {
    setSelectedTable(table)
    setModal(which)
    setLoadingAccount(true)
    try {
      setAccount(await getTableAccount(table.id))
    } catch (e: any) {
      toast.error(e.message || 'Erro ao carregar pedidos')
    } finally {
      setLoadingAccount(false)
    }
  }

  const refreshAccount = async () => {
    if (!selectedTable) return
    try {
      setAccount(await getTableAccount(selectedTable.id))
    } catch { /* ignore */ }
  }

  const handleCloseTable = async () => {
    if (!selectedTable) return
    setClosingTable(true)
    try {
      await closeTable(selectedTable.id)
      toast.success(`Mesa ${selectedTable.number} fechada`)
      setModal(null); setSelectedTable(null); setAccount(null)
      await loadTables()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao fechar mesa')
    } finally {
      setClosingTable(false)
    }
  }

  // ----- Cozinha -----
  const loadKitchen = useCallback(async () => {
    setLoadingKitchen(true)
    try {
      setKitchen(await listKitchenOrders())
    } catch (e: any) {
      toast.error(e.message || 'Erro ao carregar fila')
    } finally {
      setLoadingKitchen(false)
    }
  }, [])

  const advanceStatus = async (order: KitchenOrder) => {
    const next = NEXT_STATUS[order.status]
    if (!next) return
    try {
      await updateOrderStatus(order.id, next)
      await loadKitchen()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao atualizar status')
    }
  }

  // Carregar dados por role
  useEffect(() => {
    if (!user) return
    if (isAdmin) { loadUsers(); loadTables() }
    else if (isChef) { loadKitchen() }
    else { loadTables() }
  }, [user, isAdmin, isChef, loadUsers, loadTables, loadKitchen])

  const occupiedTables = tables.filter((t) => t.status === 'OCCUPIED')

  // ============ ADMIN ============
  if (isAdmin) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-[#2a1f14]" style={{ fontFamily: 'Georgia, serif' }}>Painel de Administração</h1>
          <p className="text-[#7a6650] mt-2">Gerenciar usuários, relatórios e sistema</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="rounded-2xl p-6" style={{ background: '#fff9f2', border: '1px solid #d9cfc2' }}>
            <p className="text-xs font-medium" style={{ color: '#7a6650' }}>Usuários Ativos</p>
            <p className="text-3xl font-bold mt-2" style={{ color: '#c45c2a', fontFamily: 'Georgia, serif' }}>{users.length}</p>
          </div>
          <div className="rounded-2xl p-6" style={{ background: '#fff9f2', border: '1px solid #d9cfc2' }}>
            <p className="text-xs font-medium" style={{ color: '#7a6650' }}>Mesas Ocupadas</p>
            <p className="text-3xl font-bold mt-2" style={{ color: '#3d5c3a', fontFamily: 'Georgia, serif' }}>{occupiedTables.length}</p>
          </div>
          <div className="rounded-2xl p-6" style={{ background: '#fff9f2', border: '1px solid #d9cfc2' }}>
            <p className="text-xs font-medium" style={{ color: '#7a6650' }}>Total de Mesas</p>
            <p className="text-3xl font-bold mt-2" style={{ color: '#7a6650', fontFamily: 'Georgia, serif' }}>{tables.length}</p>
          </div>
        </div>

        <div className="flex gap-4">
          {(['users', 'reports', 'logs'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveAdminTab(tab)}
              className="px-6 py-3 rounded-xl font-semibold transition-all"
              style={{ background: activeAdminTab === tab ? '#c45c2a' : '#f0f0f0', color: activeAdminTab === tab ? '#faf6ef' : '#7a6650' }}>
              {tab === 'users' ? '👥 Usuários' : tab === 'reports' ? '📊 Relatórios' : '📋 Logs'}
            </button>
          ))}
        </div>

        {activeAdminTab === 'users' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#2a1f14]" style={{ fontFamily: 'Georgia, serif' }}>Gerenciar Usuários</h2>
              <button onClick={() => setShowCreateUserModal(true)} className="px-6 py-3 rounded-xl font-semibold" style={{ background: '#3d5c3a', color: '#faf6ef' }}>+ Criar Usuário</button>
            </div>

            {loadingUsers ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="rounded-2xl animate-pulse" style={{ background: '#f5f0eb', border: '1px solid #d9cfc2', height: '72px' }} />)}</div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-[#7a6650]">Nenhum usuário cadastrado</div>
            ) : (
              <div className="space-y-3">
                {users.map((u) => (
                  <div key={u.id} className="rounded-2xl p-4 flex items-center justify-between gap-3" style={{ background: '#fff9f2', border: '1px solid #d9cfc2' }}>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#2a1f14]">{u.name}</p>
                      {u.email && <p className="text-xs truncate" style={{ color: '#7a6650' }}>{u.email}</p>}
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: u.role === 'ADMIN' ? 'rgba(196,92,42,0.2)' : 'rgba(61,92,58,0.2)', color: u.role === 'ADMIN' ? '#c45c2a' : '#3d5c3a' }}>{u.role}</span>
                    <span className="text-xs px-3 py-1 rounded-full" style={{ background: u.needsPasswordChange ? 'rgba(217,83,79,0.2)' : 'rgba(61,92,58,0.15)', color: u.needsPasswordChange ? '#d9534f' : '#3d5c3a' }}>{u.needsPasswordChange ? '⚠️ Trocar senha' : '✓ Ativo'}</span>
                    {u.id !== user?.id && (
                      <>
                        <button onClick={() => setUserToReset(u)} className="px-4 py-2 rounded-lg text-xs font-semibold ml-1 transition-all hover:opacity-80" style={{ background: 'rgba(196,92,42,0.15)', color: '#c45c2a' }}>Resetar senha</button>
                        <button onClick={() => setUserToDelete(u)} className="px-4 py-2 rounded-lg text-xs font-semibold ml-1 transition-all hover:opacity-80" style={{ background: 'rgba(217,83,79,0.15)', color: '#d9534f' }}>Excluir</button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeAdminTab === 'reports' && (
          <div className="text-center py-12 text-[#7a6650]">
            <p className="text-lg">Relatórios em breve</p>
            <p className="text-sm mt-2">Faturamento, ticket médio e itens mais vendidos serão exibidos aqui.</p>
          </div>
        )}
        {activeAdminTab === 'logs' && (
          <div className="text-center py-12 text-[#7a6650]">
            <p className="text-lg">Logs de auditoria em breve</p>
          </div>
        )}

        {showCreateUserModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-96 space-y-4">
              <h3 className="text-xl font-bold text-[#2a1f14]">Criar Novo Usuário</h3>
              <div>
                <label className="block text-sm font-medium text-[#7a6650] mb-2">Nome *</label>
                <input type="text" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} className="w-full px-3 py-2 border rounded-lg" style={{ borderColor: '#d9cfc2' }} placeholder="Ex: João" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#7a6650] mb-2">Função *</label>
                <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value as UserRole)} className="w-full px-3 py-2 border rounded-lg" style={{ borderColor: '#d9cfc2' }}>
                  <option value="GARCOM">Garçom</option>
                  <option value="GERENTE">Gerente</option>
                  <option value="COZINHA">Cozinha</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
              <p className="text-xs" style={{ color: '#7a6650' }}>ℹ️ Senha padrão será: <strong>123</strong></p>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowCreateUserModal(false)} disabled={creatingUser} className="flex-1 py-2 rounded-lg font-semibold" style={{ background: '#f0f0f0', color: '#7a6650' }}>Cancelar</button>
                <button onClick={handleCreateUser} disabled={creatingUser} className="flex-1 py-2 rounded-lg font-semibold text-white" style={{ background: creatingUser ? 'rgba(61,92,58,0.5)' : '#3d5c3a' }}>{creatingUser ? 'Criando…' : 'Criar'}</button>
              </div>
            </div>
          </div>
        )}

        {userToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-96 space-y-4">
              <h3 className="text-xl font-bold text-[#2a1f14]">Excluir Usuário</h3>
              <p className="text-sm" style={{ color: '#7a6650' }}>Tem certeza que deseja excluir <strong>{userToDelete.name}</strong> ({userToDelete.role})? Esta ação não pode ser desfeita.</p>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setUserToDelete(null)} disabled={deletingUser} className="flex-1 py-2 rounded-lg font-semibold" style={{ background: '#f0f0f0', color: '#7a6650' }}>Cancelar</button>
                <button onClick={confirmDeleteUser} disabled={deletingUser} className="flex-1 py-2 rounded-lg font-semibold text-white" style={{ background: deletingUser ? 'rgba(217,83,79,0.5)' : '#d9534f' }}>{deletingUser ? 'Excluindo…' : 'Excluir'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Confirmar Reset de Senha */}
        {userToReset && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-96 space-y-4">
              <h3 className="text-xl font-bold text-[#2a1f14]">Resetar Senha</h3>
              <p className="text-sm" style={{ color: '#7a6650' }}>Redefinir a senha de <strong>{userToReset.name}</strong> para <strong>123</strong>? O usuário precisará criar uma nova senha no próximo login.</p>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setUserToReset(null)} disabled={resettingUser} className="flex-1 py-2 rounded-lg font-semibold" style={{ background: '#f0f0f0', color: '#7a6650' }}>Cancelar</button>
                <button onClick={confirmResetPassword} disabled={resettingUser} className="flex-1 py-2 rounded-lg font-semibold text-white" style={{ background: resettingUser ? 'rgba(196,92,42,0.5)' : '#c45c2a' }}>{resettingUser ? 'Resetando…' : 'Resetar'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ============ COZINHA ============
  if (isChef) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#2a1f14]" style={{ fontFamily: 'Georgia, serif' }}>Fila de Pedidos</h1>
            <p className="text-[#7a6650] mt-2">Pedidos aguardando preparo</p>
          </div>
          <button onClick={loadKitchen} className="px-4 py-2 rounded-xl font-semibold text-sm" style={{ background: '#f0f0f0', color: '#7a6650' }}>↻ Atualizar</button>
        </div>

        {loadingKitchen ? (
          <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="rounded-2xl animate-pulse" style={{ background: '#f5f0eb', height: '120px' }} />)}</div>
        ) : kitchen.length === 0 ? (
          <div className="text-center py-12 text-[#7a6650]"><p className="text-lg">Nenhum pedido no momento</p></div>
        ) : (
          <div className="space-y-3">
            {kitchen.map((order) => {
              const preparing = order.status === 'PREPARING'
              return (
                <div key={order.id} className="rounded-2xl p-4" style={{ background: preparing ? 'rgba(196,92,42,0.1)' : 'rgba(61,92,58,0.1)', border: preparing ? '1.5px solid #c45c2a' : '1.5px solid #3d5c3a' }}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-[#2a1f14]">Mesa {order.tableNumber}</p>
                      {order.clientName && <p className="text-sm" style={{ color: '#7a6650' }}>{order.clientName}</p>}
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: preparing ? 'rgba(196,92,42,0.2)' : 'rgba(61,92,58,0.2)', color: preparing ? '#c45c2a' : '#3d5c3a' }}>{STATUS_LABEL[order.status] || order.status}</span>
                  </div>
                  <div className="mb-3 space-y-1">
                    {order.items.map((item, idx) => (
                      <p key={idx} className="text-sm text-[#2a1f14]">• {item.productName} {item.isMeat ? `${item.quantity}g` : `x${item.quantity}`}</p>
                    ))}
                  </div>
                  {NEXT_STATUS[order.status] && (
                    <div className="flex justify-end pt-2 border-t" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
                      <button onClick={() => advanceStatus(order)} className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: '#3d5c3a' }}>{NEXT_LABEL[order.status]}</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ============ GARÇOM / GERENTE ============
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-[#2a1f14]" style={{ fontFamily: 'Georgia, serif' }}>Gerenciamento de Mesas</h1>
        <p className="text-[#7a6650] mt-2">Mesas em funcionamento</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="rounded-2xl p-6" style={{ background: '#fff9f2', border: '1px solid #d9cfc2' }}>
          <p className="text-xs font-medium" style={{ color: '#7a6650' }}>Mesas Ocupadas</p>
          <p className="text-3xl font-bold mt-2" style={{ color: '#c45c2a', fontFamily: 'Georgia, serif' }}>{occupiedTables.length}</p>
        </div>
        <div className="rounded-2xl p-6" style={{ background: '#fff9f2', border: '1px solid #d9cfc2' }}>
          <p className="text-xs font-medium" style={{ color: '#7a6650' }}>Mesas Livres</p>
          <p className="text-3xl font-bold mt-2" style={{ color: '#3d5c3a', fontFamily: 'Georgia, serif' }}>{tables.filter(t => t.status === 'FREE').length}</p>
        </div>
        <div className="rounded-2xl p-6" style={{ background: '#fff9f2', border: '1px solid #d9cfc2' }}>
          <p className="text-xs font-medium" style={{ color: '#7a6650' }}>Total de Mesas</p>
          <p className="text-3xl font-bold mt-2" style={{ color: '#7a6650', fontFamily: 'Georgia, serif' }}>{tables.length}</p>
        </div>
      </div>

      <div>
        <button onClick={() => setShowOpenTableModal(true)} className="px-6 py-3 rounded-xl font-semibold transition-all hover:opacity-80" style={{ background: '#3d5c3a', color: '#faf6ef' }}>+ Abrir Nova Mesa</button>
      </div>

      <h2 className="text-2xl font-bold text-[#2a1f14]" style={{ fontFamily: 'Georgia, serif' }}>Mesas em Funcionamento</h2>

      {loadingTables ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">{[1, 2, 3].map((i) => <div key={i} className="rounded-2xl animate-pulse" style={{ background: '#f5f0eb', height: '150px' }} />)}</div>
      ) : occupiedTables.length === 0 ? (
        <div className="text-center py-12 text-[#7a6650]"><p className="text-lg">Nenhuma mesa aberta no momento</p></div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {occupiedTables.map((table) => (
            <div key={table.id} className="rounded-2xl p-4 flex flex-col gap-2 transition-all hover:shadow-lg" style={{ background: 'rgba(196,92,42,0.05)', border: '1.5px solid #c45c2a' }}>
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: 'rgba(196,92,42,0.2)' }}>🥩</div>
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(196,92,42,0.2)', color: '#c45c2a', fontWeight: '600' }}>Ocupada</span>
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: '#8a7060' }}>Mesa</p>
                <p className="text-2xl font-bold text-[#2a1f14] leading-none" style={{ fontFamily: 'Georgia, serif' }}>{table.number}</p>
                {table.clientName && <p className="text-xs mt-1 px-2 py-1 rounded-lg truncate" style={{ background: 'rgba(232,160,74,0.15)', color: '#e8a04a' }}>👤 {table.clientName}</p>}
              </div>
              <div className="flex gap-1 mt-1">
                <button onClick={() => openTableModal(table, 'orders')} className="flex-1 py-1.5 rounded-xl text-center text-xs font-semibold transition-all hover:opacity-80" style={{ background: '#c45c2a', color: '#faf6ef' }}>Pedidos</button>
                <button onClick={() => openTableModal(table, 'account')} className="flex-1 py-1.5 rounded-xl text-center text-xs font-semibold transition-all hover:opacity-80" style={{ background: '#8a7060', color: '#faf6ef' }}>Conta</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Abrir Mesa */}
      {showOpenTableModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96 space-y-4">
            <h3 className="text-xl font-bold text-[#2a1f14]">Abrir Mesa</h3>
            <div>
              <label className="block text-sm font-medium text-[#7a6650] mb-2">Número da Mesa *</label>
              <input type="number" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} className="w-full px-3 py-2 border rounded-lg" style={{ borderColor: '#d9cfc2' }} placeholder="Ex: 1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#7a6650] mb-2">Nome do Cliente (opcional)</label>
              <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full px-3 py-2 border rounded-lg" style={{ borderColor: '#d9cfc2' }} placeholder="Nome do cliente" />
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setShowOpenTableModal(false)} disabled={openingTable} className="flex-1 py-2 rounded-lg font-semibold" style={{ background: '#f0f0f0', color: '#7a6650' }}>Cancelar</button>
              <button onClick={handleOpenTable} disabled={openingTable} className="flex-1 py-2 rounded-lg font-semibold text-white" style={{ background: openingTable ? 'rgba(61,92,58,0.5)' : '#3d5c3a' }}>{openingTable ? 'Abrindo…' : 'Abrir'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pedidos */}
      {modal === 'orders' && selectedTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-96 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#2a1f14]">Pedidos - Mesa {selectedTable.number}</h3>
              <button onClick={() => setModal(null)} className="text-2xl text-[#7a6650]">×</button>
            </div>
            {loadingAccount ? (
              <p className="text-center py-6 text-[#7a6650]">Carregando...</p>
            ) : !account || account.orders.length === 0 ? (
              <p className="text-center py-6 text-[#7a6650]">Nenhum pedido lançado ainda</p>
            ) : (
              <div className="space-y-3">
                {account.orders.map((order) => (
                  <div key={order.id} className="p-3 rounded-lg border" style={{ borderColor: '#e8ddd2' }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: 'rgba(61,92,58,0.15)', color: '#3d5c3a' }}>{STATUS_LABEL[order.status] || order.status}</span>
                      <span className="text-sm font-semibold text-[#c45c2a]">{money(order.subtotal)}</span>
                    </div>
                    {order.items.map((it) => (
                      <p key={it.id} className="text-sm text-[#2a1f14]">• {it.productName} {it.isMeat ? `${it.quantity}g` : `x${it.quantity}`} — {money(it.subtotal)}</p>
                    ))}
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setModal('addItems')} className="w-full mt-4 py-3 rounded-lg font-semibold text-white" style={{ background: '#c45c2a' }}>+ Adicionar Itens</button>
            <button onClick={() => setModal(null)} className="w-full mt-2 py-2 rounded-lg font-semibold" style={{ background: '#f0f0f0', color: '#7a6650' }}>Fechar</button>
          </div>
        </div>
      )}

      {/* Modal Conta */}
      {modal === 'account' && selectedTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-96 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#2a1f14]">Conta - Mesa {selectedTable.number}</h3>
              <button onClick={() => setModal(null)} className="text-2xl text-[#7a6650]">×</button>
            </div>
            {selectedTable.clientName && (
              <div className="mb-4 p-3 rounded-lg" style={{ background: '#f5f0eb' }}>
                <p className="text-xs" style={{ color: '#8a7060' }}>Cliente</p>
                <p className="font-semibold text-[#2a1f14]">{selectedTable.clientName}</p>
              </div>
            )}
            {loadingAccount ? (
              <p className="text-center py-6 text-[#7a6650]">Carregando...</p>
            ) : (
              <>
                <div className="mb-4 space-y-1">
                  {account && account.orders.flatMap(o => o.items).length > 0 ? (
                    account.orders.flatMap((o) => o.items).map((it) => (
                      <div key={it.id} className="flex justify-between text-sm text-[#2a1f14] py-1">
                        <span>{it.productName} {it.isMeat ? `(${it.quantity}g)` : `x${it.quantity}`}</span>
                        <span>{money(it.subtotal)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-4 text-[#7a6650]">Nenhum item consumido</p>
                  )}
                </div>
                {account && (
                  <div className="border-t pt-3 space-y-1" style={{ borderColor: '#d9cfc2' }}>
                    <div className="flex justify-between text-sm"><span style={{ color: '#7a6650' }}>Subtotal</span><span>{money(account.subtotal)}</span></div>
                    <div className="flex justify-between text-sm"><span style={{ color: '#7a6650' }}>Taxa garçom (10%)</span><span style={{ color: '#c45c2a' }}>{money(account.serviceFee)}</span></div>
                    <div className="flex justify-between text-lg font-bold pt-1"><span className="text-[#2a1f14]">Total</span><span style={{ color: '#c45c2a' }}>{money(account.total)}</span></div>
                  </div>
                )}
              </>
            )}
            <div className="flex gap-3 pt-6">
              <button onClick={() => setModal(null)} className="flex-1 py-2 rounded-lg font-semibold text-sm" style={{ background: '#f0f0f0', color: '#7a6650' }}>Fechar</button>
              <button onClick={handleCloseTable} disabled={closingTable} className="flex-1 py-2 rounded-lg font-semibold text-sm text-white" style={{ background: closingTable ? 'rgba(61,92,58,0.5)' : '#3d5c3a' }}>{closingTable ? 'Fechando…' : 'Fechar Conta'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar Itens */}
      {modal === 'addItems' && selectedTable && (
        <AddItemsModal
          tableId={selectedTable.id}
          tableNumber={selectedTable.number}
          onClose={() => setModal('orders')}
          onSuccess={refreshAccount}
        />
      )}
    </div>
  )
}
