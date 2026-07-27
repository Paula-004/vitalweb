import {
  Address, Category, Coupon, DailyMenu, DailyMenuItem, DietaryTag, Order, OrderDetail, OrderStatus,
  PaymentMethod, PaymentStatus, PaymentTransaction, Product, Promotion, ShippingZone, StoreConfig,
  TimeSlot, User, WeekDay, WeeklyMenu,
} from '@/types/domain'

type Source=Record<string,unknown>
const value=(source:Source,...keys:string[])=>keys.map(key=>source[key]).find(item=>item!==undefined&&item!==null)
const text=(source:Source,...keys:string[])=>String(value(source,...keys)??'')
const number=(source:Source,...keys:string[])=>Number(value(source,...keys)??0)
const list=<T>(source:Source,...keys:string[])=>{const found=value(source,...keys);return (Array.isArray(found)?found:[]) as T[]}
const optionalText=(source:Source,...keys:string[])=>text(source,...keys)||undefined
const optionalNumber=(source:Source,...keys:string[])=>value(source,...keys)===undefined?undefined:number(source,...keys)
/** Booleano tolerante: si el backoffice todavía no expone el campo, se usa `fallback`. */
const flag=(source:Source,fallback:boolean,...keys:string[])=>{const found=value(source,...keys);if(found===undefined)return fallback;if(typeof found==='string')return !['false','0','no',''].includes(found.toLowerCase());return Boolean(found)}
const oneOf=<T extends string>(raw:unknown,allowed:readonly T[],fallback:T):T=>allowed.includes(raw as T)?raw as T:fallback
const filterEnum=<T extends string>(raw:unknown[],allowed:readonly T[]):T[]=>raw.map(item=>String(item).toLowerCase()).filter((item):item is T=>allowed.includes(item as T))

const DIETARY_TAGS=['vegetariano','vegano','sin-tacc','sin-lactosa','bajo-en-sodio','picante'] as const satisfies readonly DietaryTag[]
const WEEK_DAYS=['lunes','martes','miércoles','jueves','viernes','sábado','domingo'] as const satisfies readonly WeekDay[]
const ORDER_STATUSES=['pending','confirmed','preparing','ready_for_pickup','on_the_way','delivered','cancelled'] as const satisfies readonly OrderStatus[]
const PAYMENT_STATUSES=['pending','approved','rejected','cancelled'] as const satisfies readonly PaymentStatus[]
const PAYMENT_TYPES=['cash','transfer','card','wallet'] as const satisfies readonly PaymentMethod['type'][]
const PROMOTION_TYPES=['percentage','fixed','bundle'] as const satisfies readonly Promotion['type'][]
const COUPON_TYPES=['percentage','fixed','free_shipping'] as const satisfies readonly Coupon['type'][]

/**
 * Stock asumido cuando el backoffice todavía no publica el campo.
 * Devolver 0 dejaría todo el catálogo como agotado; ver docs/PROXIMOS-PASOS-INTEGRACION.md
 * (Prioridad 1). Cuando el backoffice exponga stock real, este valor deja de usarse.
 */
const ASSUMED_STOCK=99

// Este archivo es el único lugar que debe conocer nombres alternativos del backoffice.
// Ajustar los aliases cuando se reciba su contrato definitivo.
export const backofficeAdapter={
 product(source:Source):Product{return{
  id:text(source,'id','product_id','productId'),
  slug:text(source,'slug')||text(source,'id','product_id'),
  name:text(source,'name','nombre'),
  shortDescription:text(source,'shortDescription','short_description','descripcion_corta'),
  description:text(source,'description','descripcion'),
  imageUrl:text(source,'imageUrl','image_url','imagen_principal'),
  gallery:list<string>(source,'gallery','galeria'),
  price:number(source,'price','precio'),
  promotionalPrice:optionalNumber(source,'promotionalPrice','promotional_price','precio_promocional'),
  currency:'ARS',
  categoryId:text(source,'categoryId','category_id','categoria_id'),
  ingredients:list<string>(source,'ingredients','ingredientes').map(String),
  dietaryTags:filterEnum(list(source,'dietaryTags','dietary_tags','etiquetas'),DIETARY_TAGS),
  available:flag(source,true,'available','disponible'),
  stock:value(source,'stock','stock_disponible')===undefined?ASSUMED_STOCK:number(source,'stock','stock_disponible'),
  availableDays:filterEnum(list(source,'availableDays','available_days','dias_disponibles'),WEEK_DAYS),
  availableDate:optionalText(source,'availableDate','available_date','fecha_disponibilidad'),
  orderDeadline:text(source,'orderDeadline','order_deadline','horario_limite'),
  active:flag(source,true,'active','activo','published','publicado'),
  featured:flag(source,false,'featured','destacado'),
  bestSeller:flag(source,false,'bestSeller','best_seller','mas_vendido'),
  displayOrder:number(source,'displayOrder','display_order','orden'),
  createdAt:text(source,'createdAt','created_at')||new Date().toISOString(),
  badge:optionalText(source,'badge'),
 }},
 category(source:Source):Category{return{id:text(source,'id','category_id'),name:text(source,'name','nombre'),slug:text(source,'slug')||text(source,'id'),description:optionalText(source,'description','descripcion'),sortOrder:number(source,'sortOrder','sort_order','orden'),active:flag(source,true,'active','activo')}},
 user(source:Source):User{
  const fullName=text(source,'fullName','full_name','nombre_completo')
  const [firstFromFull='',...restFromFull]=fullName.split(' ').filter(Boolean)
  return{
   id:text(source,'id','user_id','client_id'),
   firstName:text(source,'firstName','first_name','nombre')||firstFromFull||'',
   lastName:text(source,'lastName','last_name','apellido')||restFromFull.join(' '),
   email:text(source,'email','correo'),
   phone:text(source,'phone','telefono'),
   addresses:list<Source>(source,'addresses','direcciones').map(item=>backofficeAdapter.address(item)),
   createdAt:text(source,'createdAt','created_at'),
  }
 },
 address(source:Source):Address{return{
  id:text(source,'id','address_id'),
  label:text(source,'label','etiqueta')||'Dirección',
  recipientName:text(source,'recipientName','recipient_name','destinatario'),
  street:text(source,'street','calle'),
  streetNumber:text(source,'streetNumber','street_number','numero'),
  floor:optionalText(source,'floor','piso'),
  apartment:optionalText(source,'apartment','departamento','depto'),
  city:text(source,'city','ciudad','localidad'),
  postalCode:text(source,'postalCode','postal_code','codigo_postal'),
  province:text(source,'province','provincia'),
  phone:text(source,'phone','telefono'),
  deliveryNotes:optionalText(source,'deliveryNotes','delivery_notes','notas'),
  isDefault:flag(source,false,'isDefault','is_default','principal'),
  shippingZoneId:optionalText(source,'shippingZoneId','shipping_zone_id','zona_id'),
 }},
 dailyMenu(source:Source):DailyMenu{return{
  id:text(source,'id','menu_id'),
  date:text(source,'date','fecha'),
  title:text(source,'title','titulo'),
  orderDeadline:text(source,'orderDeadline','order_deadline','horario_limite'),
  deliveryTimeSlotId:text(source,'deliveryTimeSlotId','delivery_time_slot_id','franja_id'),
  active:flag(source,true,'active','activo','published','publicado'),
  items:list<Source>(source,'items','productos','options').map((item):DailyMenuItem=>({
   productId:text(item,'productId','product_id','id'),
   availableStock:optionalNumber(item,'availableStock','available_stock','stock'),
   featured:value(item,'featured','destacado')===undefined?undefined:flag(item,false,'featured','destacado'),
  })),
 }},
 weeklyMenu(source:Source):WeeklyMenu{return{
  id:text(source,'id'),
  weekStartsAt:text(source,'weekStartsAt','week_starts_at','desde'),
  weekEndsAt:text(source,'weekEndsAt','week_ends_at','hasta'),
  dailyMenuIds:list(source,'dailyMenuIds','daily_menu_ids','menus').map(String),
  published:flag(source,true,'published','publicado','active'),
 }},
 promotion(source:Source):Promotion{return{
  id:text(source,'id'),
  name:text(source,'name','nombre'),
  description:text(source,'description','descripcion'),
  type:oneOf(text(source,'type','tipo'),PROMOTION_TYPES,'percentage'),
  value:number(source,'value','valor'),
  productIds:list(source,'productIds','product_ids','productos').map(String),
  startsAt:text(source,'startsAt','starts_at','desde'),
  endsAt:text(source,'endsAt','ends_at','hasta'),
  active:flag(source,true,'active','activo'),
 }},
 coupon(source:Source):Coupon{return{
  id:text(source,'id'),
  code:text(source,'code','codigo').toUpperCase(),
  type:oneOf(text(source,'type','tipo'),COUPON_TYPES,'percentage'),
  value:number(source,'value','valor'),
  minimumOrder:optionalNumber(source,'minimumOrder','minimum_order','minimo'),
  startsAt:text(source,'startsAt','starts_at','desde'),
  endsAt:text(source,'endsAt','ends_at','hasta'),
  maxUses:optionalNumber(source,'maxUses','max_uses'),
  usedCount:optionalNumber(source,'usedCount','used_count'),
  allowedCategoryIds:list(source,'allowedCategoryIds','allowed_category_ids').map(String),
  allowedProductIds:list(source,'allowedProductIds','allowed_product_ids').map(String),
  active:flag(source,true,'active','activo'),
 }},
 order(source:Source):Order{return{
  id:text(source,'id','order_id','numero'),
  userId:optionalText(source,'userId','user_id','client_id'),
  status:oneOf(text(source,'status','estado'),ORDER_STATUSES,'pending'),
  details:list<Source>(source,'details','items','productos').map((item,index):OrderDetail=>({
   id:text(item,'id')||`detail-${index}`,
   productId:text(item,'productId','product_id'),
   productName:text(item,'productName','product_name','nombre'),
   quantity:number(item,'quantity','cantidad'),
   unitPrice:number(item,'unitPrice','unit_price','precio'),
   subtotal:value(item,'subtotal')===undefined?number(item,'unitPrice','unit_price','precio')*number(item,'quantity','cantidad'):number(item,'subtotal'),
  })),
  subtotal:number(source,'subtotal'),
  shippingCost:number(source,'shippingCost','shipping_cost','envio'),
  discount:number(source,'discount','descuento'),
  total:number(source,'total'),
  currency:'ARS',
  paymentMethodId:text(source,'paymentMethodId','payment_method_id'),
  timeSlotId:text(source,'timeSlotId','time_slot_id'),
  pickup:flag(source,false,'pickup','retiro'),
  shippingAddress:value(source,'shippingAddress','shipping_address','direccion')===undefined?undefined:backofficeAdapter.address(value(source,'shippingAddress','shipping_address','direccion') as Source),
  couponCode:optionalText(source,'couponCode','coupon_code'),
  notes:optionalText(source,'notes','notas'),
  createdAt:text(source,'createdAt','created_at')||new Date().toISOString(),
 }},
 shippingZone(source:Source):ShippingZone{return{
  id:text(source,'id','zone_id'),
  name:text(source,'name','nombre'),
  postalCodes:list(source,'postalCodes','postal_codes','codigos_postales').map(String),
  price:number(source,'price','precio','costo'),
  freeShippingFrom:optionalNumber(source,'freeShippingFrom','free_shipping_from'),
  active:flag(source,true,'active','activo'),
 }},
 timeSlot(source:Source):TimeSlot{return{
  id:text(source,'id','slot_id'),
  label:text(source,'label','etiqueta')||`${text(source,'startsAt','starts_at')} — ${text(source,'endsAt','ends_at')}`,
  startsAt:text(source,'startsAt','starts_at','desde'),
  endsAt:text(source,'endsAt','ends_at','hasta'),
  capacity:optionalNumber(source,'capacity','cupo'),
  active:flag(source,true,'active','activo'),
 }},
 paymentMethod(source:Source):PaymentMethod{return{
  id:text(source,'id','method_id'),
  name:text(source,'name','nombre'),
  type:oneOf(text(source,'type','tipo'),PAYMENT_TYPES,'cash'),
  description:optionalText(source,'description','descripcion'),
  active:flag(source,true,'active','activo'),
 }},
 paymentTransaction(source:Source):PaymentTransaction{return{
  id:text(source,'id','payment_id'),
  orderId:text(source,'orderId','order_id'),
  methodId:text(source,'methodId','method_id'),
  amount:number(source,'amount','importe'),
  currency:'ARS',
  status:oneOf(text(source,'status','estado'),PAYMENT_STATUSES,'pending'),
  redirectUrl:optionalText(source,'redirectUrl','redirect_url','init_point'),
  createdAt:text(source,'createdAt','created_at')||new Date().toISOString(),
  isSimulation:false,
 }},
 storeConfig(source:Source):StoreConfig{return{
  id:text(source,'id'),
  name:text(source,'name','nombre'),
  tagline:text(source,'tagline','slogan'),
  currency:'ARS',
  locale:text(source,'locale')||'es-AR',
  timezone:text(source,'timezone')||'America/Argentina/Buenos_Aires',
  orderDeadline:text(source,'orderDeadline','order_deadline'),
  phone:text(source,'phone','telefono'),
  email:text(source,'email','correo'),
  pickupEnabled:flag(source,true,'pickupEnabled','pickup_enabled'),
  deliveryEnabled:flag(source,true,'deliveryEnabled','delivery_enabled'),
  minimumOrder:number(source,'minimumOrder','minimum_order'),
  address:text(source,'address','direccion'),
  businessHours:text(source,'businessHours','business_hours'),
  socialLinks:list<StoreConfig['socialLinks'][number]>(source,'socialLinks','social_links','redes'),
  banners:list<StoreConfig['banners'][number]>(source,'banners'),
 }},
 /** Acepta un array plano o las envolturas paginadas más habituales. */
 list<T>(payload:unknown,mapper:(source:Source)=>T):T[]{
  if(Array.isArray(payload))return payload.map(item=>mapper(item as Source))
  if(payload&&typeof payload==='object'){
   for(const key of ['items','data','results','records']){
    const nested=(payload as Record<string,unknown>)[key]
    if(Array.isArray(nested))return nested.map(item=>mapper(item as Source))
   }
  }
  return []
 },
}
