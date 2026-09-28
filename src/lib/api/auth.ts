import { API_URL, fetchWithAuth } from './config'

export interface LoggedUser {
  id: string
  name: string
  email: string | null
  role: 'ADMIN' | 'GERENTE' | 'GARCOM' | 'KITCHEN'
  needsPasswordChange: boolean
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: LoggedUser
}

// Login com nome + senha (backend real)
export async function login(name: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name, password }),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.message || 'Usuário ou senha incorretos')
  }

  return data
}

// Trocar senha do usuário logado
export async function changePassword(newPassword: string): Promise<{ success: boolean }> {
  return fetchWithAuth('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ newPassword }),
  })
}
