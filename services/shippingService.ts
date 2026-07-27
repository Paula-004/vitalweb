import { mockShippingZones, mockTimeSlots } from '@/mocks/commerce'
import { apiRequest } from '@/lib/apiClient'
import { apiEndpoints, buildQuery, useApiFor } from '@/lib/config'
import { mockResponse } from '@/lib/mockApi'
import { backofficeAdapter } from '@/adapters/backofficeAdapter'
import { ShippingQuote, ShippingQuoteInput, ShippingZone, TimeSlot } from '@/types/domain'

export interface TimeSlotQuery { date?: string; zoneId?: string; method?: 'delivery' | 'pickup' }

/** Reglas de envío usadas mientras el backoffice no publique `shipping/quote`. */
function quoteFromZones(input: ShippingQuoteInput, zones: ShippingZone[], slots: TimeSlot[], subtotal: number): ShippingQuote {
  const activeSlots = slots.filter(slot => slot.active)
  if (input.pickup) return { available: true, cost: 0, freeShipping: true, timeSlots: activeSlots }
  const zone = zones.find(item => item.id === input.zoneId)
    ?? zones.find(item => item.active && item.postalCodes.some(code => code.toUpperCase() === input.postalCode.trim().toUpperCase()))
  if (!zone) return { available: false, cost: 0, freeShipping: false, timeSlots: [], message: 'Todavía no llegamos a ese código postal.' }
  const freeShipping = zone.freeShippingFrom !== undefined && subtotal >= zone.freeShippingFrom
  return { available: true, zoneId: zone.id, cost: freeShipping ? 0 : zone.price, freeShipping, timeSlots: activeSlots }
}

export const shippingService = {
  async getZones() {
    if (!useApiFor(apiEndpoints.shippingZones)) return mockResponse(mockShippingZones)
    const response = await apiRequest<unknown>(apiEndpoints.shippingZones)
    return { ...response, data: backofficeAdapter.list(response.data, backofficeAdapter.shippingZone) }
  },

  async getTimeSlots(query: TimeSlotQuery = {}) {
    if (!useApiFor(apiEndpoints.timeSlots)) return mockResponse(mockTimeSlots)
    const response = await apiRequest<unknown>(`${apiEndpoints.timeSlots}${buildQuery({ ...query })}`)
    return { ...response, data: backofficeAdapter.list(response.data, backofficeAdapter.timeSlot) }
  },

  /**
   * Cotiza envío para una fecha y destino. El costo devuelto por el backoffice es el
   * definitivo: el navegador nunca decide cuánto se cobra.
   */
  async quote(input: ShippingQuoteInput, subtotal = 0) {
    if (useApiFor(apiEndpoints.shippingQuote)) {
      const response = await apiRequest<Record<string, unknown>>(apiEndpoints.shippingQuote, { method: 'POST', body: JSON.stringify(input) })
      const data = response.data ?? {}
      const quote: ShippingQuote = {
        available: data.available !== false,
        zoneId: data.zoneId === undefined ? undefined : String(data.zoneId),
        cost: Number(data.cost ?? 0),
        freeShipping: Boolean(data.freeShipping),
        timeSlots: backofficeAdapter.list(data.timeSlots, backofficeAdapter.timeSlot),
        message: data.message === undefined ? undefined : String(data.message),
      }
      return { ...response, data: quote }
    }
    const [zones, slots] = await Promise.all([this.getZones(), this.getTimeSlots({ date: input.date, zoneId: input.zoneId })])
    return mockResponse(quoteFromZones(input, zones.data, slots.data, subtotal))
  },
}
