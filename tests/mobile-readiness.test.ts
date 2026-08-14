import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '..')
const read = (path: string) => readFileSync(resolve(root, path), 'utf8')

describe('preparacion movil de VitalWeb', () => {
  it('incluye proyectos nativos con la identidad de Vital Food', () => {
    expect(existsSync(resolve(root, 'android/app/build.gradle'))).toBe(true)
    expect(existsSync(resolve(root, 'ios/App/App.xcodeproj'))).toBe(true)
    expect(read('capacitor.config.ts')).toContain("appId: 'com.vitalfood.viandas'")
    expect(read('android/app/build.gradle')).toContain('applicationId "com.vitalfood.viandas"')
  })

  it.each([
    'login', 'registro', 'catalogo', 'menu-hoy', 'menu-semanal', 'carrito',
    'checkout', 'pedido-confirmado', 'mi-cuenta',
  ])('exporta la ruta /%s', route => {
    expect(existsSync(resolve(root, 'app', route, 'page.tsx'))).toBe(true)
  })

  it('mantiene Mercado Pago desactivado en el build movil', () => {
    const build = read('scripts/build-mobile.mjs')
    expect(build).toContain("NEXT_PUBLIC_API_PAYMENT_CREATE_ENDPOINT: ''")
    expect(build).toContain("NEXT_PUBLIC_API_PAYMENT_STATUS_ENDPOINT: ''")
  })
})
