'use client'

import { useState } from 'react'

const MOCK_TABLES = [
  { id: '1', number: 1, capacity: 2, status: 'FREE', clientName: null },
  { id: '2', number: 2, capacity: 2, status: 'OCCUPIED', clientName: 'João Silva' },
  { id: '3', number: 3, capacity: 4, status: 'FREE', clientName: null },
  { id: '4', number: 4, capacity: 4, status: 'OCCUPIED', clientName: 'Maria Santos' },
  { id: '5', number: 5, capacity: 6, status: 'FREE', clientName: null },
]

const MOCK_STATS = {
  totalToday: 2400,
  ordersOpen: 2,
  averageTicket: 1200,
}

export default function DashboardPage() {
  const [tables] = useState(MOCK_TABLES)

  return (
    <div className="space-y-8">
      {/* Título */}
      <div>
        <h1 className="text-4xl font-bold text-[#2a1f14]" style={{ fontFamily: 'Georgia, serif' }}>
          Dashboard
        </h1>
        <p className="text-[#7a6650] mt-2">Bem-vindo ao Comanda+</p>
      </div>

      {/* Stats */}
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

      {/* Mesas */}
      <div>
        <h2 className="text-2xl font-bold text-[#2a1f14] mb-4" style={{ fontFamily: 'Georgia, serif' }}>
          Mesas
        </h2>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {tables.map((table) => (
            <div
              key={table.id}
              className="rounded-2xl p-4 flex flex-col gap-2 cursor-pointer transition-all hover:shadow-lg"
              style={{
                background: table.status === 'FREE' ? '#fff9f2' : 'rgba(196,92,42,0.05)',
                border: table.status === 'FREE' ? '1.5px solid #d9cfc2' : '1.5px solid #c45c2a',
              }}
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                     style={{ background: 'rgba(196,92,42,0.2)' }}>
                  🥩
                </div>
                <span className="text-xs px-2 py-1 rounded-full"
                      style={{
                        background: table.status === 'FREE' ? 'rgba(61,92,58,0.2)' : 'rgba(196,92,42,0.2)',
                        color: table.status === 'FREE' ? '#3d5c3a' : '#c45c2a',
                        fontWeight: '600'
                      }}>
                  {table.status === 'FREE' ? 'Livre' : 'Ocupada'}
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

              <button
                className="mt-1 py-1.5 rounded-xl text-center text-xs font-semibold transition-all hover:opacity-80"
                style={{
                  background: table.status === 'FREE' ? '#3d5c3a' : '#c45c2a',
                  color: '#faf6ef'
                }}
              >
                {table.status === 'FREE' ? 'Abrir Mesa' : 'Ver Conta'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="rounded-xl p-4" style={{ background: 'rgba(196,92,42,0.05)', border: '1px solid rgba(196,92,42,0.2)' }}>
        <p className="text-sm text-[#7a6650]">
          💡 <strong>Dica:</strong> Este é um dashboard de demonstração com dados mockados.
          Após configurar o banco de dados PostgreSQL, todos os dados serão persistidos.
        </p>
      </div>
    </div>
  )
}
