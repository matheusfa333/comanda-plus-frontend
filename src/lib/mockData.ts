// 🎭 Dados Mockados — Desenvolvimento Local
// Simula um banco de dados em memória durante a sessão

// Inicializar usuários com localStorage como backup
const initializeUsers = () => {
  const stored = typeof window !== 'undefined' ? localStorage.getItem('comanda_users_db') : null

  if (stored) {
    try {
      return JSON.parse(stored)
    } catch (e) {
      console.error('Erro ao restaurar usuários do localStorage:', e)
    }
  }

  return [
    {
      id: '1',
      name: 'Admin',
      password: '123',
      role: 'ADMIN',
      needsPasswordChange: true,
    },
    {
      id: '2',
      name: 'Gerente',
      password: '123',
      role: 'GERENTE',
      needsPasswordChange: true,
    },
    {
      id: '3',
      name: 'Carlos',
      password: '123',
      role: 'GARCOM',
      needsPasswordChange: true,
    },
    {
      id: '4',
      name: 'Cozinha',
      password: '123',
      role: 'COZINHA',
      needsPasswordChange: true,
    },
  ]
}

let usersDatabase = initializeUsers()

// Persistir no localStorage
const persistUsers = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('comanda_users_db', JSON.stringify(usersDatabase))
  }
}

export const MOCK_USERS = usersDatabase

// Função para atualizar senha no banco de dados com persistência
export const updateUserPassword = (userId: string, newPassword: string) => {
  const userIndex = usersDatabase.findIndex(u => u.id === userId)
  if (userIndex !== -1) {
    usersDatabase[userIndex].password = newPassword
    usersDatabase[userIndex].needsPasswordChange = false
    persistUsers()
    console.log(`✓ Senha do usuário ${usersDatabase[userIndex].name} atualizada e persistida`)
    return true
  }
  return false
}

// Função para buscar usuário por ID
export const getUserById = (id: string) => {
  return usersDatabase.find(u => u.id === id)
}

export const MOCK_TABLES = [
  {
    id: '1',
    number: 1,
    status: 'OCCUPIED',
    guestCount: 4,
    currentOrder: {
      id: 'order-1',
      items: ['Moqueca de Peixe'],
      total: 8500, // centavos
      time: '15 min',
    },
  },
  {
    id: '2',
    number: 2,
    status: 'OCCUPIED',
    guestCount: 2,
    currentOrder: {
      id: 'order-2',
      items: ['Feijoada'],
      total: 6200,
      time: '25 min',
    },
  },
  {
    id: '3',
    number: 3,
    status: 'OCCUPIED',
    guestCount: 3,
    currentOrder: {
      id: 'order-3',
      items: ['Peixe Grelhado', 'Refrigerante'],
      total: 7800,
      time: '10 min',
    },
  },
  {
    id: '4',
    number: 4,
    status: 'OCCUPIED',
    guestCount: 1,
    currentOrder: {
      id: 'order-4',
      items: ['Churrasco Média Rara'],
      total: 5500,
      time: '20 min',
    },
  },
  {
    id: '5',
    number: 5,
    status: 'FREE',
    guestCount: 0,
    currentOrder: null,
  },
]

export const MOCK_PRODUCTS = [
  // Carnes (vendidas por grama)
  { id: '1', name: 'Bananinha', category: 'Carnes', type: 'meat', pricePerGram: 5, minGrams: 300, isMeat: true },
  { id: '2', name: 'Maca de Peito', category: 'Carnes', type: 'meat', pricePerGram: 4, minGrams: 300, isMeat: true },
  { id: '3', name: 'Picanha', category: 'Carnes', type: 'meat', pricePerGram: 6, minGrams: 300, isMeat: true },
  { id: '4', name: 'Fraldinha', category: 'Carnes', type: 'meat', pricePerGram: 5, minGrams: 300, isMeat: true },
  { id: '5', name: 'Cupim', category: 'Carnes', type: 'meat', pricePerGram: 4, minGrams: 300, isMeat: true },

  // Acompanhamentos
  { id: '6', name: 'Arroz Branco', category: 'Acompanhamentos', type: 'side', price: 800, isMeat: false },
  { id: '7', name: 'Batata Frita', category: 'Acompanhamentos', type: 'side', price: 1200, isMeat: false },
  { id: '8', name: 'Fritas com Bacon e Queijo', category: 'Acompanhamentos', type: 'side', price: 1800, isMeat: false },
  { id: '9', name: 'Caldo de Feijão', category: 'Acompanhamentos', type: 'side', price: 600, isMeat: false },
  { id: '10', name: 'Caldo de Frango', category: 'Acompanhamentos', type: 'side', price: 700, isMeat: false },

  // Bebidas
  { id: '11', name: 'Água', category: 'Bebidas', type: 'drink', price: 300, isMeat: false },
  { id: '12', name: 'Refrigerante (lata)', category: 'Bebidas', type: 'drink', price: 500, isMeat: false },
  { id: '13', name: 'Refrigerante (garrafa)', category: 'Bebidas', type: 'drink', price: 1200, isMeat: false },
  { id: '14', name: 'Cerveja (garrafa)', category: 'Bebidas', type: 'drink', price: 1500, isMeat: false },
  { id: '15', name: 'Suco Natural', category: 'Bebidas', type: 'drink', price: 900, isMeat: false },
  { id: '16', name: 'Chope', category: 'Bebidas', type: 'drink', price: 2000, isMeat: false },
]

export const MOCK_STATS = {
  totalDay: 125000, // centavos = R$ 1.250,00
  openOrders: 12,
  averageTicket: 10417, // centavos = R$ 104,17
}

// Login mock
export const mockLogin = (name: string, password: string) => {
  const user = usersDatabase.find(u => u.name === name && u.password === password)
  if (user) {
    return {
      accessToken: 'mock-token-' + Date.now(),
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        needsPasswordChange: user.needsPasswordChange,
      },
    }
  }
  throw new Error('Usuário ou senha incorretos')
}

// Buscar tabelas mock
export const mockGetTables = () => {
  return MOCK_TABLES
}

// Buscar produtos mock
export const mockGetProducts = () => {
  return MOCK_PRODUCTS
}

// Buscar estatísticas mock
export const mockGetStats = () => {
  return MOCK_STATS
}

// Criar pedido mock
export const mockCreateOrder = (tableId: string, items: string[]) => {
  return {
    id: 'order-' + Date.now(),
    tableId,
    items,
    status: 'PENDING',
    createdAt: new Date(),
  }
}
