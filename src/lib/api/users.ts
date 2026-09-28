import { fetchWithAuth } from './config'

export type UserRole = 'ADMIN' | 'GERENTE' | 'GARCOM' | 'COZINHA'

export interface AppUser {
  id: string
  name: string
  email: string | null
  role: UserRole
  needsPasswordChange: boolean
  createdAt: string
}

// Listar todos os usuários (admin)
export async function listUsers(): Promise<AppUser[]> {
  return fetchWithAuth('/users', { method: 'GET' })
}

// Criar usuário (admin). Senha padrão "123" se não informada.
export async function createUser(data: {
  name: string
  role: UserRole
  email?: string
  password?: string
}): Promise<{ id: string; message: string }> {
  return fetchWithAuth('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// Remover usuário (admin)
export async function deleteUser(id: string): Promise<{ success: boolean }> {
  return fetchWithAuth(`/users/${id}`, { method: 'DELETE' })
}
