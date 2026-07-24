import { mockPromotions } from '@/mocks/commerce'
import { mockProducts } from '@/mocks/catalog'
import { apiEndpoints, appConfig } from '@/lib/config'
import { mockResponse } from '@/lib/mockApi'
import { DataSourceError } from '@/types/api'
import { Product, Promotion } from '@/types/domain'
import { apiRequest, requireEndpoint } from '@/lib/apiClient'

export const promotionService={
 async getAll(){if(appConfig.dataSource==='api')return apiRequest<Promotion[]>(requireEndpoint(apiEndpoints.promotions,'promociones'));return mockResponse(mockPromotions.filter(item=>item.active))},
 async getProducts(){if(appConfig.dataSource==='api')return apiRequest<Product[]>(requireEndpoint(apiEndpoints.promotions,'productos en promoción'));const promoted=mockProducts.filter(product=>product.active&&product.promotionalPrice!==undefined);return mockResponse<Product[]>(promoted)},
 async getById(id:string){if(appConfig.dataSource==='api')throw new DataSourceError('Falta configurar el endpoint real para promociones.');const promotion=mockPromotions.find(item=>item.id===id);if(!promotion)throw new DataSourceError('Promoción no encontrada.',404);return mockResponse<Promotion>(promotion)},
}
