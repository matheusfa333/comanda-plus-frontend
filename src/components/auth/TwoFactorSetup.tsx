'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { TwoFactorSetup as SetupData } from '@/lib/api/auth'
import CodeInput from './CodeInput'

interface TwoFactorSetupProps {
  start: () => Promise<SetupData> // gera o QR Code
  confirm: (code: string) => Promise<{ recoveryCodes: string[] }> // ativa com o 1º código
  onFinish: () => void // depois que o usuário guardou os códigos de recuperação
  onCancel?: () => void
  intro?: React.ReactNode
  username?: string // vai no arquivo de códigos baixado
}

// Passo a passo: escanear o QR Code → digitar o código → guardar os códigos de recuperação
export default function TwoFactorSetup({ start, confirm, onFinish, onCancel, intro, username }: TwoFactorSetupProps) {
  const [data, setData] = useState<SetupData | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null)
  const [saved, setSaved] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    start()
      .then(setData)
      .catch((e: any) => {
        toast.error(e.message || 'Não foi possível gerar o QR Code')
        onCancel?.()
      })
  }, [start, onCancel])

  const handleConfirm = async () => {
    if (code.length !== 6) {
      toast.error('Digite os 6 dígitos que aparecem no app')
      return
    }
    setBusy(true)
    try {
      const res = await confirm(code)
      setRecoveryCodes(res.recoveryCodes)
      toast.success('Verificação em 2 etapas ativada!')
    } catch (e: any) {
      toast.error(e.message || 'Código inválido')
      setCode('')
    } finally {
      setBusy(false)
    }
  }

  const copyCodes = async () => {
    if (!recoveryCodes) return
    try {
      await navigator.clipboard.writeText(recoveryCodes.join('\n'))
      toast.success('Códigos copiados')
    } catch {
      toast.error('Não foi possível copiar. Anote os códigos à mão.')
    }
  }

  // Arquivo .txt com os códigos (para guardar no computador, Drive, etc.)
  const downloadCodes = () => {
    if (!recoveryCodes) return
    const when = new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    const text = [
      'Comanda+ - Quintal do Roger',
      'Códigos de recuperação da verificação em 2 etapas',
      username ? `Usuário: ${username}` : '',
      `Gerados em: ${when}`,
      '',
      'Use um destes códigos no lugar do código do app se perder o celular.',
      'Cada código vale UMA VEZ SÓ. Guarde este arquivo em lugar seguro e não compartilhe.',
      '',
      ...recoveryCodes.map((c, i) => `${i + 1}. ${c}`),
      '',
    ].filter((l, i) => l !== '' || i > 3).join('\r\n')
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `codigos-recuperacao${username ? `-${username}` : ''}.txt`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    toast.success('Arquivo com os códigos baixado')
  }

  const muted = { color: '#7a6650' }

  // Passo 3: códigos de recuperação (aparecem uma única vez)
  if (recoveryCodes) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-[#2a1f14]" style={{ fontFamily: 'Georgia, serif' }}>Guarde seus códigos de recuperação</h3>
          <p className="text-sm mt-1" style={muted}>
            Se perder o celular, use um destes códigos no lugar do código do app. Cada um vale <strong>uma vez só</strong>.
            Eles não aparecem de novo: baixe o arquivo, copie ou tire um print e guarde em lugar seguro.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 p-3 rounded-xl" style={{ background: '#f5f0eb' }}>
          {recoveryCodes.map((c) => (
            <code key={c} className="text-center font-mono text-sm sm:text-base font-semibold py-1 text-[#2a1f14] break-all">{c}</code>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={downloadCodes} className="py-2 rounded-lg text-sm font-semibold" style={{ background: '#2a1f14', color: '#faf6ef' }}>
            ⬇ Baixar códigos
          </button>
          <button onClick={copyCodes} className="py-2 rounded-lg text-sm font-semibold border" style={{ borderColor: '#d9cfc2', color: '#7a6650' }}>
            📋 Copiar
          </button>
        </div>
        <label className="flex items-start gap-2 text-sm cursor-pointer" style={{ color: '#2a1f14' }}>
          <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="mt-0.5 w-4 h-4 flex-shrink-0" />
          Já guardei os códigos em um lugar seguro
        </label>
        <button
          onClick={onFinish}
          disabled={!saved}
          className="w-full py-3 rounded-xl font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: '#3d5c3a' }}
        >
          Continuar
        </button>
      </div>
    )
  }

  // Passo 1 e 2: QR Code + código
  return (
    <div className="space-y-4">
      {intro}
      <ol className="text-sm space-y-1 list-decimal pl-5" style={muted}>
        <li>Instale no celular o <strong>Google Authenticator</strong> ou o <strong>Microsoft Authenticator</strong>.</li>
        <li>No app, toque em <strong>+</strong> e escaneie o QR Code abaixo.</li>
        <li>Digite o código de 6 dígitos que aparece no app.</li>
      </ol>

      <div className="flex justify-center">
        {data ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.qrCode} alt="QR Code para o app autenticador" className="w-48 h-48 sm:w-52 sm:h-52 rounded-xl bg-white p-2" style={{ border: '1px solid #d9cfc2' }} />
        ) : (
          <div className="w-48 h-48 sm:w-52 sm:h-52 rounded-xl animate-pulse" style={{ background: '#f5f0eb' }} />
        )}
      </div>

      {data && (
        <div className="text-center space-y-2">
          {/* No celular não dá para escanear a própria tela: o link abre o app direto */}
          <a href={data.otpauthUrl} className="sm:hidden block w-full py-2.5 rounded-lg text-sm font-semibold border" style={{ borderColor: '#d9cfc2', color: '#2a1f14' }}>
            📲 Abrir no app autenticador
          </a>
          {showKey ? (
            <p className="text-xs" style={muted}>
              Chave para digitar no app:
              <code className="block mt-1 font-mono text-sm font-semibold text-[#2a1f14] break-all select-all">{data.secret}</code>
            </p>
          ) : (
            <button onClick={() => setShowKey(true)} className="text-xs underline" style={muted}>
              Está usando o próprio celular? Mostrar a chave para digitar
            </button>
          )}
        </div>
      )}

      <CodeInput value={code} onChange={setCode} disabled={!data || busy} />

      <div className="flex gap-3">
        {onCancel && (
          <button onClick={onCancel} disabled={busy} className="flex-1 py-3 rounded-xl font-semibold" style={{ background: '#f0f0f0', color: '#7a6650' }}>
            Cancelar
          </button>
        )}
        <button
          onClick={handleConfirm}
          disabled={!data || busy}
          className="flex-1 py-3 rounded-xl font-semibold text-white disabled:opacity-60"
          style={{ background: '#c45c2a' }}
        >
          {busy ? 'Verificando…' : 'Ativar'}
        </button>
      </div>
    </div>
  )
}
