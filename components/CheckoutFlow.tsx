'use client'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { useStoreConfig } from '@/hooks/useStoreConfig'
import { cartService, couponService, orderService, paymentService, shippingService } from '@/services'
import { Address, PaymentMethod, PaymentStatus, ShippingQuote, ShippingZone } from '@/types/domain'

const labels = ['Identificación', 'Entrega', 'Dirección o retiro', 'Fecha y horario', 'Pago', 'Confirmación']
const money = (n: number) => '$' + n.toLocaleString('es-AR')
const todayISO = () => new Date().toISOString().slice(0, 10)
const PHONE_PATTERN = /^[\d\s+()-]{6,}$/

interface Guest { firstName: string; lastName: string; phone: string }
const emptyGuest: Guest = { firstName: '', lastName: '', phone: '' }

export default function CheckoutFlow() {
  const router = useRouter()
  const { session, ready } = useAuth()
  const cart = useCart()
  const { data: storeConfig } = useStoreConfig()

  const [step, setStep] = useState(0)
  const [delivery, setDelivery] = useState<'delivery' | 'pickup'>('delivery')
  const [guest, setGuest] = useState<Guest>(emptyGuest)
  const [addressId, setAddressId] = useState('')
  const [address, setAddress] = useState<Partial<Address>>({})
  const [zones, setZones] = useState<ShippingZone[]>([])
  const [zoneId, setZoneId] = useState('')
  const [date, setDate] = useState(todayISO())
  const [quote, setQuote] = useState<ShippingQuote | null>(null)
  const [quoting, setQuoting] = useState(false)
  const [slotId, setSlotId] = useState('')
  const [payments, setPayments] = useState<PaymentMethod[]>([])
  const [paymentId, setPaymentId] = useState('')
  const [demoStatus, setDemoStatus] = useState<PaymentStatus>('approved')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [freeShipping, setFreeShipping] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const savedAddress = session?.user.addresses.find(item => item.id === addressId)
  const postalCode = savedAddress?.postalCode ?? address.postalCode ?? ''

  useEffect(() => {
    Promise.all([shippingService.getZones(), paymentService.getAll()])
      .then(([z, p]) => {
        setZones(z.data)
        setZoneId(current => current || z.data.find(item => item.active)?.id || '')
        setPayments(p.data)
        setPaymentId(current => current || p.data[0]?.id || '')
      })
      .catch(cause => setError(cause instanceof Error ? cause.message : 'No pudimos cargar zonas y medios de pago.'))
  }, [])

  useEffect(() => {
    if (!session) return
    const initial = session.user.addresses.find(item => item.isDefault) ?? session.user.addresses[0]
    setAddressId(initial?.id ?? '')
  }, [session])

  // El costo de envío y las franjas los define el backoffice, no el navegador.
  const items = useMemo(() => cart.cart.items.map(item => ({ productId: item.productId, quantity: item.quantity })), [cart.cart.items])
  useEffect(() => {
    if (!cart.ready || !items.length) return
    let cancelled = false
    setQuoting(true)
    shippingService
      .quote({ postalCode, zoneId: zoneId || undefined, date, items, pickup: delivery === 'pickup' }, cart.subtotal)
      .then(response => {
        if (cancelled) return
        setQuote(response.data)
        const available = response.data.timeSlots
        setSlotId(current => (available.some(slot => slot.id === current) ? current : available[0]?.id ?? ''))
      })
      .catch(() => { if (!cancelled) setQuote(null) })
      .finally(() => { if (!cancelled) setQuoting(false) })
    return () => { cancelled = true }
  }, [cart.ready, items, postalCode, zoneId, date, delivery, cart.subtotal])

  const couponCode = cart.cart.couponCode
  const setCoupon = cart.setCoupon
  useEffect(() => {
    if (!couponCode) { setCouponDiscount(0); setFreeShipping(false); return }
    couponService
      .validate(couponCode, cart.cart, { userId: session?.user.id, zoneId, date, deliveryMethod: delivery })
      .then(result => { setCouponDiscount(result.data.discount); setFreeShipping(result.data.freeShipping) })
      .catch(() => { setCoupon(); setCouponDiscount(0); setFreeShipping(false) })
    // El cupón se revalida cuando cambia su código o el contexto de entrega.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couponCode, zoneId, date, delivery, session?.user.id])

  const minimumOrder = storeConfig?.minimumOrder ?? 0
  const shipping = delivery === 'pickup' || freeShipping ? 0 : quote?.cost ?? 0
  const total = Math.max(0, cart.subtotal - couponDiscount) + shipping
  const slots = quote?.timeSlots ?? []

  const stepError = useCallback((index: number): string => {
    switch (index) {
      case 0:
        if (session) return ''
        if (!guest.firstName.trim() || !guest.lastName.trim()) return 'Completá tu nombre y apellido.'
        if (!PHONE_PATTERN.test(guest.phone)) return 'Ingresá un teléfono de contacto válido.'
        return ''
      case 2:
        if (delivery === 'pickup') return ''
        if (!savedAddress && !makeAddress(address, zoneId)) return 'Completá todos los datos de la dirección de entrega.'
        if (quote && !quote.available) return quote.message ?? 'No hay envío disponible para esa dirección.'
        return ''
      case 3:
        if (date < todayISO()) return 'Elegí una fecha de entrega a partir de hoy.'
        if (!slotId) return 'Elegí una franja horaria.'
        return ''
      case 4:
        return paymentId ? '' : 'Elegí un medio de pago.'
      default:
        return ''
    }
  }, [session, guest, delivery, savedAddress, address, zoneId, quote, date, slotId, paymentId])

  const goNext = () => {
    const message = stepError(step)
    setError(message)
    if (!message) setStep(value => value + 1)
  }

  const confirm = async () => {
    if (loading) return
    setLoading(true)
    setError('')
    try {
      for (let index = 0; index <= 4; index++) {
        const message = stepError(index)
        if (message) { setStep(index); throw new Error(message) }
      }
      const issues = cartService.validate(cart.cart, cart.products, minimumOrder, { date })
      if (issues.length) throw new Error(issues[0])

      const shippingAddress = delivery === 'delivery' ? (savedAddress ?? makeAddress(address, zoneId)) : undefined
      // El contacto viaja siempre: el backoffice identifica al cliente por teléfono,
      // y en retiro por el local no hay dirección de la que sacarlo.
      const contact = session
        ? { firstName: session.user.firstName, lastName: session.user.lastName, phone: session.user.phone }
        : guest
      const order = (await orderService.create({
        userId: session?.user.id,
        contact,
        items: cart.cart.items.map(item => ({ productId: item.productId, quantity: item.quantity, notes: item.notes })),
        paymentMethodId: paymentId,
        timeSlotId: slotId,
        deliveryDate: date,
        shippingAddress,
        pickup: delivery === 'pickup',
        shippingCost: shipping,
        couponCode: cart.cart.couponCode,
        notes: cart.cart.generalNotes,
      })).data

      const payment = (await paymentService.create({
        orderId: order.id,
        methodId: paymentId,
        amount: order.total || total,
        simulatedStatus: demoStatus,
        returnUrl: typeof window !== 'undefined' ? `${window.location.origin}/pago?order=${order.id}` : undefined,
      })).data

      cart.clear()
      if (payment.redirectUrl) { window.location.href = payment.redirectUrl; return }
      router.push(`/pago?status=${payment.status}&order=${order.id}`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo confirmar la operación.')
    } finally {
      setLoading(false)
    }
  }

  if (!ready || !cart.ready) return <Empty text="Preparando checkout..." />
  if (!cart.cart.items.length) return <Empty text="El carrito está vacío." link />

  const cashId = delivery === 'delivery' ? 'pay-cash-delivery' : 'pay-cash-pickup'
  const visiblePayments = payments.filter(item => !item.id.startsWith('pay-cash-') || item.id === cashId)
  const pickupPoint = storeConfig ? `${storeConfig.address} · ${storeConfig.businessHours}` : 'Consultá el punto de retiro.'

  return <div className="mx-auto max-w-5xl px-5 py-10 lg:px-8">
    <p className="text-xs font-extrabold uppercase tracking-widest text-orange">{paymentService.isSimulated ? 'Checkout con pago simulado' : 'Checkout'}</p>
    <h1 className="mt-2 font-display text-4xl text-forest">Finalizá tu pedido</h1>
    <div className="scrollbar-none mt-7 flex gap-2 overflow-auto">{labels.map((label, index) => <span key={label} className={`whitespace-nowrap rounded-full px-4 py-2 text-[10px] font-bold ${index === step ? 'bg-forest text-white' : index < step ? 'bg-[#dce5d6]' : 'bg-white text-ink/40'}`}>{index + 1}. {label}</span>)}</div>
    <div className="mt-7 grid gap-7 lg:grid-cols-[1fr_320px]">
      <section className="min-h-[400px] rounded-[2rem] bg-white p-6 sm:p-8">
        {step === 0 && <Step title="Identificación">{session
          ? <Card title={`${session.user.firstName} ${session.user.lastName}`} text={session.user.phone} />
          : <div>
            <p className="text-sm text-ink/60">Continuá como invitado o iniciá sesión para guardar el pedido.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Nombre" value={guest.firstName} change={value => setGuest(old => ({ ...old, firstName: value }))} />
              <Field label="Apellido" value={guest.lastName} change={value => setGuest(old => ({ ...old, lastName: value }))} />
              <Field label="Teléfono" value={guest.phone} change={value => setGuest(old => ({ ...old, phone: value }))} />
            </div>
            <Link href="/login" className="mt-4 inline-block text-sm font-bold text-orange">Ingresar a mi cuenta</Link>
          </div>}</Step>}

        {step === 1 && <Step title="Forma de entrega"><div className="grid gap-3 sm:grid-cols-2">
          {(storeConfig?.deliveryEnabled ?? true) && <Option active={delivery === 'delivery'} onClick={() => setDelivery('delivery')} title="Envío a domicilio" text="Costo según zona." />}
          {(storeConfig?.pickupEnabled ?? true) && <Option active={delivery === 'pickup'} onClick={() => setDelivery('pickup')} title="Retiro por el local" text={storeConfig?.address ?? 'Retirás en el local.'} />}
        </div></Step>}

        {step === 2 && <Step title={delivery === 'delivery' ? 'Dirección' : 'Retiro'}>{delivery === 'pickup'
          ? <Card title={storeConfig?.name ?? 'Punto de retiro'} text={pickupPoint} />
          : <div className="space-y-3">
            {session?.user.addresses.map(item => <Option key={item.id} active={addressId === item.id} onClick={() => setAddressId(item.id)} title={item.label} text={`${item.street} ${item.streetNumber}, ${item.city}`} />)}
            {session && addressId && <button onClick={() => setAddressId('')} className="text-xs font-bold text-orange">Usar otra dirección</button>}
            <select aria-label="Zona de envío" value={zoneId} onChange={event => setZoneId(event.target.value)} className="w-full rounded-xl border p-3 text-sm">{zones.map(item => <option key={item.id} value={item.id}>{item.name} · {money(item.price)}</option>)}</select>
            {!addressId && <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Quien recibe" value={address.recipientName ?? ''} change={value => setAddress(old => ({ ...old, recipientName: value }))} />
              <Field label="Calle" value={address.street ?? ''} change={value => setAddress(old => ({ ...old, street: value }))} />
              <Field label="Número" value={address.streetNumber ?? ''} change={value => setAddress(old => ({ ...old, streetNumber: value }))} />
              <Field label="Ciudad" value={address.city ?? ''} change={value => setAddress(old => ({ ...old, city: value }))} />
              <Field label="Provincia" value={address.province ?? ''} change={value => setAddress(old => ({ ...old, province: value }))} />
              <Field label="Código postal" value={address.postalCode ?? ''} change={value => setAddress(old => ({ ...old, postalCode: value }))} />
              <Field label="Teléfono" value={address.phone ?? ''} change={value => setAddress(old => ({ ...old, phone: value }))} />
              <Field label="Referencia" value={address.deliveryNotes ?? ''} change={value => setAddress(old => ({ ...old, deliveryNotes: value }))} />
            </div>}
            {quote && !quote.available && <p className="rounded-xl bg-[#fff2d8] p-3 text-xs font-bold text-[#6d4b12]">{quote.message ?? 'Sin cobertura para esa dirección.'}</p>}
          </div>}</Step>}

        {step === 3 && <Step title="Fecha y horario">
          <label className="block text-xs font-bold text-forest">Fecha de {delivery === 'pickup' ? 'retiro' : 'entrega'}
            <input type="date" min={todayISO()} value={date} onChange={event => setDate(event.target.value)} className="mt-1 w-full rounded-xl border p-3 font-normal" />
          </label>
          {storeConfig?.orderDeadline && <p className="mb-4 mt-3 text-sm text-ink/60">Pedidos hasta las {storeConfig.orderDeadline}.</p>}
          {quoting && <p className="text-sm text-ink/50">Buscando franjas disponibles...</p>}
          {!quoting && !slots.length && <p className="rounded-xl bg-[#fff2d8] p-3 text-xs font-bold text-[#6d4b12]">No hay franjas disponibles para esa fecha.</p>}
          {slots.map(item => <Option key={item.id} active={slotId === item.id} onClick={() => setSlotId(item.id)} title={item.label} text={delivery === 'pickup' ? 'Horario estimado de retiro' : 'Franja de entrega'} />)}
        </Step>}

        {step === 4 && <Step title="Medio de pago">
          <div className="space-y-2">{visiblePayments.map(item => <Option key={item.id} active={paymentId === item.id} onClick={() => setPaymentId(item.id)} title={item.name} text={item.description ?? 'Método disponible.'} />)}</div>
          {paymentService.isSimulated && <div className="mt-5 rounded-xl bg-[#fff2d8] p-4 text-xs text-[#6d4b12]">
            <b>Simulador explícito:</b> el cobro real todavía no está conectado. No ingreses datos reales de tarjeta ni de cuenta. Elegí el resultado que querés probar.
            <select aria-label="Resultado del pago demo" value={demoStatus} onChange={event => setDemoStatus(event.target.value as PaymentStatus)} className="mt-2 w-full rounded-lg border bg-white p-2">
              <option value="approved">Aprobado</option><option value="pending">Pendiente</option><option value="rejected">Rechazado</option><option value="cancelled">Cancelado</option>
            </select>
          </div>}
        </Step>}

        {step === 5 && <Step title="Resumen y confirmación">
          <div className="space-y-2 text-sm">{cart.cart.items.map(item => {
            const product = cart.products.find(value => value.id === item.productId)
            return <p key={item.productId} className="flex justify-between"><span>{item.quantity} × {product?.name}</span><b>{money((product?.promotionalPrice ?? product?.price ?? 0) * item.quantity)}</b></p>
          })}</div>
          <div className="mt-5 border-t pt-4 text-sm">
            <p>Entrega: <b>{delivery === 'delivery' ? 'Domicilio' : 'Retiro'}</b> · <b>{date}</b></p>
            <p>Pago: <b>{visiblePayments.find(item => item.id === paymentId)?.name ?? 'Sin seleccionar'}</b></p>
            {paymentService.isSimulated && <p>Resultado demo: <b>{demoStatus}</b></p>}
          </div>
        </Step>}

        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">{error}</p>}
        <div className="mt-8 flex justify-between">
          <button disabled={step === 0 || loading} onClick={() => { setError(''); setStep(value => value - 1) }} className="rounded-full border px-5 py-3 text-sm font-bold disabled:opacity-30">Atrás</button>
          {step < 5
            ? <button onClick={goNext} className="rounded-full bg-orange px-6 py-3 text-sm font-bold text-white">Continuar</button>
            : <button disabled={loading} onClick={confirm} className="rounded-full bg-orange px-6 py-3 text-sm font-bold text-white disabled:opacity-50">{loading ? 'Confirmando una vez...' : 'Confirmar pedido'}</button>}
        </div>
      </section>

      <aside className="h-fit rounded-[2rem] bg-forest p-6 text-cream">
        <h2 className="font-display text-2xl">Resumen</h2>
        <div className="mt-5 space-y-3 text-sm">
          <Row label="Productos" value={money(cart.subtotal)} />
          {couponDiscount > 0 && <Row label={`Cupón ${cart.cart.couponCode}`} value={`- ${money(couponDiscount)}`} />}
          <Row label="Envío" value={quoting ? 'Calculando...' : shipping ? money(shipping) : 'Sin cargo'} />
          <p className="flex justify-between border-t border-cream/20 pt-4 text-lg"><span>Total</span><b>{money(total)}</b></p>
        </div>
      </aside>
    </div>
  </div>
}

function Step({ title, children }: { title: string; children: React.ReactNode }) { return <div><h2 className="mb-5 font-display text-3xl text-forest">{title}</h2>{children}</div> }
function Option({ active, onClick, title, text }: { active: boolean; onClick: () => void; title: string; text: string }) { return <button onClick={onClick} className={`mb-2 w-full rounded-2xl border p-5 text-left focus-visible:ring-2 focus-visible:ring-orange ${active ? 'border-orange bg-[#fff7ed]' : 'border-forest/10'}`}><b className="block text-sm">{title}</b><span className="text-xs text-ink/50">{text}</span></button> }
function Card({ title, text }: { title: string; text: string }) { return <div className="rounded-2xl bg-[#edf1e8] p-5"><b>{title}</b><p className="text-sm text-ink/60">{text}</p></div> }
function Field({ label, type = 'text', value, change }: { label: string; type?: string; value?: string; change?: (value: string) => void }) { return <label className="text-xs font-bold">{label}<input type={type} value={value} onChange={event => change?.(event.target.value)} className="mt-1 w-full rounded-xl border p-3 font-normal" /></label> }
function Row({ label, value }: { label: string; value: string }) { return <p className="flex justify-between"><span>{label}</span><b>{value}</b></p> }
function Empty({ text, link = false }: { text: string; link?: boolean }) { return <div className="grid min-h-[65vh] place-items-center text-center"><div><h1 className="font-display text-3xl text-forest">{text}</h1>{link && <Link href="/catalogo" className="mt-5 inline-block rounded-full bg-orange px-5 py-3 text-sm font-bold text-white">Ver catálogo</Link>}</div></div> }

function makeAddress(input: Partial<Address>, zoneId: string): Address | undefined {
  if (!input.recipientName || !input.street || !input.streetNumber || !input.city || !input.province || !input.postalCode || !input.phone) return undefined
  return {
    id: `checkout-${Date.now()}`, label: 'Entrega', recipientName: input.recipientName, street: input.street,
    streetNumber: input.streetNumber, city: input.city, province: input.province, postalCode: input.postalCode,
    phone: input.phone, deliveryNotes: input.deliveryNotes, isDefault: false, shippingZoneId: zoneId,
  }
}
