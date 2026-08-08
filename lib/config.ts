export type DataSource = 'mock' | 'api'

const requestedSource = process.env.NEXT_PUBLIC_DATA_SOURCE

export const appConfig = {
  dataSource: (requestedSource === 'api' ? 'api' : 'mock') as DataSource,
  apiUrl: (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, ''),
  mockLatencyMs: 350,
  apiTimeoutMs: Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS??10000),
  apiRetries: Number(process.env.NEXT_PUBLIC_API_RETRIES??2),
  paymentProvider: process.env.NEXT_PUBLIC_PAYMENT_PROVIDER ?? '',
}

// Se completan cuando el backoffice exponga sus rutas reales. No se presuponen endpoints:
// sólo tienen valor por defecto los ya confirmados por Gestion-de-clientes.
export const apiEndpoints = {
  // Autenticación y perfil
  customerLogin: process.env.NEXT_PUBLIC_API_CUSTOMER_LOGIN_ENDPOINT ?? '/storefront/auth/login',
  customerRegister: process.env.NEXT_PUBLIC_API_CUSTOMER_REGISTER_ENDPOINT ?? '/storefront/auth/register',
  customerMe: process.env.NEXT_PUBLIC_API_CUSTOMER_ME_ENDPOINT ?? '/storefront/auth/me',
  passwordRecovery: process.env.NEXT_PUBLIC_API_PASSWORD_RECOVERY_ENDPOINT,
  passwordReset: process.env.NEXT_PUBLIC_API_PASSWORD_RESET_ENDPOINT,
  // Catálogo y menús
  products: process.env.NEXT_PUBLIC_API_PRODUCTS_ENDPOINT,
  categories: process.env.NEXT_PUBLIC_API_CATEGORIES_ENDPOINT,
  dailyMenu: process.env.NEXT_PUBLIC_API_DAILY_MENU_ENDPOINT,
  weeklyMenu: process.env.NEXT_PUBLIC_API_WEEKLY_MENU_ENDPOINT,
  promotions: process.env.NEXT_PUBLIC_API_PROMOTIONS_ENDPOINT,
  recommendations: process.env.NEXT_PUBLIC_API_RECOMMENDATIONS_ENDPOINT,
  // Datos del cliente
  addresses: process.env.NEXT_PUBLIC_API_ADDRESSES_ENDPOINT ?? '/storefront/me/addresses',
  favorites: process.env.NEXT_PUBLIC_API_FAVORITES_ENDPOINT,
  // Entrega
  shippingZones: process.env.NEXT_PUBLIC_API_SHIPPING_ZONES_ENDPOINT ?? process.env.NEXT_PUBLIC_API_SHIPPING_ENDPOINT,
  shippingQuote: process.env.NEXT_PUBLIC_API_SHIPPING_QUOTE_ENDPOINT,
  timeSlots: process.env.NEXT_PUBLIC_API_TIME_SLOTS_ENDPOINT,
  // Pedidos
  orders: process.env.NEXT_PUBLIC_API_ORDERS_ENDPOINT,
  myOrders: process.env.NEXT_PUBLIC_API_MY_ORDERS_ENDPOINT,
  // Pagos y cupones
  paymentMethods: process.env.NEXT_PUBLIC_API_PAYMENT_ENDPOINT,
  paymentCreate: process.env.NEXT_PUBLIC_API_PAYMENT_CREATE_ENDPOINT,
  paymentStatus: process.env.NEXT_PUBLIC_API_PAYMENT_STATUS_ENDPOINT,
  coupons: process.env.NEXT_PUBLIC_API_COUPONS_ENDPOINT,
  // Comercio
  storeConfig: process.env.NEXT_PUBLIC_API_STORE_CONFIG_ENDPOINT,
} as const

/**
 * Indica si una capacidad debe resolverse contra la API real.
 * Mientras el backoffice no publique la ruta, el servicio sigue respondiendo con mocks
 * en lugar de romper la pantalla. Ver docs/PROXIMOS-PASOS-INTEGRACION.md.
 */
export const useApiFor = (endpoint?: string): endpoint is string =>
  appConfig.dataSource === 'api' && Boolean(endpoint)

/** Arma un querystring descartando valores vacíos, nulos o indefinidos. */
export function buildQuery(params: Record<string, string | number | boolean | string[] | undefined | null>) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) value.forEach(item => search.append(`${key}[]`, String(item)))
    else search.append(key, String(value))
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}
