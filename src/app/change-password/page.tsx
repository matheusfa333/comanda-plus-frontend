'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { changePassword } from '@/lib/api/auth'

export default function ChangePasswordPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      router.push('/login')
      return
    }
    setUser(JSON.parse(userStr))
  }, [router])

  const validatePassword = (password: string): string => {
    if (!password) return 'Senha é obrigatória'
    if (password.length < 6) return 'Senha deve ter no mínimo 6 caracteres'
    if (/^\d+$/.test(password)) return 'Senha não pode conter apenas números (ex: 123456 não é válido)'
    return ''
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')

    const validation = validatePassword(newPassword)
    if (validation) {
      setPasswordError(validation)
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem')
      return
    }

    setLoading(true)
    try {
      await changePassword(newPassword)

      // Atualizar user no localStorage
      const updatedUser = { ...user, needsPasswordChange: false }
      localStorage.setItem('user', JSON.stringify(updatedUser))

      toast.success('Senha alterada com sucesso!')
      router.push('/dashboard')
    } catch (error: any) {
      setPasswordError(error.message || 'Erro ao alterar senha')
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
         style={{ background: 'linear-gradient(160deg, #1e140d 0%, #2e1e10 50%, #3a2516 100%)' }}>

      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
             style={{ background: 'rgba(196,92,42,0.15)', border: '1px solid rgba(196,92,42,0.3)' }}>
          <span className="text-4xl">🔐</span>
        </div>
        <h1 className="text-4xl font-bold text-[#faf6ef]" style={{ fontFamily: 'Georgia, serif' }}>
          Alterar Senha
        </h1>
        <p className="text-[#8a7060] mt-2 text-sm">Primeira alteração obrigatória</p>
      </div>

      <div className="w-full max-w-sm rounded-2xl p-6"
           style={{ background: 'rgba(255,249,242,0.05)', border: '1px solid rgba(255,249,242,0.1)' }}>

        <div className="mb-6 p-4 rounded-xl"
             style={{ background: 'rgba(255,249,242,0.04)', border: '1px solid rgba(255,249,242,0.1)' }}>
          <p className="text-xs font-medium" style={{ color: '#a08060' }}>Usuário Conectado</p>
          <p className="text-lg font-bold text-[#faf6ef] mt-1">{user.name}</p>
          <p className="text-xs mt-2" style={{ color: '#8a7060' }}>Role: {user.role}</p>
        </div>

        <div className="mb-6 p-4 rounded-xl"
             style={{ background: 'rgba(61,92,58,0.15)', border: '1px solid rgba(61,92,58,0.3)' }}>
          <p className="text-sm font-medium text-[#3d5c3a]">📋 Requisitos da Senha</p>
          <ul className="text-xs mt-2 space-y-1" style={{ color: '#3d5c3a' }}>
            <li>✓ Mínimo 6 caracteres</li>
            <li>✓ Não pode ser apenas números (123456 ❌)</li>
            <li>✓ Pode incluir letras, números e símbolos</li>
          </ul>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: '#a08060' }}>
              Nova Senha *
            </label>
            <input
              type="password"
              placeholder="Digite a nova senha"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setPasswordError('') }}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{
                background: 'rgba(255,249,242,0.07)',
                border: passwordError ? '1.5px solid #d9534f' : '1.5px solid rgba(255,249,242,0.12)',
                color: '#faf6ef'
              }}
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: '#a08060' }}>
              Confirmar Senha *
            </label>
            <input
              type="password"
              placeholder="Confirme a nova senha"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError('') }}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{
                background: 'rgba(255,249,242,0.07)',
                border: passwordError ? '1.5px solid #d9534f' : '1.5px solid rgba(255,249,242,0.12)',
                color: '#faf6ef'
              }}
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          {passwordError && (
            <div className="p-3 rounded-xl text-xs text-white"
                 style={{ background: 'rgba(217,83,79,0.2)', border: '1px solid rgba(217,83,79,0.3)' }}>
              ⚠️ {passwordError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95 mt-6"
            style={{
              background: loading ? 'rgba(196,92,42,0.4)' : '#c45c2a',
              color: '#faf6ef',
              cursor: loading ? 'wait' : 'pointer'
            }}
          >
            {loading ? 'Alterando…' : 'Alterar Senha'}
          </button>
        </form>
      </div>
    </div>
  )
}
