// 🎭 Dados Mockados — Desenvolvimento Local

export const MOCK_USERS = [
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
  { id: '1', name: 'Moqueca de Peixe', price: 8500, category: 'Prato Principal', isMeat: false },
  { id: '2', name: 'Feijoada', price: 6200, category: 'Prato Principal', isMeat: true },
  { id: '3', name: 'Peixe Grelhado', price: 7200, category: 'Prato Principal', isMeat: false },
  { id: '4', name: 'Churrasco', price: 5500, category: 'Prato Principal', isMeat: true },
  { id: '5', name: 'Refrigerante', price: 800, category: 'Bebida', isMeat: false },
  { id: '6', name: 'Cerveja', price: 1200, category: 'Bebida', isMeat: false },
  { id: '7', name: 'Sobremesa', price: 2500, category: 'Sobremesa', isMeat: false },
]

export const MOCK_STATS = {
  totalDay: 125000, // centavos = R$ 1.250,00
  openOrders: 12,
  averageTicket: 10417, // centavos = R$ 104,17
}

// Login mock
export const mockLogin = (email: string, password: string) => {
  const user = MOCK_USERS[email as keyof typeof MOCK_USERS]
  if (user) {
    return {
      accessToken: 'mock-token-' + Date.now(),
      user,
    }
  }
  throw new Error('Usuário não encontrado')
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
