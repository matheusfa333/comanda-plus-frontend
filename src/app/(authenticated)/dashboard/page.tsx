'use client'

import { useState, useEffect } from 'react'

const MOCK_TABLES_DATA = [
  { id: '1', number: 1, capacity: 2, status: 'FREE', clientName: null },
  { id: '2', number: 2, capacity: 2, status: 'OCCUPIED', clientName: 'João Silva' },
  { id: '3', number: 3, capacity: 4, status: 'FREE', clientName: null },
  { id: '4', number: 4, capacity: 4, status: 'OCCUPIED', clientName: 'Maria Santos' },
  { id: '5', number: 5, capacity: 6, status: 'FREE', clientName: null },
]

const MOCK_ORDERS = [
  { id: '1', tableNumber: 2, clientName: 'João Silva', items: ['Moqueca de Peixe', 'Refrigerante'], status: 'PENDING', time: '15:30' },
  { id: '2', tableNumber: 4, clientName: 'Maria Santos', items: ['Feijoada', 'Cerveja'], status: 'PREPARING', time: '15:35' },
  { id: '3', tableNumber: 2, clientName: 'João Silva', items: ['Sobremesa'], status: 'PENDING', time: '15:45' },
]

const MOCK_STATS = {
  totalToday: 2400,
  ordersOpen: 2,
  averageTicket: 1200,
}

export default function DashboardPage() {
  const [tables, setTables] = useState(MOCK_TABLES_DATA)
  const [orders, setOrders] = useState(MOCK_ORDERS)
  const [user, setUser] = useState<any>(null)
  const [showOpenTableModal, setShowOpenTableModal] = useState(false)
  const [tableNumber, setTableNumber] = useState('')
  const [clientName, setClientName] = useState('')
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [selectedTableForAccount, setSelectedTableForAccount] = useState<any>(null)
  const [showOrdersModal, setShowOrdersModal] = useState(false)
  const [selectedTableForOrders, setSelectedTableForOrders] = useState<any>(null)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      setUser(JSON.parse(userStr))
    }
  }, [])

  const isChef = user?.role === 'COZINHA'
  const occupiedTables = tables.filter(t => t.status === 'OCCUPIED')

  const handleConfirmOpenTable = () => {
    if (!tableNumber) {
      alert('Digite o número da mesa')
      return
    }

    const newTable = {
      id: Date.now().toString(),
      number: parseInt(tableNumber),
      capacity: 2,
      status: 'OCCUPIED',
      clientName: clientName || null,
    }

    setTables([...tables, newTable])
    setShowOpenTableModal(false)
    setTableNumber('')
    setClientName('')
  }

  const handleCompleteOrder = (orderId: string) => {
    setOrders(orders.filter(o => o.id !== orderId))
  }

  const handleOpenAccountModal = (table: any) => {
    setSelectedTableForAccount(table)
    setShowAccountModal(true)
  }

  const handleOpenOrdersModal = (table: any) => {
    setSelectedTableForOrders(table)
    setShowOrdersModal(true)
  }

  // Calcular total da conta
  const calculateTableTotal = (tableNum: number) => {
    const tableOrders = orders.filter(o => o.tableNumber === tableNum)
    let total = 0
    tableOrders.forEach(order => {
      // Valores mockados (em centavos)
      const itemPrices: { [key: string]: number } = {
        'Moqueca de Peixe': 8500,
        'Feijoada': 6200,
        'Peixe Grelhado': 7200,
        'Churrasco Média Rara': 5500,
        'Refrigerante': 800,
        'Cerveja': 1200,
        'Sobremesa': 2500,
      }
      order.items.forEach((item: string) => {
        total += itemPrices[item] || 5000
      })
    })
    return total
  }

  return (
    <div className="space-y-8">
      {/* Título */}
      <div>
        <h1 className="text-4xl font-bold text-[#2a1f14]" style={{ fontFamily: 'Georgia, serif' }}>
          {isChef ? 'Fila de Pedidos' : 'Gerenciamento de Mesas'}
        </h1>
        <p className="text-[#7a6650] mt-2">
          {isChef ? 'Pedidos aguardando preparo' : 'Mesas em funcionamento'}
        </p>
      </div>

      {/* Stats - Apenas para Admin e Gerente */}
      {!isChef && (user?.role === 'ADMIN' || user?.role === 'GERENTE') && (
        <div className="grid grid-cols-3 gap-6">
          <div className="rounded-2xl p-6" style={{ background: '#fff9f2', border: '1px solid #d9cfc2' }}>
            <p className="text-xs font-medium" style={{ color: '#7a6650' }}>Total do Dia</p>
            <p className="text-3xl font-bold mt-2" style={{ color: '#c45c2a', fontFamily: 'Georgia, serif' }}>
              R$ {(MOCK_STATS.totalToday / 100).toFixed(2)}
            </p>
          </div>

          <div className="rounded-2xl p-6" style={{ background: '#fff9f2', border: '1px solid #d9cfc2' }}>
            <p className="text-xs font-medium" style={{ color: '#7a6650' }}>Pedidos Abertos</p>
            <p className="text-3xl font-bold mt-2" style={{ color: '#3d5c3a', fontFamily: 'Georgia, serif' }}>
              {MOCK_STATS.ordersOpen}
            </p>
          </div>

          <div className="rounded-2xl p-6" style={{ background: '#fff9f2', border: '1px solid #d9cfc2' }}>
            <p className="text-xs font-medium" style={{ color: '#7a6650' }}>Ticket Médio</p>
            <p className="text-3xl font-bold mt-2" style={{ color: '#7a6650', fontFamily: 'Georgia, serif' }}>
              R$ {(MOCK_STATS.averageTicket / 100).toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* COZINHA - Fila de Pedidos */}
      {isChef ? (
        <div>
          <div className="mb-6">
            <button
              onClick={() => setShowOpenTableModal(true)}
              className="px-6 py-3 rounded-xl font-semibold transition-all hover:opacity-80"
              style={{ background: '#3d5c3a', color: '#faf6ef' }}
            >
              + Abrir Nova Mesa
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12" style={{ color: '#7a6650' }}>
              <p className="text-lg">Nenhum pedido no momento</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl p-4"
                  style={{
                    background: order.status === 'PREPARING' ? 'rgba(196,92,42,0.1)' : 'rgba(61,92,58,0.1)',
                    border: order.status === 'PREPARING' ? '1.5px solid #c45c2a' : '1.5px solid #3d5c3a',
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-[#2a1f14]">Mesa {order.tableNumber}</p>
                      <p className="text-sm" style={{ color: '#7a6650' }}>{order.clientName}</p>
                    </div>
                    <span
                      className="text-xs px-3 py-1 rounded-full font-semibold"
                      style={{
                        background: order.status === 'PREPARING' ? 'rgba(196,92,42,0.2)' : 'rgba(61,92,58,0.2)',
                        color: order.status === 'PREPARING' ? '#c45c2a' : '#3d5c3a',
                      }}
                    >
                      {order.status === 'PENDING' ? 'Aguardando' : 'Preparando'}
                    </span>
                  </div>

                  <div className="mb-3 space-y-1">
                    {order.items.map((item, idx) => (
                      <p key={idx} className="text-sm text-[#2a1f14]">
                        • {item}
                      </p>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
                    <p className="text-xs" style={{ color: '#7a6650' }}>Pedido às {order.time}</p>
                    <button
                      onClick={() => handleCompleteOrder(order.id)}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                      style={{ background: '#3d5c3a', color: '#faf6ef' }}
                    >
                      {order.status === 'PENDING' ? 'Preparando' : 'Pronto'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* GARCOM/GERENTE/ADMIN - Mesas Ocupadas */
        <div>
          <div className="mb-6">
            <button
              onClick={() => setShowOpenTableModal(true)}
              className="px-6 py-3 rounded-xl font-semibold transition-all hover:opacity-80"
              style={{ background: '#3d5c3a', color: '#faf6ef' }}
            >
              + Abrir Nova Mesa
            </button>
          </div>

          <h2 className="text-2xl font-bold text-[#2a1f14] mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            Mesas em Funcionamento
          </h2>

          {occupiedTables.length === 0 ? (
            <div className="text-center py-12" style={{ color: '#7a6650' }}>
              <p className="text-lg">Nenhuma mesa aberta no momento</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {occupiedTables.map((table) => (
                <div
                  key={table.id}
                  className="rounded-2xl p-4 flex flex-col gap-2 transition-all hover:shadow-lg"
                  style={{
                    background: 'rgba(196,92,42,0.05)',
                    border: '1.5px solid #c45c2a',
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                         style={{ background: 'rgba(196,92,42,0.2)' }}>
                      🥩
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full"
                          style={{
                            background: 'rgba(196,92,42,0.2)',
                            color: '#c45c2a',
                            fontWeight: '600'
                          }}>
                      Ocupada
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-medium" style={{ color: '#8a7060' }}>Mesa</p>
                    <p className="text-2xl font-bold text-[#2a1f14] leading-none" style={{ fontFamily: 'Georgia, serif' }}>
                      {table.number}
                    </p>
                    {table.clientName && (
                      <p className="text-xs mt-1 px-2 py-1 rounded-lg truncate"
                         style={{ background: 'rgba(232,160,74,0.15)', color: '#e8a04a' }}>
                        👤 {table.clientName}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-1 mt-1">
                    <button
                      onClick={() => handleOpenOrdersModal(table)}
                      className="flex-1 py-1.5 rounded-xl text-center text-xs font-semibold transition-all hover:opacity-80"
                      style={{ background: '#c45c2a', color: '#faf6ef' }}
                    >
                      Pedidos
                    </button>
                    <button
                      onClick={() => handleOpenAccountModal(table)}
                      className="flex-1 py-1.5 rounded-xl text-center text-xs font-semibold transition-all hover:opacity-80"
                      style={{ background: '#8a7060', color: '#faf6ef' }}
                    >
                      Conta
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Abrir Mesa */}
      {showOpenTableModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96 space-y-4">
            <h3 className="text-xl font-bold text-[#2a1f14]">Abrir Mesa</h3>

            <div>
              <label className="block text-sm font-medium text-[#7a6650] mb-2">
                Número da Mesa *
              </label>
              <input
                type="number"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                style={{ borderColor: '#d9cfc2' }}
                placeholder="Ex: 1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#7a6650] mb-2">
                Nome do Cliente (opcional)
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                style={{ borderColor: '#d9cfc2' }}
                placeholder="Nome do cliente"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowOpenTableModal(false)}
                className="flex-1 py-2 rounded-lg font-semibold transition-all"
                style={{ background: '#f0f0f0', color: '#7a6650' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmOpenTable}
                className="flex-1 py-2 rounded-lg font-semibold transition-all hover:opacity-80"
                style={{ background: '#3d5c3a', color: '#faf6ef' }}
              >
                Abrir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Conta (Invoice) */}
      {showAccountModal && selectedTableForAccount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#2a1f14]">Conta - Mesa {selectedTableForAccount.number}</h3>
              <button
                onClick={() => setShowAccountModal(false)}
                className="text-[#7a6650] hover:text-[#2a1f14] text-2xl font-light"
              >
                ×
              </button>
            </div>

            {/* Cliente */}
            {selectedTableForAccount.clientName && (
              <div className="mb-4 p-3 rounded-lg" style={{ background: '#f5f0eb' }}>
                <p className="text-xs" style={{ color: '#8a7060' }}>Cliente</p>
                <p className="font-semibold text-[#2a1f14]">{selectedTableForAccount.clientName}</p>
              </div>
            )}

            {/* Items da Conta */}
            <div className="mb-4">
              <p className="text-xs font-semibold" style={{ color: '#8a7060' }}>Itens</p>
              <div className="space-y-2 mt-2">
                {orders
                  .filter(o => o.tableNumber === selectedTableForAccount.number)
                  .map((order) => (
                    <div key={order.id}>
                      {order.items.map((item: string, idx: number) => {
                        const itemPrices: { [key: string]: number } = {
                          'Moqueca de Peixe': 8500,
                          'Feijoada': 6200,
                          'Peixe Grelhado': 7200,
                          'Churrasco Média Rara': 5500,
                          'Refrigerante': 800,
                          'Cerveja': 1200,
                          'Sobremesa': 2500,
                        }
                        const price = itemPrices[item] || 5000
                        return (
                          <div key={idx} className="flex justify-between text-sm text-[#2a1f14] py-1">
                            <span>{item}</span>
                            <span>R$ {(price / 100).toFixed(2)}</span>
                          </div>
                        )
                      })}
                    </div>
                  ))}
              </div>
            </div>

            {/* Total */}
            <div className="border-t pt-3 mt-4" style={{ borderColor: '#d9cfc2' }}>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-[#2a1f14]">Total</span>
                <span className="text-2xl font-bold" style={{ color: '#c45c2a' }}>
                  R$ {(calculateTableTotal(selectedTableForAccount.number) / 100).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-6 mt-6" style={{ borderTop: '1px solid #d9cfc2' }}>
              <button
                onClick={() => setShowAccountModal(false)}
                className="flex-1 py-2 rounded-lg font-semibold text-sm transition-all"
                style={{ background: '#f0f0f0', color: '#7a6650' }}
              >
                Fechar
              </button>
              <button
                className="flex-1 py-2 rounded-lg font-semibold text-sm transition-all hover:opacity-80"
                style={{ background: '#3d5c3a', color: '#faf6ef' }}
              >
                Confirmar Pagamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pedidos (Orders) */}
      {showOrdersModal && selectedTableForOrders && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#2a1f14]">Pedidos - Mesa {selectedTableForOrders.number}</h3>
              <button
                onClick={() => setShowOrdersModal(false)}
                className="text-[#7a6650] hover:text-[#2a1f14] text-2xl font-light"
              >
                ×
              </button>
            </div>

            {/* Cliente */}
            {selectedTableForOrders.clientName && (
              <div className="mb-4 p-3 rounded-lg" style={{ background: '#f5f0eb' }}>
                <p className="text-xs" style={{ color: '#8a7060' }}>Cliente</p>
                <p className="font-semibold text-[#2a1f14]">{selectedTableForOrders.clientName}</p>
              </div>
            )}

            {/* Lista de Pedidos */}
            <div className="space-y-3">
              {orders
                .filter(o => o.tableNumber === selectedTableForOrders.number)
                .map((order) => (
                  <div
                    key={order.id}
                    className="p-3 rounded-lg border"
                    style={{
                      background: order.status === 'PREPARING' ? 'rgba(196,92,42,0.05)' : 'rgba(61,92,58,0.05)',
                      borderColor: order.status === 'PREPARING' ? '#c45c2a' : '#3d5c3a',
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold" style={{ color: '#7a6650' }}>Pedido às {order.time}</p>
                      <span
                        className="text-xs px-2 py-1 rounded-full font-semibold"
                        style={{
                          background: order.status === 'PREPARING' ? 'rgba(196,92,42,0.2)' : 'rgba(61,92,58,0.2)',
                          color: order.status === 'PREPARING' ? '#c45c2a' : '#3d5c3a',
                        }}
                      >
                        {order.status === 'PENDING' ? 'Aguardando' : 'Preparando'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {order.items.map((item: string, idx: number) => (
                        <p key={idx} className="text-sm text-[#2a1f14]">
                          • {item}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
            </div>

            {/* Botão Novo Pedido */}
            <button
              className="w-full mt-6 py-3 rounded-lg font-semibold text-sm transition-all hover:opacity-80"
              style={{ background: '#c45c2a', color: '#faf6ef' }}
            >
              + Adicionar Itens
            </button>

            {/* Fechar */}
            <button
              onClick={() => setShowOrdersModal(false)}
              className="w-full mt-2 py-2 rounded-lg font-semibold text-sm transition-all"
              style={{ background: '#f0f0f0', color: '#7a6650' }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
