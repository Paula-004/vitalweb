import { Cart, Product, WeekDay } from '@/types/domain'

const KEY = 'vitalweb-demo-cart'
const empty: Cart = { items: [], generalNotes: '' }
const WEEK_DAYS: WeekDay[] = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

/** Día de la semana en español para una fecha comercial `YYYY-MM-DD`. */
export function weekDayOf(date: string): WeekDay | undefined {
  const [year, month, day] = date.split('-').map(Number)
  if (!year || !month || !day) return undefined
  return WEEK_DAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]
}

const today = () => new Date().toISOString().slice(0, 10)

export const cartService = {
  load(): Cart {
    if (typeof window === 'undefined') return empty
    try { return JSON.parse(localStorage.getItem(KEY) ?? 'null') ?? empty } catch { return empty }
  },
  save(cart: Cart) {
    if (typeof window !== 'undefined') localStorage.setItem(KEY, JSON.stringify(cart))
  },
  clear() {
    if (typeof window !== 'undefined') localStorage.removeItem(KEY)
  },

  /**
   * Chequeo previo para avisarle al cliente antes de llegar al checkout.
   * No es autoridad: precio, stock y total definitivos los revalida el backoffice
   * al crear el pedido.
   */
  validate(cart: Cart, products: Product[], minimumOrder: number, options: { date?: string } = {}) {
    const issues: string[] = []
    if (!cart.items.length) issues.push('El carrito está vacío.')

    const date = options.date ?? today()
    const weekDay = weekDayOf(date)

    for (const item of cart.items) {
      const product = products.find(value => value.id === item.productId)
      if (!product || !product.active) { issues.push('Uno de los productos ya no existe.'); continue }
      // `availableDays` vacío significa que el backoffice no restringe el plato por día.
      const restrictedByDay = product.availableDays.length > 0 && weekDay !== undefined && !product.availableDays.includes(weekDay)
      if (!product.available || restrictedByDay) issues.push(`${product.name} no está disponible para la fecha seleccionada.`)
      else if (product.stock === 0) issues.push(`${product.name} está agotado.`)
      else if (item.quantity > product.stock) issues.push(`Sólo quedan ${product.stock} unidades de ${product.name}.`)
    }

    const subtotal = cart.items.reduce((sum, item) => {
      const product = products.find(value => value.id === item.productId)
      return sum + (product?.promotionalPrice ?? product?.price ?? 0) * item.quantity
    }, 0)
    if (subtotal < minimumOrder && cart.items.length) issues.push(`El monto mínimo es $${minimumOrder.toLocaleString('es-AR')}.`)

    return issues
  },
}
