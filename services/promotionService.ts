import { mockPromotions } from '@/mocks/commerce'
import { apiRequest } from '@/lib/apiClient'
import { apiEndpoints, buildQuery, useApiFor } from '@/lib/config'
import { mockResponse } from '@/lib/mockApi'
import { NotFoundError } from '@/types/api'
import { backofficeAdapter } from '@/adapters/backofficeAdapter'
import { productService } from './productService'

export interface PromotionQuery { active?: boolean; date?: string; productId?: string; categoryId?: string }

export const promotionService = {
  async getAll(query: PromotionQuery = { active: true }) {
    if (!useApiFor(apiEndpoints.promotions)) return mockResponse(mockPromotions.filter(item => item.active))
    const response = await apiRequest<unknown>(`${apiEndpoints.promotions}${buildQuery({ ...query })}`)
    return { ...response, data: backofficeAdapter.list(response.data, backofficeAdapter.promotion) }
  },

  /** Productos con precio promocional vigente, resueltos siempre desde el catálogo. */
  async getProducts() {
    return productService.getAll({ promotion: true })
  },

  async getById(id: string) {
    const response = await this.getAll({})
    const promotion = response.data.find(item => item.id === id)
    if (!promotion) throw new NotFoundError('Promoción', id)
    return { ...response, data: promotion }
  },
}
