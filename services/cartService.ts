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
  validate(cart: Cart, products: Product[]) {
    const issues: string[] = []
    if (!cart.items.length) issues.push('El carrito está vacío.')

    for (const item of cart.items) {
      const product = products.find(value => value.id === item.productId)
      if (!product) { issues.push(`No hay stock disponible del producto ${item.productId}. Quitalo del carrito para continuar.`); continue }
      if (product.stock <= 0) issues.push(`${product.name} no tiene stock. Quitalo del carrito para continuar.`)
      else if (item.quantity > product.stock) issues.push(`Sólo quedan ${product.stock} unidades de ${product.name}.`)
    }

    return issues
  },
}
