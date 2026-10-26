import { fetchWithAuth } from './config'

export type UserRole = 'ADMIN' | 'GERENTE' | 'GARCOM' | 'COZINHA'

export interface AppUser {
  id: string
  username: string
  name: string
  email: string | null
  role: UserRole
  needsPasswordChange: boolean
  active: boolean
  createdAt: string
}

export async function listUsers(): Promise<AppUser[]> {
  return fetchWithAuth('/users', { method: 'GET' })
}

// Senha inicial padrão "123" (troca obrigatória no primeiro login)
export async function createUser(data: {
  username: string
  name: string
  role: UserRole
  email?: string
}): Promise<{ id: string; message: string }> {
  return fetchWithAuth('/users', { method: 'POST', body: JSON.stringify(data) })
}

export async function deleteUser(id: string): Promise<{ success: boolean }> {
  return fetchWithAuth(`/users/${id}`, { method: 'DELETE' })
}

export async function resetUserPassword(id: string): Promise<{ success: boolean }> {
  return fetchWithAuth(`/users/${id}/reset-password`, { method: 'POST' })
}

export async function setUserActive(id: string, active: boolean): Promise<{ success: boolean }> {
  return fetchWithAuth(`/users/${id}/active`, { method: 'PATCH', body: JSON.stringify({ active }) })
}
