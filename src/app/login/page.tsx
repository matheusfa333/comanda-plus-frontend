'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AuthSession, login, verifyTwoFactor, setupTwoFactorDuringLogin, enableTwoFactorDuringLogin } from '@/lib/api/auth'
import PasswordInput from '@/components/ui/PasswordInput'
import CodeInput from '@/components/auth/CodeInput'
import TwoFactorSetup from '@/components/auth/TwoFactorSetup'

type Stage = 'credentials' | 'verify' | 'setup'

const field = {
  background: 'rgba(255,249,242,0.07)',
  border: '1.5px solid rgba(255,249,242,0.12)',
  color: '#faf6ef',
}

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState<Stage>('credentials')
  const [challengeToken, setChallengeToken] = useState('')
  const [code, setCode] = useState('')
  const [useRecovery, setUseRecovery] = useState(false)
  const [pendingSession, setPendingSession] = useState<AuthSession | null>(null)

  const finishLogin = useCallback((session: AuthSession) => {
    localStorage.setItem('token', session.accessToken)
    localStorage.setItem('user', JSON.stringify(session.user))
    toast.success('Login realizado com sucesso!')
    if (typeof session.recoveryCodesLeft === 'number') {
      toast.warning(`Você usou um código de recuperação. Restam ${session.recoveryCodesLeft}. Se perdeu o celular, peça ao administrador para resetar a verificação em 2 etapas.`, { duration: 10000 })
    }
    router.push(session.user.needsPasswordChange ? '/change-password' : '/dashboard')
  }, [router])

  const backToCredentials = useCallback(() => {
    setStage('credentials')
    setChallengeToken('')
    setCode('')
    setUseRecovery(false)
    setPassword('')
    setLoading(false)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await login(username, password)
      if (result.status === 'OK') {
        finishLogin(result)
        return
      }
      setChallengeToken(result.challengeToken)
      setStage(result.status === 'TWO_FACTOR_REQUIRED' ? 'verify' : 'setup')
      setLoading(false)
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login')
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!useRecovery && code.length !== 6) {
      toast.error('Digite os 6 dígitos do app autenticador')
      return
    }
    setLoading(true)
    try {
      finishLogin(await verifyTwoFactor(challengeToken, code))
    } catch (error: any) {
      toast.error(error.message || 'Código inválido')
      setCode('')
      setLoading(false)
      // Token provisório venceu: volta para usuário e senha
      if (/tempo|entre de novo/i.test(error.message || '')) backToCredentials()
    }
  }

  // Configuração obrigatória (Admin/Gerente): a sessão sai junto com os códigos de recuperação
  const startSetup = useCallback(() => setupTwoFactorDuringLogin(challengeToken), [challengeToken])
  const confirmSetup = useCallback(async (c: string) => {
    const res = await enableTwoFactorDuringLogin(challengeToken, c)
    setPendingSession(res.session)
    return res
  }, [challengeToken])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-8"
         style={{ background: 'linear-gradient(160deg, #1e140d 0%, #2e1e10 50%, #3a2516 100%)' }}>

      {/* Branding */}
      <div className={`text-center ${stage === 'setup' ? 'mb-6' : 'mb-10'}`}>
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
             style={{ background: 'rgba(196,92,42,0.15)', border: '1px solid rgba(196,92,42,0.3)' }}>
          <span className="text-4xl">🌿</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#faf6ef]" style={{ fontFamily: 'Georgia, serif' }}>
          Comanda+
        </h1>
        <p className="text-[#8a7060] mt-1 text-sm">Sistema de Pedidos — Quintal do Roger</p>
      </div>

      {stage === 'setup' ? (
        // Configuração obrigatória da verificação em 2 etapas
        <div className="w-full max-w-sm rounded-2xl p-5 sm:p-6" style={{ background: '#fff9f2' }}>
          <h2 className="text-lg font-bold text-[#2a1f14] mb-2" style={{ fontFamily: 'Georgia, serif' }}>🔒 Verificação em 2 etapas</h2>
          <TwoFactorSetup
            intro={
              <p className="text-sm" style={{ color: '#7a6650' }}>
                Para Administrador e Gerente ela é <strong>obrigatória</strong>. Configure agora, leva 1 minuto. Depois, a cada login, o sistema vai pedir o código do app.
              </p>
            }
            start={startSetup}
            username={username.trim().toLowerCase()}
            confirm={confirmSetup}
            onCancel={backToCredentials}
            onFinish={() => pendingSession && finishLogin(pendingSession)}
          />
        </div>
      ) : (
        <div className="w-full max-w-sm rounded-2xl p-5 sm:p-6"
             style={{ background: 'rgba(255,249,242,0.05)', border: '1px solid rgba(255,249,242,0.1)' }}>

          {stage === 'credentials' ? (
            <>
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
                    placeholder="Seu usuário"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={field}
                    disabled={loading}
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: '#a08060' }}>
                    Senha
                  </label>
                  <PasswordInput
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={field}
                    disabled={loading}
                    autoComplete="current-password"
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
            </>
          ) : (
            // 2ª etapa: código do app autenticador
            <>
              <h2 className="text-lg font-semibold text-[#faf6ef] mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                🔒 Código de verificação
              </h2>
              <p className="text-sm mb-5" style={{ color: '#a08060' }}>
                {useRecovery
                  ? 'Digite um dos seus códigos de recuperação (cada um vale uma vez).'
                  : 'Abra o app autenticador no celular e digite o código de 6 dígitos.'}
              </p>

              <form onSubmit={handleVerify} className="space-y-4">
                <CodeInput value={code} onChange={setCode} recovery={useRecovery} disabled={loading} autoFocus dark />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
                  style={{ background: loading ? 'rgba(196,92,42,0.4)' : '#c45c2a', color: '#faf6ef', cursor: loading ? 'wait' : 'pointer' }}
                >
                  {loading ? 'Verificando…' : 'Confirmar'}
                </button>
              </form>

              <div className="flex flex-col items-center gap-2 mt-4 text-xs">
                <button onClick={() => { setUseRecovery(!useRecovery); setCode('') }} className="underline" style={{ color: '#c9b39a' }}>
                  {useRecovery ? 'Usar o código do app' : 'Perdi o celular: usar código de recuperação'}
                </button>
                <button onClick={backToCredentials} style={{ color: '#8a7060' }}>← Voltar</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
