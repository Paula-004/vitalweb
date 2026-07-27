import { mockCategories } from '@/mocks/catalog'
import { apiRequest } from '@/lib/apiClient'
import { apiEndpoints, buildQuery, useApiFor } from '@/lib/config'
import { mockResponse } from '@/lib/mockApi'
import { NotFoundError } from '@/types/api'
import { backofficeAdapter } from '@/adapters/backofficeAdapter'

export const categoryService = {
  async getAll(options: { active?: boolean } = { active: true }) {
    if (!useApiFor(apiEndpoints.categories)) {
      return mockResponse(mockCategories.filter(item => item.active).sort((a, b) => a.sortOrder - b.sortOrder))
    }
    const response = await apiRequest<unknown>(`${apiEndpoints.categories}${buildQuery({ active: options.active })}`)
    const categories = backofficeAdapter.list(response.data, backofficeAdapter.category)
      .filter(item => options.active === false || item.active)
      .sort((a, b) => a.sortOrder - b.sortOrder)
    return { ...response, data: categories }
  },

  async getBySlug(slug: string) {
    if (!useApiFor(apiEndpoints.categories)) {
      const category = mockCategories.find(item => item.slug === slug && item.active)
      if (!category) throw new NotFoundError('Categoría', slug)
      return mockResponse(category)
    }
    const response = await this.getAll()
    const category = response.data.find(item => item.slug === slug)
    if (!category) throw new NotFoundError('Categoría', slug)
    return { ...response, data: category }
  },
}
