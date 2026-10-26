'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { listUsers, AppUser } from '@/lib/api/users'
import { listProducts, Product } from '@/lib/api/products'
import { listTables, openTable, Table } from '@/lib/api/tables'
import { getTableAccount, listKitchenOrders, updateOrderStatus, TableAccount, KitchenOrder } from '@/lib/api/orders'
import { money, weight, time } from '@/lib/utils/format'
import AddItemsModal from '@/components/AddItemsModal'
import TableAccountModal from '@/components/TableAccountModal'
import UsersTab from '@/components/admin/UsersTab'
import MenuTab from '@/components/admin/MenuTab'
import StockTab from '@/components/admin/StockTab'
import ReportsTab from '@/components/admin/ReportsTab'
import LogsTab from '@/components/admin/LogsTab'
import ClosedAccountsTab from '@/components/admin/ClosedAccountsTab'

const STATUS_LABEL: Record<string, string> = { PENDING: 'Aguardando', PREPARING: 'Em preparo', READY: 'Pronto', DELIVERED: 'Entregue' }
const NEXT_STATUS: Record<string, string> = { PENDING: 'PREPARING', PREPARING: 'READY', READY: 'DELIVERED' }
const NEXT_LABEL: Record<string, string> = { PENDING: 'Iniciar preparo', PREPARING: 'Marcar pronto', READY: 'Marcar entregue' }

const card = { background: '#fff9f2', border: '1px solid #d9cfc2' }
const Title = ({ t, s }: { t: string; s: string }) => (
  <div>
    <h1 className="text-4xl font-bold text-[#2a1f14]" style={{ fontFamily: 'Georgia, serif' }}>{t}</h1>
    <p className="text-[#7a6650] mt-2">{s}</p>
  </div>
)
const Stat = ({ label, value, color }: { label: string; value: React.ReactNode; color: string }) => (
  <div className="rounded-2xl p-5" style={card}>
    <p className="text-xs font-medium" style={{ color: '#7a6650' }}>{label}</p>
    <p className="text-3xl font-bold mt-2" style={{ color, fontFamily: 'Georgia, serif' }}>{value}</p>
  </div>
)

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [users, setUsers] = useState<AppUser[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [kitchen, setKitchen] = useState<KitchenOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'users' | 'menu' | 'stock' | 'closed' | 'reports' | 'logs'>('users')
  const [managerTab, setManagerTab] = useState<'tables' | 'closed' | 'reports'>('tables')

  const [showOpen, setShowOpen] = useState(false)
  const [identifier, setIdentifier] = useState('')
  const [clientName, setClientName] = useState('')
  const [opening, setOpening] = useState(false)
  const [selected, setSelected] = useState<Table | null>(null)
  const [modal, setModal] = useState<'orders' | 'account' | 'addItems' | null>(null)
  const [account, setAccount] = useState<TableAccount | null>(null)

  useEffect(() => {
    const s = localStorage.getItem('user')
    if (s) setUser(JSON.parse(s))
  }, [])

  const role = user?.role
  const safe = async (fn: () => Promise<void>, msg: string) => {
    try { await fn() } catch (e: any) { toast.error(e.message || msg) }
  }

  const loadAdmin = useCallback(() => safe(async () => {
    const [u, p, t] = await Promise.all([listUsers(), listProducts(), listTables()])
    setUsers(u); setProducts(p); setTables(t)
  }, 'Erro ao carregar o painel'), [])
  const loadTables = useCallback(() => safe(async () => setTables(await listTables()), 'Erro ao carregar mesas'), [])
  const loadKitchen = useCallback(() => safe(async () => setKitchen(await listKitchenOrders()), 'Erro ao carregar a fila'), [])

  useEffect(() => {
    if (!role) return
    const load = role === 'ADMIN' ? loadAdmin : role === 'COZINHA' ? loadKitchen : loadTables
    load().finally(() => setLoading(false))
    // Atualiza sozinho a cada 15s (cozinha, caixa e salão)
    if (role === 'ADMIN') return
    const id = setInterval(load, 15000)
    return () => clearInterval(id)
  }, [role, loadAdmin, loadTables, loadKitchen])

  const occupied = tables.filter((t) => t.status === 'OCCUPIED')

  const handleOpen = async () => {
    if (!identifier.trim()) { toast.error('Informe o número ou identificador da mesa'); return }
    setOpening(true)
    await safe(async () => {
      await openTable({ identifier: identifier.trim(), clientName: clientName.trim() || undefined })
      toast.success(`Mesa ${identifier.trim()} aberta`)
      setShowOpen(false); setIdentifier(''); setClientName('')
      await loadTables()
    }, 'Erro ao abrir mesa')
    setOpening(false)
  }

  const openOrders = async (t: Table) => {
    setSelected(t); setModal('orders'); setAccount(null)
    await safe(async () => setAccount(await getTableAccount(t.id)), 'Erro ao carregar pedidos')
  }

  // ============ ADMIN ============
  if (role === 'ADMIN') {
    const lowCount = products.filter((p) => p.lowStock).length
    const TABS = [
      { k: 'users', l: '👥 Usuários' }, { k: 'menu', l: '🍽️ Cardápio' }, { k: 'stock', l: '📦 Estoque' },
      { k: 'closed', l: '🧾 Mesas Fechadas' }, { k: 'reports', l: '📊 Relatórios' }, { k: 'logs', l: '📋 Logs' },
    ] as const
    return (
      <div className="space-y-6">
        <Title t="Painel de Administração" s="Gerenciar usuários, cardápio, estoque, relatórios e sistema" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Stat label="Usuários Ativos" value={users.filter((u) => u.active).length} color="#c45c2a" />
          <Stat label="Mesas Ocupadas" value={occupied.length} color="#3d5c3a" />
          <Stat label="Itens no Cardápio" value={products.length} color="#2a1f14" />
        </div>
        {lowCount > 0 && (
          <button onClick={() => setTab('stock')} className="w-full text-left rounded-2xl p-4 flex items-center gap-3" style={{ background: 'rgba(217,83,79,0.07)', border: '1px solid rgba(217,83,79,0.3)' }}>
            <span className="text-2xl">⚠️</span>
            <div><p className="text-xs font-semibold" style={{ color: '#c0392b' }}>Estoque Baixo</p><p className="text-2xl font-bold" style={{ color: '#c0392b', fontFamily: 'Georgia, serif' }}>{lowCount} {lowCount === 1 ? 'item' : 'itens'}</p></div>
          </button>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {TABS.map((x) => (
            <button key={x.k} onClick={() => setTab(x.k)} className="py-3 rounded-xl font-semibold text-sm" style={{ background: tab === x.k ? '#c45c2a' : '#fff9f2', color: tab === x.k ? '#faf6ef' : '#2a1f14', border: '1px solid ' + (tab === x.k ? '#c45c2a' : '#d9cfc2') }}>{x.l}</button>
          ))}
        </div>
        {tab === 'users' && <UsersTab users={users} loading={loading} currentUserId={user?.id} onChange={loadAdmin} />}
        {tab === 'menu' && <MenuTab products={products} loading={loading} onChange={loadAdmin} />}
        {tab === 'stock' && <StockTab products={products} loading={loading} onChange={loadAdmin} />}
        {tab === 'closed' && <ClosedAccountsTab />}
        {tab === 'reports' && <ReportsTab />}
        {tab === 'logs' && <LogsTab />}
      </div>
    )
  }

  // ============ COZINHA ============
  if (role === 'COZINHA') {
    const advance = (o: KitchenOrder) => safe(async () => { await updateOrderStatus(o.id, NEXT_STATUS[o.status]); await loadKitchen() }, 'Erro ao atualizar status')
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Title t="Fila de Pedidos" s="Pedidos aguardando preparo" />
          <button onClick={loadKitchen} className="px-4 py-2 rounded-xl font-semibold text-sm" style={{ background: '#f0f0f0', color: '#7a6650' }}>↻ Atualizar</button>
        </div>
        {loading ? <div className="h-32 rounded-2xl animate-pulse" style={{ background: '#f5f0eb' }} /> : kitchen.length === 0 ? (
          <p className="text-center py-12 text-lg text-[#7a6650]">Nenhum pedido no momento</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {kitchen.map((o) => {
              const hot = o.status === 'PREPARING'
              return (
                <div key={o.id} className="rounded-2xl p-4" style={{ background: hot ? 'rgba(196,92,42,0.08)' : o.status === 'READY' ? 'rgba(61,92,58,0.08)' : '#fff9f2', border: `1.5px solid ${hot ? '#c45c2a' : o.status === 'READY' ? '#3d5c3a' : '#d9cfc2'}` }}>
                  <div className="flex items-start justify-between mb-2">
                    <div><p className="font-semibold text-[#2a1f14]">Mesa {o.tableIdentifier}</p><p className="text-xs" style={{ color: '#7a6650' }}>{o.clientName ?? ''} · {time(o.createdAt)}</p></div>
                    <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: 'rgba(0,0,0,0.06)', color: '#2a1f14' }}>{STATUS_LABEL[o.status] ?? o.status}</span>
                  </div>
                  {o.items.map((it, i) => <p key={i} className="text-sm text-[#2a1f14]">• {it.productName} <strong>{it.isMeat ? weight(it.quantity) : `x${it.quantity}`}</strong></p>)}
                  {NEXT_STATUS[o.status] && (
                    <div className="flex justify-end pt-3"><button onClick={() => advance(o)} className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: '#3d5c3a' }}>{NEXT_LABEL[o.status]}</button></div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const isManager = role === 'GERENTE'

  // ============ GERENTE: abas extras ============
  if (isManager && managerTab !== 'tables') {
    return (
      <div className="space-y-6">
        <ManagerTabs value={managerTab} onChange={setManagerTab} />
        {managerTab === 'closed' ? <ClosedAccountsTab /> : <ReportsTab />}
      </div>
    )
  }

  // ============ GARÇOM / GERENTE ============
  return (
    <div className="space-y-6">
      {isManager && <ManagerTabs value={managerTab} onChange={setManagerTab} />}
      <Title t="Gerenciamento de Mesas" s={isManager ? 'Mesas em funcionamento e fechamento de contas' : 'Mesas em funcionamento'} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Mesas Ocupadas" value={occupied.length} color="#c45c2a" />
        <Stat label={isManager ? 'Em aberto (sem taxa)' : 'Pedidos na cozinha'} value={isManager ? money(occupied.reduce((s, t) => s + t.subtotal, 0)) : occupied.reduce((s, t) => s + t.pendingOrders, 0)} color="#3d5c3a" />
        <Stat label="Mesas Livres" value={tables.filter((t) => t.status === 'FREE').length} color="#7a6650" />
      </div>
      <button onClick={() => setShowOpen(true)} className="px-6 py-3 rounded-xl font-semibold" style={{ background: '#3d5c3a', color: '#faf6ef' }}>+ Abrir Nova Mesa</button>

      {loading ? <div className="h-32 rounded-2xl animate-pulse" style={{ background: '#f5f0eb' }} /> : occupied.length === 0 ? (
        <div className="rounded-2xl py-12 text-center" style={card}><p className="text-3xl mb-2">🍽️</p><p className="text-[#7a6650]">Nenhuma mesa aberta no momento</p></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {occupied.map((t) => (
            <div key={t.id} className="rounded-2xl p-4 flex flex-col gap-2" style={{ background: 'rgba(196,92,42,0.05)', border: '1.5px solid #c45c2a' }}>
              <div className="flex justify-between items-start">
                <div><p className="text-xs" style={{ color: '#8a7060' }}>Mesa</p><p className="text-2xl font-bold text-[#2a1f14] leading-none" style={{ fontFamily: 'Georgia, serif' }}>{t.identifier}</p></div>
                {t.pendingOrders > 0 && <span className="text-[10px] px-2 py-1 rounded-full font-semibold" style={{ background: 'rgba(232,160,74,0.2)', color: '#9a5f14' }}>{t.pendingOrders} na cozinha</span>}
              </div>
              {t.clientName && <p className="text-xs px-2 py-1 rounded-lg truncate" style={{ background: 'rgba(232,160,74,0.15)', color: '#9a5f14' }}>👤 {t.clientName}</p>}
              <p className="text-sm font-semibold" style={{ color: '#c45c2a' }}>{money(Math.round(t.subtotal * 1.1))} <span className="text-[10px] font-normal" style={{ color: '#8a7060' }}>c/ taxa</span></p>
              <div className="flex gap-1 mt-1">
                <button onClick={() => openOrders(t)} className="flex-1 py-1.5 rounded-xl text-xs font-semibold" style={{ background: '#c45c2a', color: '#faf6ef' }}>Pedidos</button>
                <button onClick={() => { setSelected(t); setModal('account') }} className="flex-1 py-1.5 rounded-xl text-xs font-semibold" style={{ background: isManager ? '#3d5c3a' : '#8a7060', color: '#faf6ef' }}>{isManager ? 'Fechar conta' : 'Conta'}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-xl font-bold text-[#2a1f14]" style={{ fontFamily: 'Georgia, serif' }}>Abrir Nova Mesa</h3>
            <div>
              <label className="block text-sm font-medium text-[#7a6650] mb-1.5">Número / Identificador *</label>
              <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="w-full px-3 py-2 border rounded-lg" style={{ borderColor: '#d9cfc2' }} placeholder="Ex: 5, A3, Varanda..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#7a6650] mb-1.5">Nome do cliente <span className="font-normal">(opcional)</span></label>
              <input value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full px-3 py-2 border rounded-lg" style={{ borderColor: '#d9cfc2' }} placeholder="Ex: João Silva" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowOpen(false)} disabled={opening} className="flex-1 py-2 rounded-lg font-semibold" style={{ background: '#f0f0f0', color: '#7a6650' }}>Cancelar</button>
              <button onClick={handleOpen} disabled={opening} className="flex-1 py-2 rounded-lg font-semibold text-white" style={{ background: '#c45c2a', opacity: opening ? 0.6 : 1 }}>{opening ? 'Abrindo…' : 'Abrir'}</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'orders' && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#2a1f14]" style={{ fontFamily: 'Georgia, serif' }}>Pedidos — Mesa {selected.identifier}</h3>
              <button onClick={() => setModal(null)} className="text-2xl text-[#7a6650]" aria-label="Fechar">×</button>
            </div>
            {!account ? <div className="h-24 rounded-xl animate-pulse" style={{ background: '#f5f0eb' }} /> : account.orders.length === 0 ? (
              <p className="text-center py-6 text-[#7a6650]">Nenhum pedido lançado ainda</p>
            ) : (
              <div className="space-y-3">
                {account.orders.map((o) => (
                  <div key={o.id} className="p-3 rounded-lg border" style={{ borderColor: '#e8ddd2' }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: 'rgba(61,92,58,0.15)', color: '#3d5c3a' }}>{STATUS_LABEL[o.status] ?? o.status} · {time(o.createdAt)}</span>
                      <span className="text-sm font-semibold" style={{ color: '#c45c2a' }}>{money(o.subtotal)}</span>
                    </div>
                    {o.items.map((it) => <p key={it.id} className="text-sm text-[#2a1f14]">• {it.productName} {it.isMeat ? weight(it.quantity) : `x${it.quantity}`} — {money(it.subtotal)}</p>)}
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setModal('addItems')} className="w-full mt-4 py-3 rounded-lg font-semibold text-white" style={{ background: '#c45c2a' }}>+ Adicionar Itens</button>
          </div>
        </div>
      )}

      {modal === 'addItems' && selected && (
        <AddItemsModal tableId={selected.id} tableIdentifier={selected.identifier} onClose={() => openOrders(selected)} onSuccess={loadTables} />
      )}

      {modal === 'account' && selected && (
        <TableAccountModal table={selected} onClose={() => setModal(null)} onClosed={() => { setModal(null); setSelected(null); loadTables() }} />
      )}
    </div>
  )
}

function ManagerTabs({ value, onChange }: { value: 'tables' | 'closed' | 'reports'; onChange: (v: 'tables' | 'closed' | 'reports') => void }) {
  const tabs = [
    { k: 'tables', l: '🍽️ Mesas' },
    { k: 'closed', l: '🧾 Mesas Fechadas' },
    { k: 'reports', l: '📊 Relatórios' },
  ] as const
  return (
    <div className="grid grid-cols-3 gap-2">
      {tabs.map((x) => (
        <button key={x.k} onClick={() => onChange(x.k)} className="py-3 rounded-xl font-semibold text-sm" style={{ background: value === x.k ? '#c45c2a' : '#fff9f2', color: value === x.k ? '#faf6ef' : '#2a1f14', border: '1px solid ' + (value === x.k ? '#c45c2a' : '#d9cfc2') }}>{x.l}</button>
      ))}
    </div>
  )
}
