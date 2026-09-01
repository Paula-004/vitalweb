import { beforeEach, describe, expect, it } from 'vitest'
import { authService } from '@/services'
import { DataSourceError } from '@/types/api'
import { AuthSession } from '@/types/auth'
import { clearStorage } from './setup'

const DEMO_EMAIL = 'marina@vital.demo'
const DEMO_PASSWORD = 'vital123'

beforeEach(() => clearStorage())

describe('login', () => {
  it('devuelve la sesión del cliente con credenciales válidas', async () => {
    const { data } = await authService.login({ username: DEMO_EMAIL, password: DEMO_PASSWORD })
    expect(data.user.firstName).toBe('Marina')
    expect(data.accessToken).toBeTruthy()
  })

  it('ignora mayúsculas en el correo', async () => {
    const { data } = await authService.login({ username: 'MARINA@VITAL.DEMO', password: DEMO_PASSWORD })
    expect(data.user.firstName).toBe('Marina')
  })

  it('rechaza una contraseña incorrecta con 401', async () => {
    await expect(authService.login({ username: DEMO_EMAIL, password: 'incorrecta' }))
      .rejects.toMatchObject({ status: 401 })
  })

  it('no revela si la cuenta existe cuando falla', async () => {
    const error = await authService.login({ username: 'nadie@vital.demo', password: 'x' }).catch(cause => cause)
    expect(error).toBeInstanceOf(DataSourceError)
    expect(error.message).toBe('Teléfono, correo o contraseña incorrectos.')
  })
})

describe('registro', () => {
  const nuevaCuenta = (overrides: Partial<Parameters<typeof authService.register>[0]> = {}) => ({
    firstName: 'Ana',
    lastName: 'Ruiz',
    phone: '+54 9 11 5555 0303',
    password: 'unaclave123',
    ...overrides,
  })

  it('crea la cuenta y deja al cliente con sesión iniciada', async () => {
    const input = nuevaCuenta()
    const { data } = await authService.register(input)
    expect(data.user.firstName).toBe('Ana')
    expect(data.user.lastName).toBe('Ruiz')
    expect(data.user.phone).toBe(input.phone)
    expect(data.user.addresses).toEqual([])
    expect(data.accessToken).toBeTruthy()
  })

  it('rechaza con 409 un teléfono ya registrado', async () => {
    const phone = `+54 11 ${String(Date.now()).slice(-8)}`
    await authService.register(nuevaCuenta({ phone }))
    await expect(authService.register(nuevaCuenta({ phone })))
      .rejects.toMatchObject({ status: 409 })
  })
})

describe('sesión expirada', () => {
  const sessionWith = (expiresAt: string): AuthSession => ({
    user: { id: 'user-demo-001', email: DEMO_EMAIL, firstName: 'Marina', lastName: 'Test', phone: '', addresses: [], createdAt: '2026-01-01T00:00:00Z' },
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
