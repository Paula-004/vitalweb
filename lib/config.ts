export type DataSource = 'mock' | 'api'

const requestedSource = process.env.NEXT_PUBLIC_DATA_SOURCE

export const appConfig = {
  dataSource: (requestedSource === 'api' ? 'api' : 'mock') as DataSource,
  apiUrl: (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, ''),
  mockLatencyMs: 350,
  apiTimeoutMs: Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS??10000),
  apiRetries: Number(process.env.NEXT_PUBLIC_API_RETRIES??2),
}

// Se completan cuando el backoffice exponga sus rutas reales. No se presuponen endpoints.
export const apiEndpoints = {
  products: process.env.NEXT_PUBLIC_API_PRODUCTS_ENDPOINT,
  categories: process.env.NEXT_PUBLIC_API_CATEGORIES_ENDPOINT,
  dailyMenu: process.env.NEXT_PUBLIC_API_DAILY_MENU_ENDPOINT,
  weeklyMenu: process.env.NEXT_PUBLIC_API_WEEKLY_MENU_ENDPOINT,
  orders: process.env.NEXT_PUBLIC_API_ORDERS_ENDPOINT,
  users: process.env.NEXT_PUBLIC_API_USERS_ENDPOINT,
  shippingZones: process.env.NEXT_PUBLIC_API_SHIPPING_ENDPOINT,
  paymentMethods: process.env.NEXT_PUBLIC_API_PAYMENT_ENDPOINT,
  storeConfig: process.env.NEXT_PUBLIC_API_STORE_CONFIG_ENDPOINT,
  promotions: process.env.NEXT_PUBLIC_API_PROMOTIONS_ENDPOINT,
} as const
