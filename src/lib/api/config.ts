export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

// Helper de fetch autenticado
export async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {},
): Promise<any> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    credentials: 'include',
  })

  // 401 → sessão expirada, redireciona para login
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    throw new Error('Sessão expirada')
  }

  // 204 sem conteúdo
  if (res.status === 204) {
    return { success: true }
  }

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.message || 'Erro na requisição')
  }

  return data
}
