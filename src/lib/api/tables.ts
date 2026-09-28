import { fetchWithAuth } from './config'

export interface Table {
  id: string
  number: number
  capacity: number
  status: 'FREE' | 'OCCUPIED' | 'CLOSED'
  clientName: string | null
}

export async function listTables(): Promise<Table[]> {
  return fetchWithAuth('/tables', { method: 'GET' })
}

export async function openTable(data: {
  number: number
  clientName?: string
  capacity?: number
}): Promise<{ id: string; message: string }> {
  return fetchWithAuth('/tables/open', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function closeTable(tableId: string): Promise<{ success: boolean }> {
  return fetchWithAuth(`/tables/${tableId}/close`, { method: 'POST' })
}
