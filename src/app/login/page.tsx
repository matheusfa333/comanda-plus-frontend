'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MOCK_USERS, mockLogin } from '@/lib/mockData'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Usar mockLogin que verifica no banco de dados em memória
      const result = mockLogin(username, password)

      // Salvar token e usuário no localStorage
      localStorage.setItem('token', result.accessToken)
      localStorage.setItem('user', JSON.stringify(result.user))

      toast.success('Login realizado com sucesso!')

      if (result.user.needsPasswordChange) {
        router.push('/change-password')
      } else {
        router.push('/dashboard')
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login')
      setLoading(false)
    }
  }

  const handleQuickFill = (name: string, password: string) => {
    setUsername(name)
    setPassword(password)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
         style={{ background: 'linear-gradient(160deg, #1e140d 0%, #2e1e10 50%, #3a2516 100%)' }}>

      {/* Branding */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
             style={{ background: 'rgba(196,92,42,0.15)', border: '1px solid rgba(196,92,42,0.3)' }}>
          <span className="text-4xl">🌿</span>
        </div>
        <h1 className="text-4xl font-bold text-[#faf6ef]" style={{ fontFamily: 'Georgia, serif' }}>
          Quintal do Roger
        </h1>
        <p className="text-[#8a7060] mt-1 text-sm">Sistema de Pedidos</p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-sm rounded-2xl p-6"
           style={{ background: 'rgba(255,249,242,0.05)', border: '1px solid rgba(255,249,242,0.1)' }}>

        <h2 className="text-lg font-semibold text-[#faf6ef] mb-5" style={{ fontFamily: 'Georgia, serif' }}>
          Entrar
        </h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: '#a08060' }}>
              Usuário
            </label>
            <input
              type="text"
              placeholder="Seu nome"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{
                background: 'rgba(255,249,242,0.07)',
                border: '1.5px solid rgba(255,249,242,0.12)',
                color: '#faf6ef'
              }}
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: '#a08060' }}>
              Senha
            </label>
            <input
              type="password"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{
                background: 'rgba(255,249,242,0.07)',
                border: '1.5px solid rgba(255,249,242,0.12)',
                color: '#faf6ef'
              }}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95 mt-2"
            style={{
              background: loading ? 'rgba(196,92,42,0.4)' : '#c45c2a',
              color: '#faf6ef',
              cursor: loading ? 'wait' : 'pointer'
            }}
          >
            {loading ? 'Verificando…' : 'Entrar'}
          </button>
        </form>

        {/* Usuários de teste */}
        <div className="mt-6 rounded-xl p-4"
             style={{ background: 'rgba(255,249,242,0.04)', border: '1px dashed rgba(255,249,242,0.1)' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: '#6a5040' }}>
            👥 Usuários de teste (clique para preencher)
          </p>
          <div className="space-y-1.5">
            {MOCK_USERS.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => {
                  handleQuickFill(user.name, user.password)
                }}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left transition-colors hover:bg-[rgba(255,249,242,0.06)] text-xs"
              >
                <span style={{ color: '#a08060' }}>
                  <span style={{ color: '#c8a97a', fontWeight: '600' }}>{user.name}</span>
                  <span> · Senha: {user.password}</span>
                </span>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: 'rgba(196,92,42,0.2)',
                    color: '#c45c2a'
                  }}
                >
                  {user.role}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
