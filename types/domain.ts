export type EntityId = string

export interface Address {
  id: EntityId
  label: string
  recipientName: string
  street: string
  streetNumber: string
  floor?: string
  apartment?: string
  city: string
  postalCode: string
  province: string
  phone: string
  deliveryNotes?: string
  isDefault: boolean
  shippingZoneId?: EntityId
}

export interface User {
  id: EntityId
  firstName: string
  lastName: string
  username: string
  phone: string
  addresses: Address[]
  createdAt: string
}

export interface Category {
  id: EntityId
  name: string
  slug: string
  description?: string
  sortOrder: number
  active: boolean
}

export interface Product {
  id: EntityId
  categoryId: EntityId
  name: string
  slug: string
  shortDescription: string
  description: string
  price: number
  promotionalPrice?: number
  currency: 'ARS'
  badge?: string
  imageUrl: string
  gallery?: string[]
  visual?: { emoji: string; tone: string }
  ingredients: string[]
  nutritionalInformation?: NutritionalInformation
  dietaryTags: DietaryTag[]
  available: boolean
  stock: number
  availableDays: WeekDay[]
  availableDate?: string
  orderDeadline: string
  active: boolean
  featured: boolean
  bestSeller: boolean
  displayOrder: number
  createdAt: string
}

export type DietaryTag = 'vegetariano' | 'vegano' | 'sin-tacc' | 'sin-lactosa' | 'bajo-en-sodio' | 'picante'
export type WeekDay = 'lunes' | 'martes' | 'miércoles' | 'jueves' | 'viernes' | 'sábado' | 'domingo'
export interface NutritionalInformation { calories: number; protein: number; carbohydrates: number; fat: number; sodium?: number; servingSize: string }

export interface DailyMenuItem {
  productId: EntityId
  availableStock?: number
  featured?: boolean
}

export interface DailyMenu {
  id: EntityId
  date: string
  title: string
  orderDeadline: string
  deliveryTimeSlotId: EntityId
  items: DailyMenuItem[]
  active: boolean
}

export interface WeeklyMenu {
  id: EntityId
  weekStartsAt: string
  weekEndsAt: string
  dailyMenuIds: EntityId[]
  published: boolean
}

export interface Promotion {
  id: EntityId
  name: string
  description: string
  type: 'percentage' | 'fixed' | 'bundle'
  value: number
  productIds: EntityId[]
  startsAt: string
  endsAt: string
  active: boolean
  /** Campos de los paquetes prepagos administrados desde Gestion-de-clientes. */
  period?: 'DAY' | 'WEEK' | 'MONTH'
  mealCount?: number
  price?: number
}

export interface MealBalance {
  id: number
  planId: number
  planName: string
  period: 'DAY' | 'WEEK' | 'MONTH'
  totalMeals: number
  remainingMeals: number
  usedMeals: number
  startsAt: string
  endsAt: string
}

export interface MealBalanceSummary {
  totalRemaining: number
  balances: MealBalance[]
}

export interface OrderDetail {
  id: EntityId
  productId: EntityId
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready_for_pickup' | 'on_the_way' | 'delivered' | 'cancelled'

export interface Order {
  id: EntityId
  userId?: EntityId
  status: OrderStatus
  details: OrderDetail[]
  subtotal: number
  shippingCost: number
  discount: number
  total: number
  currency: 'ARS'
  paymentMethodId: EntityId
  shippingAddress?: Address
  pickup: boolean
  timeSlotId: EntityId
  couponCode?: string
  notes?: string
  mealCreditsUsed?: number
  mealBalanceRemaining?: number
  createdAt: string
}

export interface CreateOrderInput {
  userId?: EntityId
  items: Array<{ productId: EntityId; quantity: number; notes?: string }>
  paymentMethodId: EntityId
  timeSlotId: EntityId
  shippingAddress?: Address
  pickup: boolean
  /** Fecha de entrega o retiro en formato `YYYY-MM-DD`. */
  deliveryDate?: string
  /** Datos de contacto cuando el pedido se hace sin cuenta. */
  contact?: { firstName: string; lastName: string; phone: string }
  couponCode?: string
  notes?: string
  shippingCost?: number
}

export interface OrderQuery {
  status?: OrderStatus
  from?: string
  to?: string
  page?: number
  limit?: number
}

/** Resultado de repetir un pedido: el backoffice recotiza y puede descartar productos. */
export interface RepeatOrderResult {
  items: Array<{ productId: EntityId; quantity: number }>
  unavailable: Array<{ productId: EntityId; productName: string; reason: string }>
  priceChanges: Array<{ productId: EntityId; productName: string; previousPrice: number; currentPrice: number }>
}

export interface CartItem { productId: EntityId; quantity: number; notes?: string }
export interface Cart { items: CartItem[]; generalNotes?: string; couponCode?: string }

export interface PaymentMethod {
  id: EntityId
  name: string
  type: 'cash' | 'transfer' | 'card' | 'wallet'
  description?: string
  active: boolean
}

export interface ShippingZone {
  id: EntityId
  name: string
  postalCodes: string[]
  price: number
  freeShippingFrom?: number
  active: boolean
}

export interface TimeSlot {
  id: EntityId
  label: string
  startsAt: string
  endsAt: string
  capacity?: number
  active: boolean
}

export interface ShippingQuoteInput {
  postalCode: string
  date: string
  items: Array<{ productId: EntityId; quantity: number }>
  zoneId?: EntityId
  addressId?: EntityId
  couponCode?: string
  pickup?: boolean
}

export interface ShippingQuote {
  available: boolean
  zoneId?: EntityId
  cost: number
  freeShipping: boolean
  timeSlots: TimeSlot[]
  message?: string
}

export interface Coupon {
  id: EntityId
  code: string
  type: 'percentage' | 'fixed' | 'free_shipping'
  value: number
  minimumOrder?: number
  startsAt: string
  endsAt: string
  maxUses?: number
  usedCount?: number
  allowedCategoryIds?: EntityId[]
  allowedProductIds?: EntityId[]
  usedByUserIds?: EntityId[]
  active: boolean
}

export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
export interface PaymentTransaction {
  id: EntityId
  orderId: EntityId
  methodId: EntityId
  amount: number
  currency: 'ARS'
  status: PaymentStatus
  /** Devuelto por el proveedor cuando el pago se completa fuera del sitio. */
  redirectUrl?: string
  createdAt: string
  /** `true` mientras el pago sea una demostración local sin cobro real. */
  isSimulation: boolean
}

export interface StoreConfig {
  id: EntityId
  name: string
  tagline: string
  currency: 'ARS'
  locale: string
  timezone: string
  orderDeadline: string
  phone: string
  pickupEnabled: boolean
  deliveryEnabled: boolean
  minimumOrder: number
  address: string
  businessHours: string
  socialLinks: Array<{ network:'instagram'|'facebook'|'whatsapp'; label:string; url:string }>
  banners: StoreBanner[]
}
export interface StoreBanner { id:EntityId; eyebrow?:string; title:string; description?:string; imageUrl?:string; actionLabel?:string; actionUrl?:string; active:boolean; placement:'home'|'catalog'|'checkout' }
