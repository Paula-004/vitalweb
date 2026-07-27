'use client'
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authService, userService } from '@/services'
import { AuthSession, LoginInput, RegisterInput, ResetPasswordInput, UpdateProfileInput } from '@/types/auth'
import { configureApiClient } from '@/lib/apiClient'

type Value = {
  session: AuthSession | null
  /** `false` mientras todavía no se leyó la sesión guardada en el navegador. */
  ready: boolean
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => Promise<void>
  recover: (email: string) => Promise<void>
  resetPassword: (input: ResetPasswordInput) => Promise<void>
  updateProfile: (input: UpdateProfileInput) => Promise<void>
  setSession: React.Dispatch<React.SetStateAction<AuthSession | null>>
}
const Context = createContext<Value | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => { setSession(authService.loadSession()); setReady(true) }, [])
  useEffect(() => configureApiClient({ getAccessToken: () => session?.accessToken ?? null, onUnauthorized: () => setSession(null) }), [session])
  useEffect(() => { if (!ready) return; if (session) authService.saveSession(session); else authService.clearSession() }, [session, ready])

  const login = useCallback(async (input: LoginInput) => { setSession((await authService.login(input)).data) }, [])
  const register = useCallback(async (input: RegisterInput) => { setSession((await authService.register(input)).data) }, [])
  const logout = useCallback(async () => { await authService.logout(); setSession(null) }, [])
  const recover = useCallback(async (email: string) => { await authService.recoverPassword(email) }, [])
  const resetPassword = useCallback(async (input: ResetPasswordInput) => { await authService.resetPassword(input) }, [])
  const updateProfile = useCallback(async (input: UpdateProfileInput) => {
    if (!session) throw new Error('No hay una sesión iniciada.')
    const user = (await userService.update(session.user.id, input)).data
    setSession({ ...session, user })
  }, [session])

  const value = useMemo(
    () => ({ session, ready, login, register, logout, recover, resetPassword, updateProfile, setSession }),
    [session, ready, login, register, logout, recover, resetPassword, updateProfile],
  )
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useAuth() {
  const value = useContext(Context)
  if (!value) throw new Error('useAuth debe usarse dentro de AuthProvider.')
  return value
}
