import { mockProducts } from '@/mocks/catalog'
import { apiRequest, requireEndpoint } from '@/lib/apiClient'
import { apiEndpoints, appConfig } from '@/lib/config'
import { mockResponse } from '@/lib/mockApi'
import { NotFoundError } from '@/types/api'
import { Product } from '@/types/domain'
import { backofficeAdapter } from '@/adapters/backofficeAdapter'

export const productService = {
 async getAll() {
  if(appConfig.dataSource==='mock')return mockResponse(mockProducts.filter(product=>product.active).sort((a,b)=>a.displayOrder-b.displayOrder))
  const response=await apiRequest<unknown>(requireEndpoint(apiEndpoints.products,'productos'))
  return{...response,data:backofficeAdapter.list(response.data,backofficeAdapter.product)}
 },
 async getFeatured() {
  if(appConfig.dataSource==='api'){const response=await this.getAll();return{...response,data:response.data.filter(product=>product.featured)}}
  return mockResponse(mockProducts.filter(product=>product.active&&product.featured).sort((a,b)=>a.displayOrder-b.displayOrder))
 },
 async getBySlug(slug:string) {
  if(appConfig.dataSource==='api'){const response=await this.getAll();const product=response.data.find(item=>item.slug===slug);if(!product)throw new NotFoundError('Producto',slug);return{...response,data:product}}
  const product=mockProducts.find(item=>item.slug===slug&&item.active)
  if(!product)throw new NotFoundError('Producto',slug)
  return mockResponse(product)
 },
 async getById(id:string) {
  if(appConfig.dataSource==='api'){const response=await this.getAll();const product=response.data.find(item=>item.id===id);if(!product)throw new NotFoundError('Producto',id);return{...response,data:product}}
  const product=mockProducts.find(item=>item.id===id)
  if(!product)throw new NotFoundError('Producto',id)
  return mockResponse(product)
 },
}
