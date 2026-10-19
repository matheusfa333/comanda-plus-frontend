'use client'

interface ConfirmModalProps {
  title: string
  message: React.ReactNode
  confirmLabel: string
  tone?: 'danger' | 'primary'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({ title, message, confirmLabel, tone = 'primary', loading, onConfirm, onCancel }: ConfirmModalProps) {
  const color = tone === 'danger' ? '#d9534f' : '#c45c2a'
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
        <h3 className="text-xl font-bold text-[#2a1f14]" style={{ fontFamily: 'Georgia, serif' }}>{title}</h3>
        <div className="text-sm" style={{ color: '#7a6650' }}>{message}</div>
        <div className="flex gap-3 pt-2">
          <button onClick={onCancel} disabled={loading} className="flex-1 py-2 rounded-lg font-semibold" style={{ background: '#f0f0f0', color: '#7a6650' }}>Cancelar</button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 py-2 rounded-lg font-semibold text-white" style={{ background: color, opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Aguarde…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
