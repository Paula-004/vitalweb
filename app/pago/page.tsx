'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CheckCircleIcon, ClockIcon, XCircleIcon, NoSymbolIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { paymentService } from '@/services'
import { PaymentStatus } from '@/types/domain'

const config: Record<PaymentStatus, { title: string; text: string; color: string; icon: typeof CheckCircleIcon }> = {
  approved: { title: 'Pago aprobado', text: 'El pago fue aprobado y el pedido quedó confirmado.', color: 'bg-green-700', icon: CheckCircleIcon },
  pending: { title: 'Estamos confirmando tu pago...', text: 'La confirmación puede tardar unos instantes. Esta pantalla se actualizará automáticamente.', color: 'bg-amber-600', icon: ClockIcon },
  rejected: { title: 'Pago rechazado', text: 'El pago fue rechazado. Podés intentar con otro método.', color: 'bg-red-700', icon: XCircleIcon },
  cancelled: { title: 'Pago cancelado', text: 'El pago fue cancelado y no se procesó ningún cobro.', color: 'bg-ink', icon: NoSymbolIcon },
}

const simulatedConfig: Record<PaymentStatus, { title: string; text: string }> = {
  approved: { title: 'Simulación completada', text: 'La demostración finalizó con resultado aprobado. No se realizó ningún cobro.' },
  pending: { title: 'Simulación pendiente', text: 'La demostración quedó pendiente. No se realizó ningún cobro.' },
  rejected: { title: 'Simulación rechazada', text: 'La demostración finalizó con resultado rechazado. No se realizó ningún cobro.' },
  cancelled: { title: 'Simulación cancelada', text: 'La demostración fue cancelada. No se realizó ningún cobro.' },
}

type ViewState =
  | { kind: 'checking' }
  | { kind: 'error'; message: string }
  | { kind: 'result'; status: PaymentStatus; simulated: boolean }

const PAYMENT_POLL_MS = 3000

export default function Page({ searchParams }: { searchParams: { status?: string; order?: string; payment?: string } }) {
  const { ready, session } = useAuth()
  const [view, setView] = useState<ViewState>({ kind: 'checking' })
  const paymentId = searchParams.payment
  const orderId = searchParams.order
  const requestedStatus = searchParams.status

  useEffect(() => {
    if (paymentService.isSimulated) {
      const status = (['approved', 'pending', 'rejected', 'cancelled'].includes(requestedStatus ?? '')
        ? requestedStatus
        : 'cancelled') as PaymentStatus
      setView({ kind: 'result', status, simulated: true })
      return
    }

    if (!ready) return
    if (!session) {
      setView({ kind: 'error', message: 'Iniciá sesión para consultar el estado de tu pago.' })
      return
    }
    if (!paymentId) {
      setView({ kind: 'error', message: 'No encontramos el identificador del pago.' })
      return
    }

    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const refresh = async () => {
      try {
        const response = await paymentService.getStatus(paymentId)
        if (cancelled) return
        const status = response.data.status
        setView({ kind: 'result', status, simulated: false })
        if (status === 'pending') timer = setTimeout(refresh, PAYMENT_POLL_MS)
      } catch (cause) {
        if (cancelled) return
        setView({
          kind: 'error',
          message: cause instanceof Error ? cause.message : 'No pudimos confirmar el estado del pago.',
        })
      }
    }

    setView({ kind: 'checking' })
    void refresh()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [paymentId, ready, requestedStatus, session])

  if (view.kind === 'checking') {
    return <PaymentLayout
      icon={ClockIcon}
      color="bg-amber-600"
      title="Estamos confirmando tu pago..."
      text="La confirmación puede tardar unos instantes. Esta pantalla se actualizará automáticamente."
      orderId={orderId}
    />
  }

  if (view.kind === 'error') {
    return <PaymentLayout
      icon={NoSymbolIcon}
      color="bg-ink"
      title="No pudimos confirmar el pago"
      text={view.message}
      orderId={orderId}
    />
  }

  const item = config[view.status]
  const simulatedItem = simulatedConfig[view.status]
  return <PaymentLayout
    icon={item.icon}
    color={item.color}
    title={view.simulated ? simulatedItem.title : item.title}
    text={view.simulated ? simulatedItem.text : item.text}
    orderId={orderId}
    retry={view.status === 'rejected'}
    simulated={view.simulated}
  />
}

function PaymentLayout({
  icon: Icon,
  color,
  title,
  text,
  orderId,
  retry = false,
  simulated = false,
}: {
  icon: typeof CheckCircleIcon
  color: string
  title: string
  text: string
  orderId?: string
  retry?: boolean
  simulated?: boolean
}) {
  return <main className="grid min-h-screen place-items-center bg-forest px-5 py-10">
    <div className="w-full max-w-lg rounded-[2rem] bg-cream p-8 text-center shadow-2xl">
      <span className={`mx-auto grid h-16 w-16 place-items-center rounded-full text-white ${color}`}><Icon className="h-9 w-9" /></span>
      {simulated && <p className="mt-6 text-xs font-extrabold uppercase tracking-widest text-orange">Resultado simulado</p>}
      <h1 className="mt-2 font-display text-4xl text-forest">{title}</h1>
      <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-ink/60">{text}</p>
      <p className="mt-4 rounded-xl bg-white p-3 text-xs">Pedido: <b>{orderId ?? 'sin número'}</b></p>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        {retry && <Link href="/checkout" className="flex-1 rounded-full bg-orange px-5 py-3 text-sm font-bold text-white">Probar otro medio</Link>}
        <Link href="/mi-cuenta" className="flex-1 rounded-full bg-forest px-5 py-3 text-sm font-bold text-white">Mis pedidos</Link>
        <Link href="/" className="flex-1 rounded-full border px-5 py-3 text-sm font-bold">Inicio</Link>
      </div>
    </div>
  </main>
}
