import { describe, expect, it } from 'vitest'
import { buildPermanentCatalog } from '@/components/MenuOptions'
import { Category, Product } from '@/types/domain'

const product = (id: string, overrides: Partial<Product> = {}): Product => ({
  id,
  categoryId: 'otros-productos',
  name: 'Chipa x6',
  slug: id,
  shortDescription: '',
  description: '',
  price: 8500,
  currency: 'ARS',
  imageUrl: '',
  ingredients: [],
  dietaryTags: [],
  available: true,
  stock: 5,
  availableDays: [],
  orderDeadline: '10:30',
  active: true,
  featured: false,
  bestSeller: false,
  displayOrder: 1,
  createdAt: '2026-09-01T00:00:00Z',
  ...overrides,
})

const category = (id: string, name: string): Category => ({
  id,
  name,
  slug: id,
  sortOrder: 1,
  active: true,
})

const categories = new Map([
  ['otros-productos', category('otros-productos', 'Otros productos')],
  ['menus', category('menus', 'Viandas y menús')],
])

describe('catálogo permanente del menú', () => {
  it('mantiene productos no-vianda aunque pertenezcan a otro día', () => {
    const result = buildPermanentCatalog([
      product('ayer', { availableDate: '2026-09-15', available: false }),
    ], categories, '2026-09-16')

    expect(result.map(item => item.id)).toEqual(['ayer'])
  })

  it('deduplica las copias diarias y elige la próxima disponible', () => {
    const result = buildPermanentCatalog([
      product('ayer', { availableDate: '2026-09-15', available: false }),
      product('hoy', { availableDate: '2026-09-16' }),
      product('manana', { availableDate: '2026-09-17' }),
    ], categories, '2026-09-16')

    expect(result.map(item => item.id)).toEqual(['hoy'])
  })

  it('deja las viandas fuera del catálogo permanente', () => {
    const result = buildPermanentCatalog([
      product('general', { categoryId: 'menus', name: 'Menú general' }),
      product('chipa'),
    ], categories, '2026-09-16')

    expect(result.map(item => item.id)).toEqual(['chipa'])
  })
})
