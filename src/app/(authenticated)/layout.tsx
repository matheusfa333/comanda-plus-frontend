'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

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
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌿</span>
            <h1 className="text-xl font-bold text-[#faf6ef]" style={{ fontFamily: 'Georgia, serif' }}>
              Comanda+
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-[#faf6ef]">{user?.name}</p>
              <span className="text-xs px-2 py-1 rounded-full"
                    style={{
                      background: user?.role === 'ADMIN' ? 'rgba(196,92,42,0.2)' : 'rgba(61,92,58,0.2)',
                      color: user?.role === 'ADMIN' ? '#c45c2a' : '#3d5c3a',
                      fontWeight: '600'
                    }}>
                {user?.role}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-[rgba(255,249,242,0.1)]"
              style={{ color: '#6a5040' }}
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
