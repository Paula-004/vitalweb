import { mockStoreConfig } from '@/mocks/commerce'
import { apiRequest } from '@/lib/apiClient'
import { apiEndpoints, useApiFor } from '@/lib/config'
import { mockResponse } from '@/lib/mockApi'
import { backofficeAdapter } from '@/adapters/backofficeAdapter'

export const storeConfigService = {
  async get() {
    if (!useApiFor(apiEndpoints.storeConfig)) return mockResponse(mockStoreConfig)
    try {
      const response = await apiRequest<Record<string, unknown>>(apiEndpoints.storeConfig)
      return { ...response, data: backofficeAdapter.storeConfig(response.data) }
    } catch {
      // La tienda no puede quedar sin nombre, mínimo ni horarios: se usa el fallback neutro.
      return mockResponse(mockStoreConfig)
    }
  },
}
