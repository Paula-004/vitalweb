import { mockDailyMenus, mockWeeklyMenus } from '@/mocks/catalog'
import { apiRequest } from '@/lib/apiClient'
import { apiEndpoints, buildQuery, useApiFor } from '@/lib/config'
import { mockResponse } from '@/lib/mockApi'
import { NotFoundError } from '@/types/api'
import { backofficeAdapter } from '@/adapters/backofficeAdapter'

export const menuService = {
  async getDailyMenu(date?: string) {
    if (useApiFor(apiEndpoints.dailyMenu)) {
      const response = await this.getDailyMenus(date)
      const menu = response.data.find(item => (date ? item.date === date : item.active)) ?? response.data[0]
      if (!menu) throw new NotFoundError('Menú diario', date ?? 'activo')
      return { ...response, data: menu }
    }
    const menu = date ? mockDailyMenus.find(item => item.date === date) : mockDailyMenus.find(item => item.active)
    if (!menu) throw new NotFoundError('Menú diario', date ?? 'activo')
    return mockResponse(menu)
  },

  async getDailyMenus(date?: string) {
    if (!useApiFor(apiEndpoints.dailyMenu)) return mockResponse(mockDailyMenus)
    const response = await apiRequest<unknown>(`${apiEndpoints.dailyMenu}${buildQuery({ date })}`)
    return { ...response, data: backofficeAdapter.list(response.data, backofficeAdapter.dailyMenu) }
  },

  async getWeeklyMenu(date?: string) {
    if (!useApiFor(apiEndpoints.weeklyMenu)) {
      const menu = mockWeeklyMenus.find(item => item.published)
      if (!menu) throw new NotFoundError('Menú semanal', 'publicado')
      return mockResponse(menu)
    }
    const response = await apiRequest<Record<string, unknown>>(`${apiEndpoints.weeklyMenu}${buildQuery({ date })}`)
    return { ...response, data: backofficeAdapter.weeklyMenu(response.data) }
  },
}
