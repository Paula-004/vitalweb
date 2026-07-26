import { mockCategories } from '@/mocks/catalog'
import { apiRequest, requireEndpoint } from '@/lib/apiClient'
import { apiEndpoints, appConfig } from '@/lib/config'
import { mockResponse } from '@/lib/mockApi'
import { Category } from '@/types/domain'

export const categoryService = {
 async getAll(){return appConfig.dataSource==='mock'?mockResponse(mockCategories.filter(item=>item.active).sort((a,b)=>a.sortOrder-b.sortOrder)):apiRequest<Category[]>(requireEndpoint(apiEndpoints.categories,'categorías'))},
 async getBySlug(slug:string){
  if(appConfig.dataSource==='api'){const response=await this.getAll();const category=response.data.find(item=>item.slug===slug);if(!category)throw new Error(`Categoría ${slug} no encontrada.`);return{...response,data:category}}
  const category=mockCategories.find(item=>item.slug===slug&&item.active)
  if(!category)throw new Error(`Categoría ${slug} no encontrada.`)
  return mockResponse(category)
 },
}
