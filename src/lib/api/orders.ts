import { fetchWithAuth } from './config'

export interface OrderItemView {
  id: string
  productId: string
  productName: string
  isMeat: boolean
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface OrderView {
  id: string
  status: string
  createdAt: string
  items: OrderItemView[]
  subtotal: number
}

export interface TableAccount {
  orders: OrderView[]
  subtotal: number
  serviceFee: number
  total: number
}

export interface KitchenOrder {
  id: string
  tableNumber: number
  clientName: string | null
  status: string
  createdAt: string
  items: { productName: string; quantity: number; isMeat: boolean }[]
}

export async function createOrder(data: {
  tableId: string
  items: { productId: string; quantity: number; notes?: string }[]
}): Promise<{ id: string; total: number }> {
  return fetchWithAuth('/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getTableAccount(tableId: string): Promise<TableAccount> {
  return fetchWithAuth(`/orders/table/${tableId}`, { method: 'GET' })
}

export async function listKitchenOrders(): Promise<KitchenOrder[]> {
  return fetchWithAuth('/orders/kitchen', { method: 'GET' })
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
): Promise<{ success: boolean }> {
  return fetchWithAuth(`/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}
