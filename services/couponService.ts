import { mockCoupons } from '@/mocks/commerce'
import { apiRequest } from '@/lib/apiClient'
import { apiEndpoints, appConfig, useApiFor } from '@/lib/config'
import { mockResponse } from '@/lib/mockApi'
import { DataSourceError } from '@/types/api'
import { backofficeAdapter } from '@/adapters/backofficeAdapter'
import { Cart, Coupon, Product } from '@/types/domain'
import { productService } from './productService'

export interface CouponResult { coupon: Coupon; discount: number; freeShipping: boolean; message: string }
export interface CouponContext { userId?: string; zoneId?: string; date?: string; deliveryMethod?: 'delivery' | 'pickup' }

const money = (value: number) => `$${value.toLocaleString('es-AR')}`
const today = () => new Date().toISOString().slice(0, 10)

export const couponService = {
  /** `false` mientras los cupones sean los de demostración de `mocks/`. */
  get isRemote() { return useApiFor(apiEndpoints.coupons) },

  /**
   * El descuento definitivo siempre lo decide el backoffice. La rama local existe sólo
   * para demostración y repite las mismas reglas, pero no es autoridad sobre el total.
   */
  async validate(code: string, cart: Cart, context: CouponContext = {}) {
    const normalized = code.trim().toUpperCase()

    if (useApiFor(apiEndpoints.coupons)) {
      const response = await apiRequest<Record<string, unknown>>(apiEndpoints.coupons, {
        method: 'POST',
        body: JSON.stringify({
          code: normalized,
          items: cart.items.map(item => ({ productId: item.productId, quantity: item.quantity })),
          userId: context.userId,
          zoneId: context.zoneId,
          date: context.date,
          deliveryMethod: context.deliveryMethod,
        }),
      })
      const data = response.data ?? {}
      const result: CouponResult = {
        coupon: backofficeAdapter.coupon((data.coupon ?? data) as Record<string, unknown>),
        discount: Number(data.discount ?? 0),
        freeShipping: Boolean(data.freeShipping),
        message: String(data.message ?? `Cupón ${normalized} aplicado correctamente.`),
      }
      return { ...response, data: result }
    }

    // Un descuento de demostracion no puede modificar el importe visible cuando
    // el pedido y el cobro se procesan contra la API real.
    if (appConfig.dataSource === 'api') {
      throw new DataSourceError('Los cupones no estan habilitados para pagos reales.', 503)
    }

    const coupon = mockCoupons.find(item => item.code === normalized && item.active)
    if (!coupon) throw new DataSourceError('El cupón ingresado no existe.', 404)

    const date = context.date ?? today()
    if (date < coupon.startsAt || date > coupon.endsAt) throw new DataSourceError('Este cupón está vencido.', 410)
    if (coupon.maxUses !== undefined && (coupon.usedCount ?? 0) >= coupon.maxUses) throw new DataSourceError('Este cupón alcanzó su límite de uso.', 409)
    if (context.userId && coupon.usedByUserIds?.includes(context.userId)) throw new DataSourceError('Este cupón ya fue utilizado por tu cuenta.', 409)

    const catalog = (await productService.getAll()).data
    const lines: Array<{ quantity: number; product: Product }> = cart.items
      .map(item => ({ quantity: item.quantity, product: catalog.find(product => product.id === item.productId) }))
      .filter((line): line is { quantity: number; product: Product } => Boolean(line.product))

    const lineTotal = (line: { quantity: number; product: Product }) => (line.product.promotionalPrice ?? line.product.price) * line.quantity
    const subtotal = lines.reduce((sum, line) => sum + lineTotal(line), 0)
    if (coupon.minimumOrder && subtotal < coupon.minimumOrder) {
      throw new DataSourceError(`La compra mínima para este cupón es ${money(coupon.minimumOrder)}.`, 422)
    }

    const eligible = lines.filter(line =>
      (!coupon.allowedCategoryIds?.length || coupon.allowedCategoryIds.includes(line.product.categoryId)) &&
      (!coupon.allowedProductIds?.length || coupon.allowedProductIds.includes(line.product.id)))
    if (!eligible.length) throw new DataSourceError('El cupón no aplica a los productos seleccionados.', 422)

    const eligibleTotal = eligible.reduce((sum, line) => sum + lineTotal(line), 0)
    const discount = coupon.type === 'percentage' ? Math.round(eligibleTotal * coupon.value / 100)
      : coupon.type === 'fixed' ? Math.min(coupon.value, eligibleTotal)
      : 0

    return mockResponse<CouponResult>({
      coupon,
      discount,
      freeShipping: coupon.type === 'free_shipping',
      message: `Cupón ${coupon.code} aplicado correctamente.`,
    })
  },
}
