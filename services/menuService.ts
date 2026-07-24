import { mockDailyMenus, mockWeeklyMenus } from '@/mocks/catalog'
import { apiRequest, requireEndpoint } from '@/lib/apiClient'
import { appConfig, apiEndpoints } from '@/lib/config'
import { mockResponse } from '@/lib/mockApi'
import { NotFoundError } from '@/types/api'
import { DailyMenu, WeeklyMenu } from '@/types/domain'

export const menuService = {
  async getDailyMenu(date?: string) {
    if(appConfig.dataSource === 'api'){
      const endpoint=requireEndpoint(apiEndpoints.dailyMenu,'menú diario')
      const response=await apiRequest<DailyMenu[]|DailyMenu>(`${endpoint}${date?`?date=${encodeURIComponent(date)}`:''}`)
      const menu=Array.isArray(response.data)?(date?response.data.find(item=>item.date===date):response.data.find(item=>item.active)??response.data[0]):response.data
      if(!menu)throw new NotFoundError('Menú diario',date??'activo')
      return{...response,data:menu}
    }
    const menu=date?mockDailyMenus.find(m=>m.date===date):mockDailyMenus.find(m=>m.active)
    if(!menu) throw new NotFoundError('Menú diario',date??'activo')
    return mockResponse(menu)
  },
  async getWeeklyMenu() { if(appConfig.dataSource === 'api') return apiRequest<WeeklyMenu>(requireEndpoint(apiEndpoints.weeklyMenu,'menú semanal')); const menu=mockWeeklyMenus.find(m=>m.published); if(!menu) throw new NotFoundError('Menú semanal','publicado'); return mockResponse(menu) },
  async getDailyMenus() { if(appConfig.dataSource==='api') return apiRequest<DailyMenu[]>(requireEndpoint(apiEndpoints.dailyMenu,'menús diarios')); return mockResponse(mockDailyMenus) },
}
