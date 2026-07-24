import { mockShippingZones, mockTimeSlots } from '@/mocks/commerce'
import { apiRequest, requireEndpoint } from '@/lib/apiClient'
import { appConfig, apiEndpoints } from '@/lib/config'
import { mockResponse } from '@/lib/mockApi'
import { ShippingZone, TimeSlot } from '@/types/domain'
export const shippingService = {
  async getZones() { return appConfig.dataSource==='mock'?mockResponse(mockShippingZones):apiRequest<ShippingZone[]>(requireEndpoint(apiEndpoints.shippingZones,'zonas de envío')) },
  async getTimeSlots() { return appConfig.dataSource==='mock'?mockResponse(mockTimeSlots):apiRequest<TimeSlot[]>(requireEndpoint(apiEndpoints.shippingZones,'franjas horarias')) },
}
