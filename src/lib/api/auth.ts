import { API_URL, fetchWithAuth } from './config'

export interface LoggedUser {
  id: string
  username: string
  name: string
  email: string | null
  role: 'ADMIN' | 'GERENTE' | 'GARCOM' | 'COZINHA'
  needsPasswordChange: boolean
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: LoggedUser
}

// Login com usuário (username) + senha
export async function login(username: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password }),
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
