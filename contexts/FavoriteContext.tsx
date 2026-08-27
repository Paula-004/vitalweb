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
        if (!session) {
          if (!cancelled) setIds([])
          return
        }
        const next = remote ? await favoriteService.mergeLocalIntoAccount() : []
        if (!cancelled) setIds(next)
      } catch {
        if (!cancelled) setIds([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void sync()
    return () => { cancelled = true }
  }, [ready, remote, session, userId])

  const toggle = useCallback((productId: string) => {
    if (!session) return
    const wasFavorite = ids.includes(productId)
    const next = favoriteService.toggle(ids, productId)
    setIds(next) // respuesta inmediata
    const request = wasFavorite ? favoriteService.remove(productId, remote) : favoriteService.add(productId, remote)
    request
      .then(next => setIds(next))
      .catch(() => {
        // Si no se pudo guardar en la cuenta, se revierte el cambio optimista.
        setIds(ids)
      })
  }, [ids, remote, session])

  const value = useMemo(() => ({ ids, loading, toggle, has: (id: string) => ids.includes(id) }), [ids, loading, toggle])
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useFavorites() {
  const value = useContext(Context)
  if (!value) throw new Error('useFavorites debe usarse dentro de FavoriteProvider.')
  return value
}
