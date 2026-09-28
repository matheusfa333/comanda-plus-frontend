import { useEffect } from 'react'
import { restoreUsersFromStorage } from '@/lib/mockData'

export function useInitializeApp() {
  useEffect(() => {
    // Restaurar usuários do localStorage na inicialização
    restoreUsersFromStorage()
  }, [])
}
