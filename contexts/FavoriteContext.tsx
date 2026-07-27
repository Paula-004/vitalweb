'use client'
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { favoriteService } from '@/services'
import { useAuth } from './AuthContext'

type Value = { ids: string[]; loading: boolean; toggle: (id: string) => void; has: (id: string) => boolean }
const Context = createContext<Value | null>(null)

export function FavoriteProvider({ children }: { children: ReactNode }) {
  const { session, ready } = useAuth()
  const [ids, setIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const remote = favoriteService.isRemoteEnabled && Boolean(session)
  const userId = session?.user.id

  useEffect(() => {
    // Sin la sesión restaurada no se sabe si los favoritos son de la cuenta o del navegador.
    if (!ready) return
    let cancelled = false
    const sync = async () => {
      setLoading(true)
      try {
        const next = remote ? await favoriteService.mergeLocalIntoAccount() : favoriteService.loadLocal()
        if (!cancelled) setIds(next)
      } catch {
        if (!cancelled) setIds(favoriteService.loadLocal())
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void sync()
    return () => { cancelled = true }
  }, [ready, remote, userId])

  const toggle = useCallback((productId: string) => {
    const wasFavorite = ids.includes(productId)
    setIds(current => favoriteService.toggle(current, productId)) // respuesta inmediata
    const request = wasFavorite ? favoriteService.remove(productId, remote) : favoriteService.add(productId, remote)
    request
      .then(next => setIds(next))
      .catch(() => setIds(current => favoriteService.toggle(current, productId))) // se revierte si falla
  }, [ids, remote])

  const value = useMemo(() => ({ ids, loading, toggle, has: (id: string) => ids.includes(id) }), [ids, loading, toggle])
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useFavorites() {
  const value = useContext(Context)
  if (!value) throw new Error('useFavorites debe usarse dentro de FavoriteProvider.')
  return value
}
