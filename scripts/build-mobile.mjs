import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

// Configuración pública del cliente móvil. La app nunca conoce credenciales de
// Render, Neon, R2 ni Mercado Pago: sólo habla por HTTPS con la API pública.
const mobilePublicEnv = {
  VITALWEB_TARGET: 'mobile',
  NEXT_PUBLIC_APP_TARGET: 'mobile',
  NEXT_PUBLIC_DATA_SOURCE: 'api',
  NEXT_PUBLIC_API_URL: 'https://vitalfood-backend.onrender.com',
  NEXT_PUBLIC_API_CUSTOMER_LOGIN_ENDPOINT: '/storefront/auth/login',
  NEXT_PUBLIC_API_CUSTOMER_REGISTER_ENDPOINT: '/storefront/auth/register',
  NEXT_PUBLIC_API_CUSTOMER_CLAIM_INVITATION_ENDPOINT: '/storefront/auth/claim-invitation',
  NEXT_PUBLIC_API_CUSTOMER_ME_ENDPOINT: '/storefront/auth/me',
  NEXT_PUBLIC_API_PRODUCTS_ENDPOINT: '/storefront/products',
  NEXT_PUBLIC_API_CATEGORIES_ENDPOINT: '/storefront/categories',
  NEXT_PUBLIC_API_DAILY_MENU_ENDPOINT: '/storefront/menus/daily',
  NEXT_PUBLIC_API_WEEKLY_MENU_ENDPOINT: '/storefront/menus/weekly',
  NEXT_PUBLIC_API_ORDERS_ENDPOINT: '/storefront/orders',
  NEXT_PUBLIC_API_MY_ORDERS_ENDPOINT: '/storefront/me/orders',
  NEXT_PUBLIC_API_ADDRESSES_ENDPOINT: '/storefront/me/addresses',
  NEXT_PUBLIC_API_PAYMENT_ENDPOINT: '/storefront/payment-methods',
  NEXT_PUBLIC_API_PAYMENT_CREATE_ENDPOINT: '/storefront/payments',
  NEXT_PUBLIC_API_PAYMENT_STATUS_ENDPOINT: '/storefront/payments',
  NEXT_PUBLIC_IMAGE_HOSTS: [
    'pub-c30269c4a5be4d5ab539e30b367b28a9.r2.dev',
    'pub-3699625c408f439da84fc5553a80ad6c.r2.dev',
  ].join(','),
}

const projectRoot = fileURLToPath(new URL('..', import.meta.url))
const nextBin = fileURLToPath(new URL('../node_modules/next/dist/bin/next', import.meta.url))
const result = spawnSync(process.execPath, [nextBin, 'build'], {
  cwd: projectRoot,
  env: { ...process.env, ...mobilePublicEnv },
  stdio: 'inherit',
})

process.exit(result.status ?? 1)
