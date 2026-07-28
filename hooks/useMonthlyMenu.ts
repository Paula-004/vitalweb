'use client'
import { useCallback } from 'react'
import { menuService, productService } from '@/services'
import { ApiResponse } from '@/types/api'
import { DailyMenu, Product } from '@/types/domain'
import { useAsyncData } from './useAsyncData'

export interface MenuDay {
  date: string
  /** Etiqueta corta para la pestaña del día, ej. `Martes 14`. */
  label: string
  menu?: DailyMenu
  products: Product[]
}
export interface MenuWeek {
  start: string
  end: string
  /** Etiqueta del rango, ej. `13 al 19 de julio`. */
  label: string
  days: MenuDay[]
}

const toUtcDate = (date: string) => {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}
const toIso = (date: Date) => date.toISOString().slice(0, 10)
const format = (date: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('es-AR', { ...options, timeZone: 'UTC' }).format(toUtcDate(date))

/** Lunes de la semana a la que pertenece una fecha comercial. */
function startOfWeek(date: string) {
  const value = toUtcDate(date)
  const weekDay = value.getUTCDay()
  value.setUTCDate(value.getUTCDate() - (weekDay === 0 ? 6 : weekDay - 1))
  return toIso(value)
}

function weekLabel(start: string, end: string) {
  const sameMonth = start.slice(0, 7) === end.slice(0, 7)
  const from = sameMonth ? format(start, { day: 'numeric' }) : format(start, { day: 'numeric', month: 'long' })
  return `${from} al ${format(end, { day: 'numeric', month: 'long' })}`
}

/**
 * Arma el calendario del menú a partir de los menús diarios publicados: las semanas y
 * los días existen sólo si el backoffice los publicó. No se inventan fechas ni platos.
 */
export function buildWeeks(menus: DailyMenu[], products: Product[]): MenuWeek[] {
  const byWeek = new Map<string, MenuDay[]>()
  for (const menu of menus.filter(item => item.active && item.date).sort((a, b) => a.date.localeCompare(b.date))) {
    const day: MenuDay = {
      date: menu.date,
      label: format(menu.date, { weekday: 'long', day: 'numeric' }).replace(/^\w/, letter => letter.toUpperCase()),
      menu,
      products: menu.items
        .map(item => products.find(product => product.id === item.productId))
        .filter((product): product is Product => Boolean(product) && product!.active),
    }
    const key = startOfWeek(menu.date)
    byWeek.set(key, [...(byWeek.get(key) ?? []), day])
  }
  return Array.from(byWeek.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([start, days]) => {
      const end = addDays(start, 6)
      return { start, end, label: weekLabel(start, end), days }
    })
}

/**
 * Completa el horizonte comercial con semanas calendario consecutivas.
 * Así la navegación avanza siempre de a siete días, incluso si una semana
 * todavía no tiene platos publicados.
 */
export function fillCalendarWeeks(
  publishedWeeks: MenuWeek[],
  referenceDate: string,
  count = 5,
): MenuWeek[] {
  const publishedByStart = new Map(publishedWeeks.map(week => [week.start, week]))
  const firstMonday = startOfWeek(referenceDate)
  return Array.from({ length: count }, (_, weekIndex) => {
    const start = addDays(firstMonday, weekIndex * 7)
    const end = addDays(start, 6)
    const publishedDays = new Map(
      (publishedByStart.get(start)?.days ?? []).map(day => [day.date, day]),
    )
    const days = Array.from({ length: 5 }, (_, dayIndex) => {
      const date = addDays(start, dayIndex)
      return publishedDays.get(date) ?? {
        date,
        label: format(date, { weekday: 'long', day: 'numeric' })
          .replace(/^\w/, letter => letter.toUpperCase()),
        products: [],
      }
    })
    return { start, end, label: weekLabel(start, end), days }
  })
}

function addDays(date: string, amount: number) {
  const value = toUtcDate(date)
  value.setUTCDate(value.getUTCDate() + amount)
  return toIso(value)
}

function currentDayKey() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).formatToParts(new Date())
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(part => part.type === type)?.value ?? ''
  return `${value('year')}-${value('month')}-${value('day')}`
}

export function useMonthlyMenu() {
  const loader = useCallback(async (): Promise<ApiResponse<MenuWeek[]>> => {
    const [products, menus] = await Promise.all([productService.getAll(), menuService.getDailyMenus()])
    const publishedWeeks = buildWeeks(menus.data, products.data)
    return { data: fillCalendarWeeks(publishedWeeks, currentDayKey()), meta: products.meta }
  }, [])
  return useAsyncData(loader, [loader])
}
