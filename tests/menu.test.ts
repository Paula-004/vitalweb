import { describe, expect, it } from 'vitest'
import { buildWeeks, fillCalendarWeeks } from '@/hooks/useMonthlyMenu'
import { menuService } from '@/services'
import { NotFoundError } from '@/types/api'
import { DailyMenu, Product } from '@/types/domain'

const product = (id: string, overrides: Partial<Product> = {}): Product => ({
  id, categoryId: 'cat-1', name: id, slug: id, shortDescription: '', description: '',
  price: 8500, currency: 'ARS', imageUrl: '', ingredients: [], dietaryTags: [],
  available: true, stock: 5, availableDays: [], orderDeadline: '10:30', active: true,
  featured: false, bestSeller: false, displayOrder: 1, createdAt: '2026-07-01T00:00:00Z',
  ...overrides,
})

const menu = (date: string, productIds: string[], active = true): DailyMenu => ({
  id: `daily-${date}`, date, title: date, orderDeadline: '10:30',
  deliveryTimeSlotId: 'slot-1', active, items: productIds.map(productId => ({ productId })),
})

describe('menú vacío', () => {
  it('devuelve cero semanas cuando no hay menús publicados', () => {
    expect(buildWeeks([], [product('prod-1')])).toEqual([])
  })

  it('descarta los menús inactivos', () => {
    const weeks = buildWeeks([menu('2026-07-14', ['prod-1'], false)], [product('prod-1')])
    expect(weeks).toEqual([])
  })

  it('arma el día sin platos si el producto ya no está en el catálogo', () => {
    const weeks = buildWeeks([menu('2026-07-14', ['prod-borrado'])], [product('prod-1')])
    expect(weeks).toHaveLength(1)
    expect(weeks[0].days[0].products).toEqual([])
  })

  it('omite los productos dados de baja', () => {
    const weeks = buildWeeks(
      [menu('2026-07-14', ['prod-1', 'prod-2'])],
      [product('prod-1'), product('prod-2', { active: false })],
    )
    expect(weeks[0].days[0].products.map(item => item.id)).toEqual(['prod-1'])
  })

  it('avisa cuando no hay menú diario para la fecha pedida', async () => {
    await expect(menuService.getDailyMenu('1999-01-01')).rejects.toBeInstanceOf(NotFoundError)
  })
})

describe('armado del calendario', () => {
  it('agrupa los días por semana empezando el lunes', () => {
    // 2026-07-14 es martes y 2026-07-20 es el lunes siguiente: son semanas distintas.
    const weeks = buildWeeks(
      [menu('2026-07-14', ['prod-1']), menu('2026-07-15', ['prod-1']), menu('2026-07-20', ['prod-1'])],
      [product('prod-1')],
    )
    expect(weeks).toHaveLength(2)
    expect(weeks[0].start).toBe('2026-07-13')
    expect(weeks[0].days.map(day => day.date)).toEqual(['2026-07-14', '2026-07-15'])
    expect(weeks[1].start).toBe('2026-07-20')
  })

  it('ordena las semanas aunque los menús lleguen desordenados', () => {
    const weeks = buildWeeks(
      [menu('2026-07-20', ['prod-1']), menu('2026-07-14', ['prod-1'])],
      [product('prod-1')],
    )
    expect(weeks.map(week => week.start)).toEqual(['2026-07-13', '2026-07-20'])
  })

  it('etiqueta el día con su nombre en español', () => {
    const weeks = buildWeeks([menu('2026-07-14', ['prod-1'])], [product('prod-1')])
    expect(weeks[0].days[0].label).toMatch(/^Martes 14$/)
  })

  it('completa semanas consecutivas y conserva los platos publicados', () => {
    const published = buildWeeks([menu('2026-08-17', ['prod-1'])], [product('prod-1')])
    const weeks = fillCalendarWeeks(published, '2026-07-28')

    expect(weeks.map(week => week.start)).toEqual([
      '2026-07-27',
      '2026-08-03',
      '2026-08-10',
      '2026-08-17',
      '2026-08-24',
    ])
    expect(weeks[3].label).toBe('17 al 23 de agosto')
    expect(weeks[3].days[0].products.map(item => item.id)).toEqual(['prod-1'])
  })
})
