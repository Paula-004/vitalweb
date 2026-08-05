'use client'

import { CheckCircleIcon, ClockIcon, NoSymbolIcon, XCircleIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { paymentService } from '@/services'
import { PaymentStatus } from '@/types/domain'

const config: Record<PaymentStatus, { title: string; text: string; simulatedText: string; color: string; icon: typeof CheckCircleIcon }> = {
  approved: { title: 'Pago aprobado', text: 'El pago fue aprobado y el pedido quedó confirmado.', simulatedText: 'La simulación fue aprobada y el pedido quedó confirmado.', color: 'bg-green-700', icon: CheckCircleIcon },
  pending: { title: 'Confirmando pago', text: 'Estamos esperando la confirmación segura de Mercado Pago.', simulatedText: 'La simulación quedó pendiente. El pedido espera confirmación.', color: 'bg-amber-600', icon: ClockIcon },
  rejected: { title: 'Pago rechazado', text: 'El pago fue rechazado. Podés volver a intentarlo sin repetir el pedido.', simulatedText: 'La simulación fue rechazada. Podés intentar con otro método.', color: 'bg-red-700', icon: XCircleIcon },
  cancelled: { title: 'Pago cancelado', text: 'El pago fue cancelado o reintegrado.', simulatedText: 'La simulación fue cancelada y no se procesó ningún cobro.', color: 'bg-ink', icon: NoSymbolIcon },
}

export default function PaymentResult({ initialStatus, orderId, paymentId }: { initialStatus: PaymentStatus; orderId?: string; paymentId?: string }) {
  const simulated = paymentService.isSimulated
  const [status, setStatus] = useState<PaymentStatus>(simulated || !paymentId ? initialStatus : 'pending')
  const [checking, setChecking] = useState(Boolean(!simulated && paymentId))
  const [retrying, setRetrying] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (simulated || !paymentId) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let attempts = 0
    const check = async () => {
      try {
        const payment = (await paymentService.getStatus(paymentId)).data
        if (cancelled) return
        setStatus(payment.status)
        attempts += 1
        if (payment.status === 'pending' && attempts < 8) timer = setTimeout(check, 2000)
        else setChecking(false)
      } catch {
        if (!cancelled) { setChecking(false); setError('No pudimos verificar el pago ahora. Podés volver a consultar desde Mis pedidos.') }
      }
    }
    void check()
    return () => { cancelled = true; if (timer) clearTimeout(timer) }
  }, [paymentId, simulated])

  async function retry() {
    if (!orderId) return
    setRetrying(true)
    setError('')
    try {
      const payment = (await paymentService.create({ orderId, methodId: 'pay-mercadopago', amount: 0, returnUrl: `${window.location.origin}/pago?order=${encodeURIComponent(orderId)}` })).data
      if (!payment.redirectUrl) throw new Error('Mercado Pago no devolvió una URL de pago.')
      window.location.href = payment.redirectUrl
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos reiniciar el pago.')
      setRetrying(false)
    }
  }

  const item = config[status]
  const Icon = item.icon
  return <main className="grid min-h-screen place-items-center bg-forest px-5 py-10">
    <div className="w-full max-w-lg rounded-[2rem] bg-cream p-8 text-center shadow-2xl">
      <span className={`mx-auto grid h-16 w-16 place-items-center rounded-full text-white ${item.color}`}><Icon className="h-9 w-9" /></span>
      {simulated && <p className="mt-6 text-xs font-extrabold uppercase tracking-widest text-orange">Resultado simulado</p>}
      {checking && <p className="mt-6 text-xs font-extrabold uppercase tracking-widest text-orange">Verificando con el servidor…</p>}
      <h1 className="mt-2 font-display text-4xl text-forest">{item.title}</h1>
      <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-ink/60">{simulated ? item.simulatedText : item.text}</p>
      <p className="mt-4 rounded-xl bg-white p-3 text-xs">Pedido: <b>{orderId ?? 'sin número'}</b></p>
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">{error}</p>}
      {simulated && <div className="mt-6 rounded-xl border border-dashed border-forest/20 p-4 text-left">
        <p className="text-xs font-bold text-forest">Cobro real no conectado</p>
        <p className="mt-1 text-[10px] text-ink/50">Ninguna respuesta de esta pantalla acredita un pago verdadero.</p>
      </div>}
      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        {!simulated && status === 'rejected' && orderId && <button disabled={retrying} onClick={() => void retry()} className="flex-1 rounded-full bg-orange px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{retrying ? 'Abriendo…' : 'Volver a pagar'}</button>}
        {simulated && status === 'rejected' && <Link href="/checkout" className="flex-1 rounded-full bg-orange px-5 py-3 text-sm font-bold text-white">Probar otro medio</Link>}
        <Link href="/mi-cuenta" className="flex-1 rounded-full bg-forest px-5 py-3 text-sm font-bold text-white">Mis pedidos</Link>
        <Link href="/" className="flex-1 rounded-full border px-5 py-3 text-sm font-bold">Inicio</Link>
      </div>
    </div>
  </main>
}
