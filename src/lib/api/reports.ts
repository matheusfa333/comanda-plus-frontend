import { fetchWithAuth } from './config'

export type ReportPeriod = 'today' | '7d' | '30d'

export interface Reports {
  period: ReportPeriod
  since: string
  revenue: { subtotal: number; serviceFee: number; total: number; accounts: number }
  topEmployees: { name: string; username: string; subtotal: number; orders: number }[]
  topBeers: { name: string; quantity: number; subtotal: number }[]
  topMeats: { name: string; grams: number; subtotal: number }[]
  byCategory: { category: string; subtotal: number }[]
  averageTicket: number
}

export interface AuditLog {
  id: string
  action: string
  actor: string
  details: string
  createdAt: string
}

export async function getReports(period: ReportPeriod): Promise<Reports> {
  return fetchWithAuth(`/reports?period=${period}`, { method: 'GET' })
}

export async function listLogs(): Promise<AuditLog[]> {
  return fetchWithAuth('/logs', { method: 'GET' })
}
