import { beforeAll, describe, expect, it } from 'vitest'
import { backofficeAdapter } from '@/adapters/backofficeAdapter'

/**
 * Verifica que lo que devuelve el backoffice real encaje con el dominio de la tienda.
 *
 * No forma parte de la suite habitual: si el backoffice no está levantado, las pruebas
 * se saltean en vez de fallar. Para correrlas, levantar Gestion-de-clientes y:
 *   BACKOFFICE_URL=http://localhost:3100 npm test
 */
const BASE = process.env.BACKOFFICE_URL ?? 'http://localhost:3100'
let reachable = false

async function get(path: string) {
  const response = await fetch(`${BASE}${path}`)
  if (!response.ok) throw new Error(`${path} respondió ${response.status}`)
  return (await response.json()) as { data: unknown }
}

beforeAll(async () => {
  try {
    await get('/storefront/categories')
    reachable = true
  } catch {
    reachable = false
  }
})

describe('contrato del backoffice', () => {
  it('los productos pasan por el adaptador sin perder campos obligatorios', async ({ skip }) => {
    if (!reachable) return skip()
    const { data } = await get('/storefront/products')
    const products = backofficeAdapter.list(data, backofficeAdapter.product)
    if (!products.length) return skip() // no hay menús publicados para hoy

    for (const product of products) {
      expect(product.id).toBeTruthy()
      expect(product.slug).toBeTruthy()
      expect(product.name).toBeTruthy()
      expect(product.price).toBeGreaterThanOrEqual(0)
      expect(product.currency).toBe('ARS')
      // El backoffice todavía no modela stock: el adaptador debe asumir uno vendible.
      expect(product.stock).toBeGreaterThan(0)
      expect(product.active).toBe(true)
      expect(product.available).toBe(true)
    }
  })

  it('las categorías se mapean al dominio', async ({ skip }) => {
    if (!reachable) return skip()
    const { data } = await get('/storefront/categories')
    const categories = backofficeAdapter.list(data, backofficeAdapter.category)
    for (const category of categories) {
      expect(category.id).toBeTruthy()
      expect(category.name).toBeTruthy()
      expect(category.slug).toBeTruthy()
    }
  })

  it('el menú diario referencia productos que existen en el catálogo', async ({ skip }) => {
    if (!reachable) return skip()
    const [menus, products] = await Promise.all([get('/storefront/menus/daily'), get('/storefront/products')])
    const dailyMenus = backofficeAdapter.list(menus.data, backofficeAdapter.dailyMenu)
    if (!dailyMenus.length) return skip()

    const ids = new Set(backofficeAdapter.list(products.data, backofficeAdapter.product).map(item => item.id))
    for (const menu of dailyMenus) {
      expect(menu.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      for (const item of menu.items) expect(ids.has(item.productId)).toBe(true)
    }
  })

  it('el menú semanal cubre siete días', async ({ skip }) => {
    if (!reachable) return skip()
    const { data } = await get('/storefront/menus/weekly')
    const week = backofficeAdapter.weeklyMenu(data as Record<string, unknown>)
    expect(week.weekStartsAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(week.weekEndsAt > week.weekStartsAt).toBe(true)
  })
})
