import { mockUsers } from '@/mocks/commerce'
import { apiRequest } from '@/lib/apiClient'
import { apiEndpoints, useApiFor } from '@/lib/config'
import { mockResponse } from '@/lib/mockApi'
import { DataSourceError } from '@/types/api'
import { backofficeAdapter } from '@/adapters/backofficeAdapter'
import { AuthSession, LoginInput, RegisterInput, ResetPasswordInput } from '@/types/auth'

const DEMO_PASSWORD = 'vital123'
const SESSION_KEY = 'vitalweb-demo-session'
const session = (user: typeof mockUsers[number]): AuthSession => ({
  user: structuredClone(user),
  accessToken: `mock-token-${user.id}`,
  expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  isMock: true,
})

/** Normaliza la respuesta de sesión venga como `{user,accessToken}` o con otros nombres. */
function toSession(payload: Record<string, unknown>): AuthSession {
  const user = (payload.user ?? payload.client ?? payload.customer ?? {}) as Record<string, unknown>
  const expiresAt = payload.expiresAt ?? payload.expires_at
  return {
    user: backofficeAdapter.user(user),
    accessToken: String(payload.accessToken ?? payload.access_token ?? payload.token ?? ''),
    expiresAt: expiresAt ? String(expiresAt) : new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    isMock: false,
  }
}

export const authService = {
  /** `true` mientras la autenticación sea la demostración local de `mocks/`. */
  get isMock() { return !useApiFor(apiEndpoints.customerLogin) },

  loadSession(): AuthSession | null {
    if (typeof window === 'undefined') return null
    try {
      const saved = JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null') as AuthSession | null
      if (!saved) return null
      if (new Date(saved.expiresAt).getTime() <= Date.now()) { localStorage.removeItem(SESSION_KEY); return null }
      return saved
    } catch { return null }
  },
  saveSession(value: AuthSession) {
    if (typeof window !== 'undefined') localStorage.setItem(SESSION_KEY, JSON.stringify(value))
  },
  clearSession() {
    if (typeof window !== 'undefined') localStorage.removeItem(SESSION_KEY)
  },

  async login(input: LoginInput) {
    if (useApiFor(apiEndpoints.customerLogin)) {
      const response = await apiRequest<Record<string, unknown>>(apiEndpoints.customerLogin, { method: 'POST', body: JSON.stringify(input) })
      return { ...response, data: toSession(response.data) }
    }
    const username = input.username.trim().toLowerCase()
    const user = mockUsers.find(item => (item.username ?? item.firstName).toLowerCase() === username)
    if (!user || input.password !== DEMO_PASSWORD) throw new DataSourceError('Usuario o contraseña incorrectos.', 401)
    return mockResponse(session(user))
  },

  async register(input: RegisterInput) {
    if (useApiFor(apiEndpoints.customerRegister)) {
      const response = await apiRequest<Record<string, unknown>>(apiEndpoints.customerRegister, {
        method: 'POST',
        body: JSON.stringify({
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          phone: input.phone.trim(),
          password: input.password,
          // Se omite si viene vacío: el backoffice rechaza un código inexistente,
          // pero acepta que no venga ninguno (venta directa).
          ...(input.sellerCode?.trim() ? { sellerCode: input.sellerCode.trim() } : {}),
        }),
      })
      return { ...response, data: toSession(response.data) }
    }
    const username = input.phone.replace(/\D/g, '')
    if (mockUsers.some(user => (user.username ?? user.firstName).toLowerCase() === username)) {
      throw new DataSourceError('Ese teléfono ya tiene una cuenta.', 409)
    }
    const user = { id: `user-mock-${Date.now()}`, username, firstName: input.firstName.trim(), lastName: input.lastName.trim(), phone: input.phone.trim(), addresses: [], createdAt: new Date().toISOString() }
    mockUsers.push(user)
    return mockResponse(session(user))
  },

  async resetPassword(input: ResetPasswordInput) {
    if (useApiFor(apiEndpoints.passwordReset)) {
      const response = await apiRequest<{ success?: boolean }>(apiEndpoints.passwordReset, {
        method: 'POST',
        body: JSON.stringify({ token: input.token, password: input.password }),
      })
      return { ...response, data: { success: true } }
    }
    if (!input.token.trim()) throw new DataSourceError('El enlace de recuperación no es válido.', 422)
    if (input.password.length < 8) throw new DataSourceError('La contraseña debe tener al menos 8 caracteres.', 422)
    // Sin backend real no hay contraseña que cambiar: la demostración sólo confirma el formato.
    return mockResponse({ success: true })
  },

  async logout() {
    this.clearSession()
    return mockResponse({ success: true })
  },
}
