import { mockProducts } from '@/mocks/catalog'
import { apiRequest, requireEndpoint } from '@/lib/apiClient'
import { appConfig, apiEndpoints } from '@/lib/config'
import { mockResponse } from '@/lib/mockApi'
import { NotFoundError } from '@/types/api'
import { Product } from '@/types/domain'
import { backofficeAdapter } from '@/adapters/backofficeAdapter'

export const productService = {
  async getAll() { if(appConfig.dataSource==='mock')return mockResponse(mockProducts.filter(p=>p.active).sort((a,b)=>a.displayOrder-b.displayOrder));const response=await apiRequest<unknown>(requireEndpoint(apiEndpoints.products,'productos'));return{...response,data:backofficeAdapter.list(response.data,backofficeAdapter.product)} },
  async getFeatured() { if(appConfig.dataSource==='api') return apiRequest<Product[]>(requireEndpoint(apiEndpoints.products,'productos destacados')); return mockResponse(mockProducts.filter(product=>product.active&&product.featured).sort((a,b)=>a.displayOrder-b.displayOrder)) },
  async getBySlug(slug:string) { if(appConfig.dataSource==='api'){const endpoint=requireEndpoint(apiEndpoints.products,'detalle de producto').replace('{slug}',encodeURIComponent(slug));const response=await apiRequest<Record<string,unknown>>(endpoint);return{...response,data:backofficeAdapter.product(response.data)}} const product=mockProducts.find(item=>item.slug===slug&&item.active); if(!product) throw new NotFoundError('Producto',slug); return mockResponse(product) },
  async getById(id: string) {
    if (appConfig.dataSource === 'api') return apiRequest<Product>(`${requireEndpoint(apiEndpoints.products, 'productos')}/${id}`)
    const product = mockProducts.find(item => item.id === id)
    if (!product) throw new NotFoundError('Producto', id)
    return mockResponse(product)
  },
}
