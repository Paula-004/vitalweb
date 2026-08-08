import { describe, expect, it } from 'vitest'
import { backofficeAdapter } from '@/adapters/backofficeAdapter'
import { buildQuery } from '@/lib/config'
import { cartService, weekDayOf } from '@/services/cartService'
import { Cart, Product } from '@/types/domain'

const product = (overrides: Partial<Product> = {}): Product => ({
  id: 'prod-1', categoryId: 'cat-1', name: 'Pollo', slug: 'pollo', shortDescription: '', description: '',
  price: 8500, currency: 'ARS', imageUrl: '', ingredients: [], dietaryTags: [],
  available: true, stock: 5, availableDays: [], orderDeadline: '10:30', active: true,
  featured: false, bestSeller: false, displayOrder: 1, createdAt: '2026-07-01T00:00:00Z',
  ...overrides,
})

const cart = (quantity = 1): Cart => ({ items: [{ productId: 'prod-1', quantity }], generalNotes: '' })

describe('adaptador del backoffice', () => {
  it('mapea una promo prepaga con período, cantidad y precio', () => {
    const mapped = backofficeAdapter.promotion({
      id: 7, name: 'Mensual 20', type: 'bundle', period: 'MONTH', mealCount: 20, price: 120000, active: true,
    })
    expect(mapped.period).toBe('MONTH')
    expect(mapped.mealCount).toBe(20)
    expect(mapped.price).toBe(120000)
  })

  it('conserva el descuento y el saldo de viandas devueltos por un pedido', () => {
    const mapped = backofficeAdapter.order({ id: 'WEB-1', status: 'confirmed', mealCreditsUsed: 10, mealBalanceRemaining: 10 })
    expect(mapped.mealCreditsUsed).toBe(10)
    expect(mapped.mealBalanceRemaining).toBe(10)
  })

  it('asume activo y disponible cuando el backoffice no envía esos campos', () => {
    const mapped = backofficeAdapter.product({ id: 'prod-1', name: 'Pollo', price: 8500 })
    expect(mapped.active).toBe(true)
    expect(mapped.available).toBe(true)
    expect(mapped.stock).toBeGreaterThan(0)
  })

  it('respeta los valores explícitos del backoffice', () => {
    const mapped = backofficeAdapter.product({ id: 'prod-1', active: false, available: false, stock: 0 })
    expect(mapped.active).toBe(false)
    expect(mapped.available).toBe(false)
    expect(mapped.stock).toBe(0)
  })

  it('acepta nombres alternativos en snake_case y español', () => {
    const mapped = backofficeAdapter.product({ product_id: 'prod-9', nombre: 'Tarta', precio: 7000, image_url: 'https://x/y.png' })
    expect(mapped.id).toBe('prod-9')
    expect(mapped.name).toBe('Tarta')
    expect(mapped.price).toBe(7000)
    expect(mapped.imageUrl).toBe('https://x/y.png')
  })

  it('descarta etiquetas y días que no pertenecen al dominio', () => {
    const mapped = backofficeAdapter.product({ id: 'p', dietaryTags: ['vegano', 'inventada'], availableDays: ['martes', 'lunesito'] })
    expect(mapped.dietaryTags).toEqual(['vegano'])
    expect(mapped.availableDays).toEqual(['martes'])
  })

  it('separa nombre y apellido cuando sólo llega fullName', () => {
    const user = backofficeAdapter.user({ id: 'u1', fullName: 'Marina Del Valle', email: 'm@v.demo' })
    expect(user.firstName).toBe('Marina')
    expect(user.lastName).toBe('Del Valle')
  })

  it('desenvuelve listas paginadas', () => {
    const items = backofficeAdapter.list({ items: [{ id: 'a' }, { id: 'b' }] }, backofficeAdapter.category)
    expect(items.map(item => item.id)).toEqual(['a', 'b'])
  })

  it('devuelve lista vacía ante una respuesta inesperada', () => {
    expect(backofficeAdapter.list(null, backofficeAdapter.product)).toEqual([])
  })
})

describe('querystring de filtros', () => {
  it('descarta valores vacíos', () => {
    expect(buildQuery({ category: '', search: undefined, page: 2 })).toBe('?page=2')
  })

  it('serializa arreglos con corchetes', () => {
    expect(buildQuery({ dietaryTags: ['vegano', 'sin-tacc'] })).toBe('?dietaryTags%5B%5D=vegano&dietaryTags%5B%5D=sin-tacc')
  })

  it('devuelve cadena vacía sin parámetros', () => {
    expect(buildQuery({})).toBe('')
  })
})

describe('validación del carrito', () => {
  it('acepta un producto sin restricción de días', () => {
    expect(cartService.validate(cart(), [product()], 0, { date: '2026-07-15' })).toEqual([])
  })

  it('rechaza el producto cuando la fecha cae en un día no disponible', () => {
    const issues = cartService.validate(cart(), [product({ availableDays: ['martes'] })], 0, { date: '2026-07-15' })
    expect(issues[0]).toContain('no está disponible')
  })

  it('acepta el producto en un día disponible', () => {
    // 2026-07-14 es martes.
    expect(cartService.validate(cart(), [product({ availableDays: ['martes'] })], 0, { date: '2026-07-14' })).toEqual([])
  })

  it('avisa cuando se pide más de lo que hay en stock', () => {
    const issues = cartService.validate(cart(9), [product({ stock: 2 })], 0, { date: '2026-07-14' })
    expect(issues[0]).toContain('Sólo quedan 2')
  })

  it('avisa cuando no se alcanza el monto mínimo', () => {
    const issues = cartService.validate(cart(), [product()], 20000, { date: '2026-07-14' })
    expect(issues.some(issue => issue.includes('monto mínimo'))).toBe(true)
  })

  it('avisa si el carrito está vacío', () => {
    expect(cartService.validate({ items: [] }, [], 0)).toContain('El carrito está vacío.')
  })

  it('calcula el día de la semana en español', () => {
    expect(weekDayOf('2026-07-14')).toBe('martes')
    expect(weekDayOf('2026-07-19')).toBe('domingo')
    expect(weekDayOf('no-es-fecha')).toBeUndefined()
  })
})
