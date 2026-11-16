'use client'

interface CodeInputProps {
  value: string
  onChange: (value: string) => void
  recovery?: boolean // código de recuperação (XXXX-XXXX) em vez dos 6 dígitos do app
  disabled?: boolean
  autoFocus?: boolean
  dark?: boolean
}

// Campo do código da verificação em 2 etapas
export default function CodeInput({ value, onChange, recovery, disabled, autoFocus, dark }: CodeInputProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) =>
        onChange(recovery ? e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 9) : e.target.value.replace(/\D/g, '').slice(0, 6))
      }
      inputMode={recovery ? 'text' : 'numeric'}
      autoComplete="one-time-code"
      autoCapitalize={recovery ? 'characters' : 'none'}
      autoCorrect="off"
      spellCheck={false}
      placeholder={recovery ? 'XXXX-XXXX' : '000000'}
      maxLength={recovery ? 9 : 6}
      disabled={disabled}
      autoFocus={autoFocus}
      className="w-full px-4 py-3 rounded-xl text-center text-2xl font-bold tracking-[0.3em] outline-none"
      style={
        dark
          ? { background: 'rgba(255,249,242,0.07)', border: '1.5px solid rgba(255,249,242,0.12)', color: '#faf6ef' }
          : { background: '#fff', border: '1.5px solid #d9cfc2', color: '#2a1f14' }
      }
    />
  )
}
