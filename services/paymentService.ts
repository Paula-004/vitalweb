import { mockPaymentMethods } from '@/mocks/commerce'
import { apiRequest } from '@/lib/apiClient'
import { apiEndpoints, useApiFor } from '@/lib/config'
import { mockResponse } from '@/lib/mockApi'
import { backofficeAdapter } from '@/adapters/backofficeAdapter'
import { PaymentStatus, PaymentTransaction } from '@/types/domain'

/**
 * El cobro real todavía no está implementado: mientras
 * `NEXT_PUBLIC_API_PAYMENT_CREATE_ENDPOINT` esté vacío, `create` devuelve una
 * transacción de demostración (`isSimulation: true`) y no se cobra nada.
 *
 * Cuando el backoffice publique el proveedor, basta completar esa variable:
 * el importe definitivo lo calcula el backend a partir del pedido guardado, nunca
 * el navegador, y la confirmación llega por webhook. Ver README, "Conectar pagos reales".
 */
export const paymentService = {
  /** `true` mientras los pagos sean una demostración sin cobro real. */
  get isSimulated() { return !useApiFor(apiEndpoints.paymentCreate) },

  async getAll() {
    if (!useApiFor(apiEndpoints.paymentMethods)) return mockResponse(mockPaymentMethods.filter(item => item.active))
    const response = await apiRequest<unknown>(apiEndpoints.paymentMethods)
    const methods = backofficeAdapter.list(response.data, backofficeAdapter.paymentMethod).filter(item => item.active)
    return { ...response, data: methods }
  },

  /**
   * Inicia el pago de un pedido ya creado. `simulatedStatus` sólo se usa en la rama
   * de demostración; con proveedor real el estado lo define el backoffice.
   */
  async create(input: { orderId: string; methodId: string; amount: number; returnUrl?: string; simulatedStatus?: PaymentStatus }) {
    if (useApiFor(apiEndpoints.paymentCreate)) {
      // El importe no se envía: el backoffice lo toma del pedido guardado.
      const response = await apiRequest<Record<string, unknown>>(apiEndpoints.paymentCreate, {
        method: 'POST',
        body: JSON.stringify({ orderId: input.orderId, methodId: input.methodId, returnUrl: input.returnUrl }),
      })
      return { ...response, data: backofficeAdapter.paymentTransaction(response.data) }
    }
    return mockResponse<PaymentTransaction>({
      id: `payment-demo-${Date.now()}`,
      orderId: input.orderId,
      methodId: input.methodId,
      amount: input.amount,
      currency: 'ARS',
      status: input.simulatedStatus ?? 'approved',
      createdAt: new Date().toISOString(),
      isSimulation: true,
    })
  },

  async getStatus(paymentId: string) {
    const endpoint = apiEndpoints.paymentStatus ?? apiEndpoints.paymentCreate
    if (!useApiFor(endpoint)) {
      throw new Error('El seguimiento de pagos reales todavía no está disponible en esta demostración.')
    }
    const response = await apiRequest<Record<string, unknown>>(`${endpoint}/${encodeURIComponent(paymentId)}`)
    return { ...response, data: backofficeAdapter.paymentTransaction(response.data) }
  },
}
