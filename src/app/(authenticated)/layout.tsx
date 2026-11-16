'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ROLE_LABEL } from '@/lib/utils/format'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/login')
      return
    }

    setUser(JSON.parse(userData))
    setLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (loading) return <div>Carregando...</div>

  return (
    <div className="min-h-screen" style={{ background: '#faf6ef' }}>
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #2a1f14 0%, #3d2b18 60%, #4a3520 100%)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="text-xl sm:text-2xl">🌿</span>
            <h1 className="text-lg sm:text-xl font-bold text-[#faf6ef] truncate" style={{ fontFamily: 'Georgia, serif' }}>
              Quintal do Roger
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <div className="text-right">
              <p className="text-xs sm:text-sm font-semibold text-[#faf6ef] max-w-[110px] sm:max-w-none truncate">{user?.name}</p>
              <span className="text-xs px-2 py-1 rounded-full"
                    style={{
                      background: user?.role === 'ADMIN' ? 'rgba(196,92,42,0.2)' : 'rgba(61,92,58,0.2)',
                      color: user?.role === 'ADMIN' ? '#c45c2a' : '#3d5c3a',
                      fontWeight: '600'
                    }}>
                {ROLE_LABEL[user?.role] ?? user?.role}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="px-3 sm:px-4 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-[rgba(255,249,242,0.1)]"
              style={{ color: '#c9b39a' }}
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        {children}
      </main>
    </div>
  )
}
