import { apiRequest } from '@/lib/apiClient'
import { apiEndpoints, buildQuery, useApiFor } from '@/lib/config'
import { mockResponse } from '@/lib/mockApi'
import { backofficeAdapter } from '@/adapters/backofficeAdapter'
import { Product } from '@/types/domain'
import { categoryService } from './categoryService'
import { productService } from './productService'

export type RecommendationContext = 'featured' | 'best-sellers' | 'promotions' | 'related' | 'sides' | 'bought-together'

const LIMIT = 4
/** Categorías que se ofrecen como complemento del plato principal. */
const SIDE_CATEGORY_PATTERN = /acompan|guarnicion|bebida|postre/i

/** Cuando el backoffice no expone recomendaciones, se derivan del catálogo vigente. */
async function fromCatalog(context: RecommendationContext, productId?: string): Promise<Product[]> {
  const catalog = (await productService.getAll()).data
  switch (context) {
    case 'featured':
      return catalog.filter(item => item.featured).slice(0, LIMIT)
    case 'best-sellers':
      return catalog.filter(item => item.bestSeller).slice(0, LIMIT)
    case 'promotions':
      return catalog.filter(item => item.promotionalPrice !== undefined).slice(0, LIMIT)
    case 'related': {
      const current = catalog.find(item => item.id === productId)
      return catalog
        .filter(item => item.id !== productId && (item.categoryId === current?.categoryId || item.featured))
        .slice(0, LIMIT)
    }
    case 'sides': {
      const categories = (await categoryService.getAll()).data
      const sideIds = new Set(categories.filter(category => SIDE_CATEGORY_PATTERN.test(`${category.slug} ${category.name}`)).map(category => category.id))
      const sides = catalog.filter(item => sideIds.has(item.categoryId))
      // Si el backoffice todavía no separa acompañamientos, se ofrece lo más barato del menú.
      return (sides.length ? sides : [...catalog].sort((a, b) => (a.promotionalPrice ?? a.price) - (b.promotionalPrice ?? b.price))).slice(0, LIMIT)
    }
    case 'bought-together': {
      const current = catalog.find(item => item.id === productId)
      return catalog
        .filter(item => item.id !== productId && item.categoryId !== current?.categoryId)
        .sort((a, b) => Number(b.bestSeller) - Number(a.bestSeller) || a.displayOrder - b.displayOrder)
        .slice(0, LIMIT)
    }
  }
}

async function load(context: RecommendationContext, productId?: string) {
  if (useApiFor(apiEndpoints.recommendations)) {
    const response = await apiRequest<unknown>(`${apiEndpoints.recommendations}${buildQuery({ context, productId, limit: LIMIT })}`)
    const products = backofficeAdapter.list(response.data, backofficeAdapter.product)
    if (products.length) return { ...response, data: products }
  }
  return mockResponse(await fromCatalog(context, productId))
}

export const recommendationService = {
  getFeatured: () => load('featured'),
  getBestSellers: () => load('best-sellers'),
  getPromotions: () => load('promotions'),
  getForProduct: (productId: string) => load('related', productId),
  getSides: () => load('sides'),
  getFrequentlyBoughtTogether: (productId: string) => load('bought-together', productId),
}
