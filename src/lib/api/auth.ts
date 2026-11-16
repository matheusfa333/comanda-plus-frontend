import { API_URL, fetchWithAuth } from './config'

export interface LoggedUser {
  id: string
  username: string
  name: string
  email: string | null
  role: 'ADMIN' | 'GERENTE' | 'GARCOM' | 'COZINHA'
  needsPasswordChange: boolean
}

export interface AuthSession {
  status: 'OK'
  accessToken: string
  refreshToken: string
  user: LoggedUser
  recoveryCodesLeft?: number // só quando entrou com um código de recuperação
}

// O login pode pedir a 2ª etapa (código do app) ou a configuração obrigatória (Admin/Gerente)
export type LoginResponse =
  | AuthSession
  | { status: 'TWO_FACTOR_REQUIRED'; challengeToken: string }
  | { status: 'TWO_FACTOR_SETUP_REQUIRED'; challengeToken: string }

export interface TwoFactorSetup {
  qrCode: string // imagem (data URL)
  secret: string // chave para digitar à mão
  otpauthUrl: string
}

export interface TwoFactorStatus {
  enabled: boolean
  required: boolean
  recoveryCodesLeft: number
}

// POST sem sessão (etapas do login): 401 aqui não deve redirecionar para /login
async function publicPost<T>(endpoint: string, body: unknown, fallback: string): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || fallback)
  return data
}

// Login com usuário (username) + senha
export async function login(username: string, password: string): Promise<LoginResponse> {
  return publicPost('/auth/login', { username, password }, 'Usuário ou senha incorretos')
}

// 2ª etapa do login: código de 6 dígitos do app ou código de recuperação
export async function verifyTwoFactor(challengeToken: string, code: string): Promise<AuthSession> {
  return publicPost('/auth/2fa/verify', { challengeToken, code }, 'Código inválido')
}

// Configuração obrigatória durante o login (Admin/Gerente ainda sem 2 etapas)
export async function setupTwoFactorDuringLogin(challengeToken: string): Promise<TwoFactorSetup> {
  return publicPost('/auth/2fa/setup', { challengeToken }, 'Não foi possível gerar o QR Code')
}

export async function enableTwoFactorDuringLogin(
  challengeToken: string,
  code: string,
): Promise<{ recoveryCodes: string[]; session: AuthSession }> {
  return publicPost('/auth/2fa/enable', { challengeToken, code }, 'Código inválido')
}

// Usuário já logado (página Segurança)
export async function getTwoFactorStatus(): Promise<TwoFactorStatus> {
  return fetchWithAuth('/auth/2fa/status', { method: 'GET' })
}

export async function setupTwoFactor(): Promise<TwoFactorSetup> {
  return fetchWithAuth('/auth/2fa/setup', { method: 'POST' })
}

export async function enableTwoFactor(code: string): Promise<{ recoveryCodes: string[] }> {
  return fetchWithAuth('/auth/2fa/enable', { method: 'POST', body: JSON.stringify({ code }) })
}

export async function disableTwoFactor(code: string): Promise<{ success: boolean }> {
  return fetchWithAuth('/auth/2fa/disable', { method: 'POST', body: JSON.stringify({ code }) })
}

// Trocar senha do usuário logado
export async function changePassword(newPassword: string): Promise<{ success: boolean }> {
  return fetchWithAuth('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ newPassword }),
  })
}
