import { mockOrders } from '@/mocks/orders'
import { mockProducts } from '@/mocks/catalog'
import { apiRequest } from '@/lib/apiClient'
import { apiEndpoints, buildQuery, useApiFor } from '@/lib/config'
import { mockResponse } from '@/lib/mockApi'
import { DataSourceError, NotFoundError } from '@/types/api'
import { backofficeAdapter } from '@/adapters/backofficeAdapter'
import { CreateOrderInput, Order, OrderDetail, OrderQuery, RepeatOrderResult } from '@/types/domain'
import { productService } from './productService'

const CANCELLABLE_STATUSES = ['pending', 'confirmed']

/** Clave única por intento de compra: impide que un doble clic genere dos pedidos. */
const newIdempotencyKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `order-${Date.now()}-${Math.random().toString(16).slice(2)}`

export const orderService = {
  async create(input: CreateOrderInput, idempotencyKey = newIdempotencyKey()) {
    if (useApiFor(apiEndpoints.orders)) {
      const response = await apiRequest<Record<string, unknown>>(apiEndpoints.orders, {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify(input),
      })
      return { ...response, data: backofficeAdapter.order(response.data) }
    }
    if (!input.items.length) throw new DataSourceError('El pedido no contiene productos.', 400)
    const details: OrderDetail[] = input.items.map((item, index) => {
      const product = mockProducts.find(p => p.id === item.productId)
      if (!product) throw new NotFoundError('Producto', item.productId)
      const unitPrice = product.promotionalPrice ?? product.price
      return { id: `detail-${Date.now()}-${index}`, productId: product.id, productName: product.name, quantity: item.quantity, unitPrice, subtotal: unitPrice * item.quantity }
    })
    const subtotal = details.reduce((sum, item) => sum + item.subtotal, 0)
    const shippingCost = input.shippingCost ?? 0
    const order: Order = {
      id: `VF-${String(Date.now()).slice(-6)}`, status: 'confirmed', details, subtotal, shippingCost, discount: 0,
      total: subtotal + shippingCost, currency: 'ARS', paymentMethodId: input.paymentMethodId, timeSlotId: input.timeSlotId,
      pickup: input.pickup, userId: input.userId, shippingAddress: input.shippingAddress, couponCode: input.couponCode,
      notes: input.notes, createdAt: new Date().toISOString(),
    }
    mockOrders.push(order)
    return mockResponse(order)
  },

  async getById(id: string) {
    if (useApiFor(apiEndpoints.orders)) {
      const response = await apiRequest<Record<string, unknown>>(`${apiEndpoints.orders}/${encodeURIComponent(id)}`)
      return { ...response, data: backofficeAdapter.order(response.data) }
    }
    const order = mockOrders.find(item => item.id === id)
    if (!order) throw new NotFoundError('Pedido', id)
    return mockResponse(order)
  },

  async getByUser(userId: string, query: OrderQuery = {}) {
    const endpoint = apiEndpoints.myOrders ?? apiEndpoints.orders
    if (useApiFor(endpoint)) {
      const response = await apiRequest<unknown>(`${endpoint}${buildQuery({ ...query })}`)
      return { ...response, data: backofficeAdapter.list(response.data, backofficeAdapter.order) }
    }
    const orders = mockOrders
      .filter(order => order.userId === userId)
      .filter(order => !query.status || order.status === query.status)
      .filter(order => !query.from || order.createdAt >= query.from)
      .filter(order => !query.to || order.createdAt <= query.to)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const page = query.page ?? 1
    const limit = query.limit ?? orders.length
    return mockResponse(orders.slice((page - 1) * limit, page * limit))
  },

  async cancel(id: string) {
    if (useApiFor(apiEndpoints.orders)) {
      const response = await apiRequest<Record<string, unknown>>(`${apiEndpoints.orders}/${encodeURIComponent(id)}/cancel`, { method: 'POST' })
      return { ...response, data: backofficeAdapter.order(response.data) }
    }
    const order = mockOrders.find(item => item.id === id)
    if (!order) throw new NotFoundError('Pedido', id)
    if (!CANCELLABLE_STATUSES.includes(order.status)) throw new DataSourceError('Este pedido ya no puede cancelarse.', 409)
    order.status = 'cancelled'
    return mockResponse(order)
  },

  /**
   * Recotiza un pedido anterior contra el catálogo vigente antes de tocar el carrito.
   * Disponibilidad, stock y precios pueden haber cambiado, así que se informa qué se
   * descarta y qué cambió de precio en lugar de repetir a ciegas.
   */
  async repeat(orderId: string): Promise<RepeatOrderResult> {
    const order = (await this.getById(orderId)).data
    const catalog = (await productService.getAll()).data
    const result: RepeatOrderResult = { items: [], unavailable: [], priceChanges: [] }
    for (const detail of order.details) {
      const product = catalog.find(item => item.id === detail.productId)
      if (!product || !product.active) {
        result.unavailable.push({ productId: detail.productId, productName: detail.productName, reason: 'Ya no está en el menú.' })
        continue
      }
      if (!product.available || product.stock < 1) {
        result.unavailable.push({ productId: product.id, productName: product.name, reason: 'Sin stock disponible.' })
        continue
      }
      const currentPrice = product.promotionalPrice ?? product.price
      if (currentPrice !== detail.unitPrice) {
        result.priceChanges.push({ productId: product.id, productName: product.name, previousPrice: detail.unitPrice, currentPrice })
      }
      const quantity = Math.min(detail.quantity, product.stock)
      if (quantity < detail.quantity) {
        result.unavailable.push({ productId: product.id, productName: product.name, reason: `Sólo quedan ${product.stock} unidades.` })
      }
      result.items.push({ productId: product.id, quantity })
    }
    return result
  },
}
