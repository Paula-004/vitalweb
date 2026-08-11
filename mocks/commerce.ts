import { Coupon, PaymentMethod, Promotion, ShippingZone, StoreConfig, TimeSlot, User } from '@/types/domain'

export const mockUsers: User[] = [
 { id:'user-demo-001',firstName:'Marina',lastName:'Gómez',username:'marina',phone:'+54 9 11 5555 0101',createdAt:'2026-06-01T12:00:00.000Z',addresses:[{id:'addr-demo-001',label:'Casa',recipientName:'Marina Gómez',street:'Arenales',streetNumber:'1234',floor:'4',apartment:'B',city:'Buenos Aires',postalCode:'C1061',province:'Buenos Aires',phone:'+54 9 11 5555 0101',deliveryNotes:'Timbre 4B, dejar en recepción.',isDefault:true,shippingZoneId:'zone-caba'}]},
 { id:'user-demo-002',firstName:'Tomás',lastName:'Rossi',username:'tomas',phone:'+54 9 11 5555 0202',createdAt:'2026-05-14T10:00:00.000Z',addresses:[] },
]
export const mockPaymentMethods: PaymentMethod[] = [
  { id:'pay-mercadopago',name:'Mercado Pago',type:'wallet',description:'Resultado simulado, sin redirección real.',active:true },
  { id:'pay-card',name:'Tarjeta',type:'card',description:'No se solicitan datos reales.',active:true },
  { id:'pay-transfer',name:'Transferencia bancaria',type:'transfer',description:'Datos bancarios de demostración.',active:true },
  { id:'pay-cash-delivery',name:'Efectivo al recibir',type:'cash',active:true },
  { id:'pay-cash-pickup',name:'Efectivo al retirar',type:'cash',active:true },
]
export const mockShippingZones: ShippingZone[] = [{ id: 'zone-caba', name: 'CABA', postalCodes: ['C1061', 'C1000'], price: 1800, freeShippingFrom: 30000, active: true }]
export const mockTimeSlots: TimeSlot[] = [{ id: 'slot-lunch-12-14', label: 'Hoy, 12:00 — 14:00', startsAt: '12:00', endsAt: '14:00', capacity: 40, active: true }]
export const mockCoupons: Coupon[] = [
 {id:'coupon-bienvenida',code:'VITAL10',type:'percentage',value:10,minimumOrder:15000,startsAt:'2026-01-01',endsAt:'2026-12-31',maxUses:500,usedCount:24,active:true},
 {id:'coupon-cincomil',code:'AHORRA5000',type:'fixed',value:5000,minimumOrder:30000,startsAt:'2026-01-01',endsAt:'2026-12-31',maxUses:200,usedCount:18,active:true},
 {id:'coupon-envio',code:'ENVIOVITAL',type:'free_shipping',value:0,minimumOrder:12000,startsAt:'2026-01-01',endsAt:'2026-12-31',maxUses:300,usedCount:50,active:true},
 {id:'coupon-veggie',code:'VEGGIE15',type:'percentage',value:15,minimumOrder:10000,startsAt:'2026-01-01',endsAt:'2026-12-31',allowedCategoryIds:['cat-ensaladas','cat-tartas'],active:true},
 {id:'coupon-pollo',code:'POLLO20',type:'percentage',value:20,minimumOrder:8000,startsAt:'2026-01-01',endsAt:'2026-12-31',allowedProductIds:['prod-pollo-portuguesa'],active:true},
 {id:'coupon-vencido',code:'JUNIO20',type:'percentage',value:20,minimumOrder:8000,startsAt:'2026-06-01',endsAt:'2026-06-30',active:true},
 {id:'coupon-usado',code:'YAUSADO',type:'fixed',value:2000,minimumOrder:8000,startsAt:'2026-01-01',endsAt:'2026-12-31',usedByUserIds:['user-demo-001'],active:true},
]
export const mockPromotions: Promotion[] = [{ id: 'promo-semanal', name: 'Semana Vital', description: 'Beneficio en viandas seleccionadas.', type: 'percentage', value: 10, productIds: ['prod-pollo-portuguesa'], startsAt: '2026-07-13', endsAt: '2026-07-19', active: true }]
export const mockStoreConfig: StoreConfig = { id:'store-vital-food',name:'Vital Food',tagline:'Comé rico. Viví liviano.',currency:'ARS',locale:'es-AR',timezone:'America/Argentina/Buenos_Aires',orderDeadline:'10:30',phone:'+54 9 11 0000 0000',pickupEnabled:true,deliveryEnabled:true,minimumOrder:8000,address:'Av. Siempreviva 742, Palermo, CABA',businessHours:'Lunes a viernes de 11:30 a 15:00',socialLinks:[{network:'instagram',label:'Instagram',url:'https://instagram.com/'},{network:'facebook',label:'Facebook',url:'https://facebook.com/'},{network:'whatsapp',label:'WhatsApp',url:'https://wa.me/5491100000000'}],banners:[{id:'banner-catalog-01',eyebrow:'Semana Vital',title:'Planificá rico, viví liviano.',description:'Descubrí el menú semanal y resolvé tus almuerzos.',actionLabel:'Ver menú semanal',actionUrl:'/menu-semanal',active:true,placement:'catalog'}] }
