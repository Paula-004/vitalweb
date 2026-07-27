import { mockProducts } from '@/mocks/catalog'
import { apiRequest } from '@/lib/apiClient'
import { apiEndpoints, buildQuery, useApiFor } from '@/lib/config'
import { mockResponse } from '@/lib/mockApi'
import { DataSourceError, NotFoundError } from '@/types/api'
import { DietaryTag, Product } from '@/types/domain'
import { backofficeAdapter } from '@/adapters/backofficeAdapter'

export interface ProductQuery {
  category?: string
  search?: string
  available?: boolean
  date?: string
  dietaryTags?: DietaryTag[]
  promotion?: boolean
  featured?: boolean
  sort?: 'destacados' | 'recientes' | 'precio-asc' | 'precio-desc' | 'nombre'
  page?: number
  limit?: number
}

const byDisplayOrder = (a: Product, b: Product) => a.displayOrder - b.displayOrder

/**
 * Filtra en memoria. En modo API los mismos criterios viajan como querystring;
 * esto es la red de seguridad para backoffices que todavía los ignoran.
 */
function applyQuery(products: Product[], query: ProductQuery) {
  const search = query.search?.trim().toLowerCase()
  let result = products.filter(product => product.active)
  if (query.category) result = result.filter(product => product.categoryId === query.category)
  if (search) result = result.filter(product => `${product.name} ${product.shortDescription} ${product.ingredients.join(' ')}`.toLowerCase().includes(search))
  if (query.available !== undefined) result = result.filter(product => product.available === query.available)
  if (query.featured !== undefined) result = result.filter(product => product.featured === query.featured)
  if (query.promotion) result = result.filter(product => product.promotionalPrice !== undefined)
  if (query.dietaryTags?.length) result = result.filter(product => query.dietaryTags!.every(tag => product.dietaryTags.includes(tag)))
  if (query.date) result = result.filter(product => !product.availableDate || product.availableDate === query.date)

  switch (query.sort) {
    case 'recientes': result = [...result].sort((a, b) => b.createdAt.localeCompare(a.createdAt)); break
    case 'precio-asc': result = [...result].sort((a, b) => (a.promotionalPrice ?? a.price) - (b.promotionalPrice ?? b.price)); break
    case 'precio-desc': result = [...result].sort((a, b) => (b.promotionalPrice ?? b.price) - (a.promotionalPrice ?? a.price)); break
    case 'nombre': result = [...result].sort((a, b) => a.name.localeCompare(b.name, 'es')); break
    case 'destacados': result = [...result].sort((a, b) => Number(b.featured) - Number(a.featured) || byDisplayOrder(a, b)); break
    default: result = [...result].sort(byDisplayOrder)
  }

  if (query.limit) {
    const page = query.page ?? 1
    result = result.slice((page - 1) * query.limit, page * query.limit)
  }
  return result
}

export const productService = {
  async getAll(query: ProductQuery = {}) {
    if (!useApiFor(apiEndpoints.products)) return mockResponse(applyQuery(mockProducts, query))
    const search = buildQuery({
      category: query.category, search: query.search, available: query.available, date: query.date,
      dietaryTags: query.dietaryTags, promotion: query.promotion, featured: query.featured,
      sort: query.sort, page: query.page, limit: query.limit,
    })
    const response = await apiRequest<unknown>(`${apiEndpoints.products}${search}`)
    const products = backofficeAdapter.list(response.data, backofficeAdapter.product)
    return { ...response, data: applyQuery(products, query) }
  },

  async getFeatured() {
    return this.getAll({ featured: true, sort: 'destacados' })
  },

  async getBySlug(slug: string) {
    if (!useApiFor(apiEndpoints.products)) {
      const product = mockProducts.find(item => item.slug === slug && item.active)
      if (!product) throw new NotFoundError('Producto', slug)
      return mockResponse(product)
    }
    try {
      const response = await apiRequest<Record<string, unknown>>(`${apiEndpoints.products}/${encodeURIComponent(slug)}`)
      return { ...response, data: backofficeAdapter.product(response.data) }
    } catch (error) {
      // Un 404 acá no prueba que el producto no exista: puede ser que el backoffice sólo
      // exponga el listado. Recién si tampoco está en el catálogo se lo da por inexistente.
      if (error instanceof DataSourceError && error.status !== undefined && error.status >= 500) throw error
      const response = await this.getAll()
      const product = response.data.find(item => item.slug === slug)
      if (!product) throw new NotFoundError('Producto', slug)
      return { ...response, data: product }
    }
  },

  async getById(id: string) {
    if (!useApiFor(apiEndpoints.products)) {
      const product = mockProducts.find(item => item.id === id)
      if (!product) throw new NotFoundError('Producto', id)
      return mockResponse(product)
    }
    const response = await this.getAll()
    const product = response.data.find(item => item.id === id)
    if (!product) throw new NotFoundError('Producto', id)
    return { ...response, data: product }
  },
}
