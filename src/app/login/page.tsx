'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const USERS = [
  { email: 'admin@comanda.com', password: 'admin123', name: 'Admin', role: 'ADMIN' },
  { email: 'gerente@comanda.com', password: 'gerente123', name: 'Roger', role: 'GERENTE' },
  { email: 'garcom1@comanda.com', password: 'garcom123', name: 'Carlos', role: 'GARCOM' },
  { email: 'cozinha@comanda.com', password: 'kitchen123', name: 'Cozinha', role: 'KITCHEN' },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Mock login (sem backend por enquanto)
      await new Promise(r => setTimeout(r, 500))

      const user = USERS.find(u => u.email === email && u.password === password)

      if (!user) {
        toast.error('Email ou senha incorretos')
        setLoading(false)
        return
      }

      // Salvar token e usuário no localStorage
      localStorage.setItem('token', 'mock_token_' + user.email)
      localStorage.setItem('user', JSON.stringify({
        email: user.email,
        name: user.name,
        role: user.role,
      }))

      toast.success('Login realizado com sucesso!')
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login')
      setLoading(false)
    }
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
              Email
            </label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            {USERS.map((user) => (
              <button
                key={user.email}
                type="button"
                onClick={() => {
                  setEmail(user.email)
                  setPassword(user.password)
                }}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left transition-colors hover:bg-[rgba(255,249,242,0.06)] text-xs"
              >
                <span style={{ color: '#a08060' }}>
                  <span style={{ color: '#c8a97a', fontWeight: '600' }}>{user.email}</span>
                  <span> · {user.name}</span>
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
