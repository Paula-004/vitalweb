import { beforeEach, describe, expect, it } from 'vitest'
import { authService } from '@/services'
import { DataSourceError } from '@/types/api'
import { AuthSession } from '@/types/auth'
import { clearStorage } from './setup'

const DEMO_USERNAME = 'marina'
const DEMO_PASSWORD = 'vital123'

beforeEach(() => clearStorage())

describe('login', () => {
  it('devuelve la sesión del cliente con credenciales válidas', async () => {
    const { data } = await authService.login({ username: DEMO_USERNAME, password: DEMO_PASSWORD })
    expect(data.user.firstName).toBe('Marina')
    expect(data.accessToken).toBeTruthy()
  })

  it('ignora mayúsculas en el usuario', async () => {
    const { data } = await authService.login({ username: 'MARINA', password: DEMO_PASSWORD })
    expect(data.user.firstName).toBe('Marina')
  })

  it('rechaza una contraseña incorrecta con 401', async () => {
    await expect(authService.login({ username: DEMO_USERNAME, password: 'incorrecta' }))
      .rejects.toMatchObject({ status: 401 })
  })

  it('no revela si el usuario existe cuando falla', async () => {
    const error = await authService.login({ username: 'nadie', password: 'x' }).catch(cause => cause)
    expect(error).toBeInstanceOf(DataSourceError)
    expect(error.message).toBe('Usuario o contraseña incorrectos.')
  })
})

describe('registro', () => {
  it('crea la cuenta y deja al cliente con sesión iniciada', async () => {
    const phone = `+54 11 ${String(Date.now()).slice(-8)}`
    const { data } = await authService.register({ firstName: 'Ana', lastName: 'Pérez', phone, password: 'unaclave123' })
    expect(data.user.firstName).toBe('Ana')
    expect(data.user.lastName).toBe('Pérez')
    expect(data.user.phone).toBe(phone)
    expect(data.user.addresses).toEqual([])
    expect(data.accessToken).toBeTruthy()
  })

  it('rechaza con 409 un teléfono ya registrado', async () => {
    await authService.register({ firstName: 'Ana', lastName: 'Pérez', phone: '+54 11 4444 5555', password: 'unaclave123' })
    await expect(authService.register({ firstName: 'Otra', lastName: 'Persona', phone: '+54 11 4444 5555', password: 'unaclave123' }))
      .rejects.toMatchObject({ status: 409 })
  })
})

describe('sesión expirada', () => {
  const sessionWith = (expiresAt: string): AuthSession => ({
    user: { id: 'user-demo-001', username: DEMO_USERNAME, firstName: 'Marina', lastName: 'Test', phone: '', addresses: [], createdAt: '2026-01-01T00:00:00Z' },
    accessToken: 'token-de-prueba',
    expiresAt,
  })

  it('descarta la sesión vencida y limpia el almacenamiento', () => {
    authService.saveSession(sessionWith(new Date(Date.now() - 1000).toISOString()))
    expect(authService.loadSession()).toBeNull()
    // Una segunda lectura confirma que la sesión vencida se borró, no que se filtró.
    expect(localStorage.getItem('vitalweb-demo-session')).toBeNull()
  })

  it('conserva la sesión vigente', () => {
    const valid = sessionWith(new Date(Date.now() + 60_000).toISOString())
    authService.saveSession(valid)
    expect(authService.loadSession()?.accessToken).toBe('token-de-prueba')
  })

  it('devuelve null si el contenido guardado está corrupto', () => {
    localStorage.setItem('vitalweb-demo-session', 'esto no es json')
    expect(authService.loadSession()).toBeNull()
  })

  it('logout borra la sesión', async () => {
    authService.saveSession(sessionWith(new Date(Date.now() + 60_000).toISOString()))
    await authService.logout()
    expect(authService.loadSession()).toBeNull()
  })
})

describe('restablecimiento de contraseña', () => {
  it('rechaza un token vacío al restablecer', async () => {
    await expect(authService.resetPassword({ token: '', password: 'unaclave123' }))
      .rejects.toMatchObject({ status: 422 })
  })

  it('exige una contraseña de al menos 8 caracteres', async () => {
    await expect(authService.resetPassword({ token: 'token-valido', password: 'corta' }))
      .rejects.toMatchObject({ status: 422 })
  })
})
