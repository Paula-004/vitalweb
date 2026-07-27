'use client'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Protege una pantalla que necesita sesión. Espera a que `ready` sea `true` para no
 * expulsar al visitante mientras se restaura la sesión guardada, y recuerda a dónde
 * quería entrar para volver ahí después del login.
 */
export function useRequireSession() {
  const { session, ready } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (ready && !session) router.replace(`/login?next=${encodeURIComponent(pathname)}`)
  }, [ready, session, router, pathname])

  return { session, ready, checking: !ready || !session }
}
