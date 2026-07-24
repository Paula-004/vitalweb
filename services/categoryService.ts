import { mockCategories } from '@/mocks/catalog'
import { apiRequest, requireEndpoint } from '@/lib/apiClient'
import { appConfig, apiEndpoints } from '@/lib/config'
import { mockResponse } from '@/lib/mockApi'
import { Category } from '@/types/domain'
export const categoryService = { async getAll() { return appConfig.dataSource === 'mock' ? mockResponse(mockCategories.filter(c => c.active).sort((a,b) => a.sortOrder-b.sortOrder)) : apiRequest<Category[]>(requireEndpoint(apiEndpoints.categories, 'categorías')) }, async getBySlug(slug:string){if(appConfig.dataSource==='api')return apiRequest<Category>(requireEndpoint(apiEndpoints.categories,'detalle de categoría'));const category=mockCategories.find(item=>item.slug===slug&&item.active);if(!category)throw new Error(`Categoría ${slug} no encontrada.`);return mockResponse(category)} }
