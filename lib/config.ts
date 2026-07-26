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
  authLogin: process.env.NEXT_PUBLIC_API_AUTH_LOGIN_ENDPOINT,
  authRegister: process.env.NEXT_PUBLIC_API_AUTH_REGISTER_ENDPOINT,
  profile: process.env.NEXT_PUBLIC_API_PROFILE_ENDPOINT,
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
  customerLogin: process.env.NEXT_PUBLIC_API_CUSTOMER_LOGIN_ENDPOINT ?? '/storefront/auth/login',
  customerRegister: process.env.NEXT_PUBLIC_API_CUSTOMER_REGISTER_ENDPOINT ?? '/storefront/auth/register',
  customerMe: process.env.NEXT_PUBLIC_API_CUSTOMER_ME_ENDPOINT ?? '/storefront/auth/me',
} as const
