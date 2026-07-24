import { mockOrders } from '@/mocks/orders'
import { mockProducts } from '@/mocks/catalog'
import { apiRequest, requireEndpoint } from '@/lib/apiClient'
import { appConfig, apiEndpoints } from '@/lib/config'
import { mockResponse } from '@/lib/mockApi'
import { DataSourceError, NotFoundError } from '@/types/api'
import { CreateOrderInput, Order, OrderDetail } from '@/types/domain'

export const orderService = {
  async create(input: CreateOrderInput) {
    if (appConfig.dataSource === 'api') return apiRequest<Order>(requireEndpoint(apiEndpoints.orders,'pedidos'), { method:'POST', body:JSON.stringify(input) })
    if (!input.items.length) throw new DataSourceError('El pedido no contiene productos.', 400)
    const details: OrderDetail[] = input.items.map((item,index) => {
      const product=mockProducts.find(p=>p.id===item.productId)
      if(!product) throw new NotFoundError('Producto',item.productId)
      const unitPrice=product.promotionalPrice??product.price
      return { id:`detail-${Date.now()}-${index}`, productId:product.id, productName:product.name, quantity:item.quantity, unitPrice, subtotal:unitPrice*item.quantity }
    })
    const subtotal=details.reduce((sum,item)=>sum+item.subtotal,0)
    const shippingCost=input.shippingCost??0
    const order:Order={ id:`VF-${String(Date.now()).slice(-6)}`, status:'confirmed', details, subtotal, shippingCost, discount:0, total:subtotal+shippingCost, currency:'ARS', paymentMethodId:input.paymentMethodId, timeSlotId:input.timeSlotId, pickup:input.pickup, userId:input.userId, shippingAddress:input.shippingAddress, couponCode:input.couponCode, notes:input.notes, createdAt:new Date().toISOString() }
    mockOrders.push(order)
    return mockResponse(order)
  },
  async getById(id:string) { if(appConfig.dataSource==='api') return apiRequest<Order>(`${requireEndpoint(apiEndpoints.orders,'pedidos')}/${id}`); const order=mockOrders.find(o=>o.id===id); if(!order) throw new NotFoundError('Pedido',id); return mockResponse(order) },
  async getByUser(userId:string){if(appConfig.dataSource==='api')return apiRequest<Order[]>(requireEndpoint(apiEndpoints.orders,'pedidos del usuario'));return mockResponse(mockOrders.filter(order=>order.userId===userId).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)))},
  async cancel(id:string){if(appConfig.dataSource==='api')return apiRequest<Order>(requireEndpoint(apiEndpoints.orders,'cancelación de pedido'),{method:'PATCH',body:JSON.stringify({status:'cancelled'})});const order=mockOrders.find(item=>item.id===id);if(!order)throw new NotFoundError('Pedido',id);if(!['pending','confirmed'].includes(order.status))throw new DataSourceError('Este pedido ya no puede cancelarse.',409);order.status='cancelled';return mockResponse(order)},
}
