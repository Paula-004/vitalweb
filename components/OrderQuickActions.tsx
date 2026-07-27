'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { useNotification } from '@/contexts/NotificationContext'
import { orderService } from '@/services'
import { Order } from '@/types/domain'

const money = (value: number) => '$' + value.toLocaleString('es-AR')

export default function OrderQuickActions() {
  const { session, ready } = useAuth()
  const cart = useCart()
  const { notify } = useNotification()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [working, setWorking] = useState('')

  const userId = session?.user.id
  useEffect(() => {
    // Sin sesión restaurada no se piden endpoints protegidos.
    if (!ready || !userId) return
    orderService.getByUser(userId, { limit: 4 }).then(result => setOrders(result.data)).catch(() => setOrders([]))
  }, [ready, userId])

  if (!session || !orders.length) return null

  /** El backoffice recotiza: se avisa qué se descartó y qué cambió de precio. */
  const repeat = async (order: Order) => {
    setWorking(order.id)
    try {
      const result = await orderService.repeat(order.id)
      for (const item of result.items) {
        const product = cart.products.find(value => value.id === item.productId)
        if (product) cart.add(product, item.quantity)
      }
      if (!result.items.length) {
        notify('Ningún producto de ese pedido sigue disponible.', 'error')
        return
      }
      const warnings = [
        ...result.unavailable.map(item => `${item.productName}: ${item.reason}`),
        ...result.priceChanges.map(item => `${item.productName} pasó de ${money(item.previousPrice)} a ${money(item.currentPrice)}`),
      ]
      notify(
        warnings.length ? `Pedido agregado. ${warnings.join('. ')}.` : 'Pedido agregado con precios y stock actualizados.',
        warnings.length ? 'info' : 'success',
      )
      router.push('/carrito')
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'No se pudo repetir el pedido.', 'error')
    } finally {
      setWorking('')
    }
  }

  const cancel = async (order: Order) => {
    if (!window.confirm(`¿Confirmás cancelar el pedido ${order.id}?`)) return
    setWorking(order.id)
    try {
      const updated = (await orderService.cancel(order.id)).data
      setOrders(current => current.map(item => (item.id === updated.id ? updated : item)))
      notify(`Pedido ${order.id} cancelado.`, 'info')
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'No se pudo cancelar.', 'error')
    } finally {
      setWorking('')
    }
  }

  return <section className="mx-auto max-w-7xl px-5 pb-12 lg:px-8">
    <h2 className="font-display text-2xl text-forest">Acciones rápidas</h2>
    <p className="mt-1 text-xs text-ink/50">Al repetir, usamos precios y disponibilidad actuales.</p>
    <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
      {orders.slice(0, 4).map(order => <article key={order.id} className="min-w-64 rounded-2xl bg-white p-4">
        <b className="text-sm text-forest">{order.id}</b>
        <p className="text-xs text-ink/50">{order.details.length} productos · {order.status}</p>
        <div className="mt-3 flex gap-2">
          <button disabled={!!working} onClick={() => repeat(order)} className="rounded-full bg-orange px-3 py-2 text-[10px] font-bold text-white disabled:opacity-40">Repetir</button>
          {['pending', 'confirmed'].includes(order.status) && <button disabled={!!working} onClick={() => cancel(order)} className="rounded-full border border-red-200 px-3 py-2 text-[10px] font-bold text-red-700 disabled:opacity-40">Cancelar</button>}
        </div>
      </article>)}
    </div>
  </section>
}
