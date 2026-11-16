'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { TwoFactorStatus, getTwoFactorStatus, setupTwoFactor, enableTwoFactor, disableTwoFactor } from '@/lib/api/auth'
import TwoFactorSetup from '@/components/auth/TwoFactorSetup'
import CodeInput from '@/components/auth/CodeInput'

function currentUsername(): string | undefined {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null')?.username ?? undefined
  } catch {
    return undefined
  }
}

export default function SecurityPage() {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null)
  const [mode, setMode] = useState<'view' | 'setup' | 'disable'>('view')
  const [code, setCode] = useState('')
  const [useRecovery, setUseRecovery] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      setStatus(await getTwoFactorStatus())
    } catch (e: any) {
      toast.error(e.message || 'Erro ao carregar a segurança da conta')
    }
  }, [])

  useEffect(() => { load() }, [load])

  const backToView = useCallback(() => {
    setMode('view')
    setCode('')
    setUseRecovery(false)
  }, [])

  const handleDisable = async () => {
    if (!useRecovery && code.length !== 6) {
      toast.error('Digite os 6 dígitos do app autenticador')
      return
    }
    setBusy(true)
    try {
      await disableTwoFactor(code)
      toast.success('Verificação em 2 etapas desativada')
      backToView()
      load()
    } catch (e: any) {
      toast.error(e.message || 'Não foi possível desativar')
      setCode('')
    } finally {
      setBusy(false)
    }
  }

  const card = { background: '#fff9f2', border: '1px solid #d9cfc2' }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between gap-3 mb-5">
        <h2 className="text-xl sm:text-2xl font-bold text-[#2a1f14]" style={{ fontFamily: 'Georgia, serif' }}>Segurança da conta</h2>
        <Link href="/dashboard" className="text-xs px-3 py-1.5 rounded-full font-semibold flex-shrink-0" style={{ background: '#f0f0f0', color: '#7a6650' }}>← Voltar</Link>
      </div>

      <div className="rounded-2xl p-4 sm:p-5" style={card}>
        {!status ? (
          <div className="space-y-3">
            <div className="h-5 w-2/3 rounded animate-pulse" style={{ background: '#f0e8de' }} />
            <div className="h-4 w-full rounded animate-pulse" style={{ background: '#f0e8de' }} />
            <div className="h-10 w-full rounded-xl animate-pulse" style={{ background: '#f0e8de' }} />
          </div>
        ) : mode === 'setup' ? (
          <TwoFactorSetup
            start={setupTwoFactor}
            username={currentUsername()}
            confirm={enableTwoFactor}
            onCancel={backToView}
            onFinish={() => { backToView(); load() }}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold text-[#2a1f14]">🔒 Verificação em 2 etapas</h3>
              <span
                className="text-xs px-3 py-1 rounded-full font-semibold"
                style={status.enabled ? { background: 'rgba(61,92,58,0.15)', color: '#3d5c3a' } : { background: 'rgba(0,0,0,0.06)', color: '#7a6650' }}
              >
                {status.enabled ? '✓ Ativada' : 'Desativada'}
              </span>
            </div>
            <p className="text-sm" style={{ color: '#7a6650' }}>
              Além da senha, o login pede um código de 6 dígitos gerado pelo app autenticador do seu celular.
              Assim, mesmo que alguém descubra sua senha, não consegue entrar.
            </p>

            {status.required && (
              <p className="text-xs p-3 rounded-xl" style={{ background: 'rgba(232,160,74,0.12)', color: '#b8741f' }}>
                Obrigatória para Administrador e Gerente. Se perder o celular, use um código de recuperação ou peça a outro administrador para resetar.
              </p>
            )}

            {status.enabled && (
              <p className="text-xs" style={{ color: status.recoveryCodesLeft <= 2 ? '#d9534f' : '#8a7060' }}>
                Códigos de recuperação restantes: <strong>{status.recoveryCodesLeft}</strong>
                {status.recoveryCodesLeft <= 2 && ' (estão acabando: peça ao administrador para resetar e configure de novo para gerar códigos novos)'}
              </p>
            )}

            {mode === 'disable' ? (
              <div className="space-y-3 pt-1">
                <p className="text-sm font-semibold text-[#2a1f14]">
                  {useRecovery ? 'Digite um código de recuperação para confirmar:' : 'Digite o código atual do app para confirmar:'}
                </p>
                <CodeInput value={code} onChange={setCode} recovery={useRecovery} disabled={busy} autoFocus />
                <button onClick={() => { setUseRecovery(!useRecovery); setCode('') }} className="text-xs underline" style={{ color: '#7a6650' }}>
                  {useRecovery ? 'Usar o código do app' : 'Usar código de recuperação'}
                </button>
                <div className="flex gap-3">
                  <button onClick={backToView} disabled={busy} className="flex-1 py-2.5 rounded-xl font-semibold" style={{ background: '#f0f0f0', color: '#7a6650' }}>Cancelar</button>
                  <button onClick={handleDisable} disabled={busy} className="flex-1 py-2.5 rounded-xl font-semibold text-white disabled:opacity-60" style={{ background: '#d9534f' }}>
                    {busy ? 'Aguarde…' : 'Desativar'}
                  </button>
                </div>
              </div>
            ) : !status.enabled ? (
              <button onClick={() => setMode('setup')} className="w-full py-3 rounded-xl font-semibold text-white" style={{ background: '#3d5c3a' }}>
                Ativar verificação em 2 etapas
              </button>
            ) : !status.required ? (
              <button onClick={() => setMode('disable')} className="w-full py-3 rounded-xl font-semibold" style={{ background: 'rgba(217,83,79,0.12)', color: '#d9534f' }}>
                Desativar verificação em 2 etapas
              </button>
            ) : null}
          </div>
        )}
      </div>

      <div className="rounded-2xl p-4 sm:p-5 mt-4 flex flex-wrap items-center justify-between gap-3" style={card}>
        <div>
          <h3 className="font-bold text-[#2a1f14]">🔑 Senha</h3>
          <p className="text-sm" style={{ color: '#7a6650' }}>Troque a senha de acesso.</p>
        </div>
        <Link href="/change-password" className="w-full sm:w-auto text-center px-4 py-2 rounded-xl text-sm font-semibold border" style={{ borderColor: '#d9cfc2', color: '#7a6650' }}>
          Trocar senha
        </Link>
      </div>
    </div>
  )
}
