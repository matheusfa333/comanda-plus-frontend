// 🎭 API Mockada — Modo Desenvolvimento

import { mockLogin, mockGetTables, mockGetProducts, mockGetStats } from './mockData'

// Ativar modo mock globalmente
export const USE_MOCK = true // 👈 Mude para false quando conectar ao backend real

export const api = {
  // Login
  login: async (email: string, password: string) => {
    if (USE_MOCK) {
      // Mock com delay para parecer real
      await new Promise(resolve => setTimeout(resolve, 500))
      return mockLogin(email, password)
    }
    // Chamada real (desativada)
    throw new Error('Backend não configurado - Use USE_MOCK=true')
  },

  // Tabelas
  getTables: async () => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300))
      return mockGetTables()
    }
    throw new Error('Backend não configurado')
  },

  // Produtos
  getProducts: async () => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300))
      return mockGetProducts()
    }
    throw new Error('Backend não configurado')
  },

  // Estatísticas
  getStats: async () => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300))
      return mockGetStats()
    }
    throw new Error('Backend não configurado')
  },

  // Criar pedido
  createOrder: async (tableId: string, items: string[]) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return {
        id: 'order-' + Date.now(),
        tableId,
        items,
        status: 'PENDING',
        createdAt: new Date(),
      }
    }
    throw new Error('Backend não configurado')
  },

  // Fechar pedido
  closeOrder: async (orderId: string) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true }
    }
    throw new Error('Backend não configurado')
  },
}

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎭 MODO MOCK ATIVADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dados: Mockados (localStorage)
Backend: Desativado
Status: ${USE_MOCK ? '✅ Pronto para desenvolvimento' : '❌ Conectado ao backend real'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Para usar backend real: altere USE_MOCK=false em src/lib/apiMock.ts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
