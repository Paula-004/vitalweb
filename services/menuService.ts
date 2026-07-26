import { mockDailyMenus, mockWeeklyMenus } from '@/mocks/catalog'
import { apiRequest, requireEndpoint } from '@/lib/apiClient'
import { apiEndpoints, appConfig } from '@/lib/config'
import { mockResponse } from '@/lib/mockApi'
import { NotFoundError } from '@/types/api'
import { DailyMenu, WeeklyMenu } from '@/types/domain'

export const menuService = {
 async getDailyMenu(date?:string){
  if(appConfig.dataSource==='api'){const response=await this.getDailyMenus(date);const menu=response.data.find(item=>date?item.date===date:item.active)??response.data[0];if(!menu)throw new NotFoundError('Menú diario',date??'activo');return{...response,data:menu}}
  const menu=date?mockDailyMenus.find(item=>item.date===date):mockDailyMenus.find(item=>item.active)
  if(!menu)throw new NotFoundError('Menú diario',date??'activo')
  return mockResponse(menu)
 },
 async getWeeklyMenu(date?:string){
  if(appConfig.dataSource==='api'){const endpoint=requireEndpoint(apiEndpoints.weeklyMenu,'menú semanal');return apiRequest<WeeklyMenu>(date?`${endpoint}?date=${encodeURIComponent(date)}`:endpoint)}
  const menu=mockWeeklyMenus.find(item=>item.published)
  if(!menu)throw new NotFoundError('Menú semanal','publicado')
  return mockResponse(menu)
 },
 async getDailyMenus(date?:string){
  if(appConfig.dataSource==='api'){const endpoint=requireEndpoint(apiEndpoints.dailyMenu,'menús diarios');return apiRequest<DailyMenu[]>(date?`${endpoint}?date=${encodeURIComponent(date)}`:endpoint)}
  return mockResponse(mockDailyMenus)
 },
}
