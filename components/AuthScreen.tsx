'use client'
import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { authService } from '@/services'

type Mode = 'login' | 'register' | 'recover' | 'reset'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_PATTERN = /^[\d\s+()-]{6,}$/
const MIN_PASSWORD = 8

/** Validación previa al envío: evita viajes al backoffice por datos obviamente incompletos. */
function validate(mode: Mode, values: Record<string, string>): string {
  if (mode !== 'reset' && !EMAIL_PATTERN.test(values.email ?? '')) return 'Ingresá un correo válido.'
  if (mode === 'register') {
    if (!values.firstName?.trim() || !values.lastName?.trim()) return 'Completá tu nombre y apellido.'
    if (!PHONE_PATTERN.test(values.phone ?? '')) return 'Ingresá un teléfono de contacto válido.'
  }
  if (mode === 'register' || mode === 'reset') {
    if ((values.password ?? '').length < MIN_PASSWORD) return `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`
    if (values.password !== values.passwordConfirm) return 'Las contraseñas no coinciden.'
  }
  if (mode === 'login' && !values.password) return 'Ingresá tu contraseña.'
  return ''
}

export default function AuthScreen({ mode }: { mode: Mode }) {
  const auth = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const next = searchParams.get('next') || '/mi-cuenta'
  const token = searchParams.get('token') ?? ''
  // Link de referido del vendedor: /registro?v=LUCI-CENTRO deja el código cargado.
  const sellerCode = (searchParams.get('v') ?? '').toUpperCase()

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const raw = Object.fromEntries(new FormData(event.currentTarget))
    const values = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, String(value)]))

    const invalid = validate(mode, values)
    if (invalid) { setError(invalid); return }

    setLoading(true)
    setError('')
    setMessage('')
    try {
      if (mode === 'login') { await auth.login({ email: values.email, password: values.password }); router.push(next) }
      if (mode === 'register') {
        await auth.register({ firstName: values.firstName, lastName: values.lastName, email: values.email, phone: values.phone, password: values.password, sellerCode: values.sellerCode })
        router.push(next)
      }
      if (mode === 'recover') {
        await auth.recover(values.email)
        setMessage('Si el correo está registrado, te enviamos las instrucciones para recuperar el acceso.')
      }
      if (mode === 'reset') {
        await auth.resetPassword({ token, password: values.password })
        setMessage('Contraseña actualizada. Ya podés iniciar sesión.')
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo completar la operación.')
    } finally {
      setLoading(false)
    }
  }

  const title = mode === 'login' ? 'Qué bueno verte'
    : mode === 'register' ? 'Creá tu cuenta'
    : mode === 'reset' ? 'Elegí una nueva contraseña'
    : 'Recuperá tu acceso'
  const action = mode === 'login' ? 'Ingresar'
    : mode === 'register' ? 'Registrarme'
    : mode === 'reset' ? 'Guardar contraseña'
    : 'Enviar instrucciones'

  if (mode === 'reset' && !token) {
    return <Shell title="Enlace inválido">
      <p className="mt-6 text-sm text-ink/60">Este enlace de recuperación no es válido o ya venció.</p>
      <Link href="/recuperar-clave" className="mt-5 inline-block rounded-full bg-orange px-5 py-3 text-sm font-bold text-white">Pedir uno nuevo</Link>
    </Shell>
  }

  return <Shell title={title}>
    {authService.isMock && (
      <div className="mt-5 rounded-xl bg-[#fff2d8] p-3 text-xs leading-5 text-[#6d4b12]">
        <b>Entorno de demostración.</b> Esta autenticación es simulada y no representa seguridad de producción.
        {mode === 'login' && <> Usá <b>marina@vital.demo</b> y <b>vital123</b>.</>}
      </div>
    )}
    <form onSubmit={submit} noValidate className="mt-6 space-y-4">
      {mode === 'register' && <div className="grid grid-cols-2 gap-3">
        <Field name="firstName" label="Nombre" autoComplete="given-name" />
        <Field name="lastName" label="Apellido" autoComplete="family-name" />
      </div>}
      {mode !== 'reset' && <Field name="email" label="Correo" type="email" autoComplete="email" defaultValue={mode === 'login' && authService.isMock ? 'marina@vital.demo' : ''} />}
      {mode === 'register' && <Field name="phone" label="Teléfono" autoComplete="tel" />}
      {mode !== 'recover' && <Field name="password" label="Contraseña" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} defaultValue={mode === 'login' && authService.isMock ? 'vital123' : ''} />}
      {(mode === 'register' || mode === 'reset') && <Field name="passwordConfirm" label="Repetir contraseña" type="password" autoComplete="new-password" />}
      {/* Quien llega por el link de un vendedor ya lo trae cargado; el resto lo
          escribe o lo deja vacío (compra directa). */}
      {mode === 'register' && <Field
        name="sellerCode"
        label="Código de vendedor (opcional)"
        optional
        defaultValue={sellerCode}
        autoComplete="off"
        hint="Si te lo pasó un vendedor, escribilo acá para que tu pedido quede asociado a él."
      />}

      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">{error}</p>}
      {message && <p className="rounded-xl bg-green-50 p-3 text-xs font-bold text-green-700">{message}</p>}

      <button disabled={loading} className="w-full rounded-full bg-orange py-4 text-sm font-extrabold text-white disabled:opacity-50">
        {loading ? 'Procesando...' : action}
      </button>
    </form>
    <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs font-bold text-forest/60">
      {/* El código del vendedor viaja con el link: quien llega por referido y cae
          en el login no lo pierde al pasar a registrarse. */}
      {mode === 'login' && <><Link href={sellerCode ? `/registro?v=${encodeURIComponent(sellerCode)}` : '/registro'}>Crear cuenta</Link><Link href="/recuperar-clave">Olvidé mi contraseña</Link></>}
      {mode !== 'login' && <Link href="/login">Ya tengo una cuenta</Link>}
    </div>
  </Shell>
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return <main className="min-h-screen bg-forest px-5 py-10">
    <div className="mx-auto max-w-md rounded-[2rem] bg-cream p-7 shadow-2xl sm:p-10">
      <Link href="/" className="text-sm font-bold text-orange">← Volver a Vital Food</Link>
      <p className="mt-8 text-xs font-extrabold uppercase tracking-[.18em] text-orange">Cuenta Vital</p>
      <h1 className="mt-2 font-display text-4xl text-forest">{title}</h1>
      {children}
    </div>
  </main>
}

function Field({ name, label, type = 'text', defaultValue, autoComplete, optional, hint }: { name: string; label: string; type?: string; defaultValue?: string; autoComplete?: string; optional?: boolean; hint?: string }) {
  return <label className="block text-xs font-bold text-forest">
    {label}
    <input
      required={!optional}
      name={name}
      type={type}
      defaultValue={defaultValue}
      autoComplete={autoComplete}
      className="mt-2 w-full rounded-xl border border-forest/10 bg-white px-4 py-3 font-normal outline-none focus:border-orange"
    />
    {hint && <span className="mt-1.5 block text-[11px] font-normal leading-4 text-forest/50">{hint}</span>}
  </label>
}
