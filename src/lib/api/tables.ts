import { fetchWithAuth } from './config'

export interface Table {
  id: string
  identifier: string // número ou nome (ex: 5, A3, Varanda)
  capacity: number
  status: 'FREE' | 'OCCUPIED' | 'CLOSED'
  clientName: string | null
  openedAt: string
  subtotal: number // soma dos pedidos ativos, sem taxa (centavos)
  pendingOrders: number
}

export async function listTables(): Promise<Table[]> {
  return fetchWithAuth('/tables', { method: 'GET' })
}

export async function openTable(data: { identifier: string; clientName?: string }): Promise<{ id: string; message: string }> {
  return fetchWithAuth('/tables/open', { method: 'POST', body: JSON.stringify(data) })
}

export async function closeTable(tableId: string): Promise<{ success: boolean; total: number }> {
  return fetchWithAuth(`/tables/${tableId}/close`, { method: 'POST' })
}
