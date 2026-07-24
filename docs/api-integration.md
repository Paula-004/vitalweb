# Integración esperada con la API del backoffice

Este documento propone rutas para acordar el contrato. `vitalweb` no implementa ninguna de ellas. La API puede usar otros nombres siempre que se actualicen `.env.local`, los servicios y `adapters/backofficeAdapter.ts`.

## Convenciones

- Base URL: `NEXT_PUBLIC_API_URL`, por ejemplo `https://api.example.com/v1`.
- Autenticación: `Authorization: Bearer <token>`.
- JSON: `Content-Type: application/json` y `Accept: application/json`.
- Respuesta preferida: `{ "data": ..., "meta": { "requestId": "...", "timestamp": "..." } }`.
- Error preferido: `{ "message": "Texto comprensible", "code": "CODE", "details": {} }`.
- Fechas ISO 8601; fechas comerciales `YYYY-MM-DD`; horarios `HH:mm`; importes numéricos en ARS.
- Errores comunes: `400` validación, `401` sesión inválida, `403` prohibido, `404` inexistente, `409` conflicto/stock, `410` vencido, `422` regla comercial, `429` límite, `500/503` servidor.

## Catálogo

### Obtener productos

- Sugerido: `GET /products`
- Parámetros opcionales: `category`, `search`, `available`, `date`, `dietaryTags[]`, `promotion`, `featured`, `sort`, `page`, `limit`.
- Respuesta: `{ "data": [{ "id":"prod-1", "slug":"pollo", "name":"Pollo", "shortDescription":"...", "description":"...", "imageUrl":"https://...", "gallery":[], "price":8500, "promotionalPrice":7900, "currency":"ARS", "categoryId":"cat-1", "ingredients":[], "dietaryTags":["sin-tacc"], "available":true, "stock":8, "availableDays":["martes"], "orderDeadline":"10:30", "active":true, "featured":true, "bestSeller":false, "displayOrder":1, "createdAt":"2026-07-01T12:00:00Z" }] }`.
- Obligatorios: todos salvo `gallery`, `promotionalPrice`, `nutritionalInformation`, `availableDate`, `badge`.
- Errores: `400` filtros inválidos, `503` catálogo temporalmente no disponible.

### Obtener producto por slug

- Sugerido: `GET /products/{slug}`.
- Parámetro obligatorio: `slug` en ruta.
- Respuesta: un producto con el mismo contrato anterior.
- Errores: `404` producto inexistente/inactivo.

### Obtener categorías

- Sugerido: `GET /categories`.
- Parámetros opcionales: `active`, `includeProductCount`.
- Respuesta: `{ "data":[{"id":"cat-1","name":"Viandas","slug":"viandas","description":"...","sortOrder":1,"active":true}] }`.
- Obligatorios: `id`, `name`, `slug`, `sortOrder`, `active`. Opcional: `description`.

## Menús y promociones

### Menú del día

- Sugerido: `GET /menus/daily`.
- Parámetros: `date` opcional; sin fecha devuelve el activo.
- Respuesta: `{ "data":{"id":"daily-1","date":"2026-07-14","title":"Martes 14","orderDeadline":"10:30","deliveryTimeSlotId":"slot-1","active":true,"items":[{"productId":"prod-1","availableStock":8,"featured":true}]}}`.
- Obligatorios: todos salvo `availableStock` y `featured`.
- Errores: `404` menú no publicado, `410` menú cerrado.

### Menú semanal

- Sugerido: `GET /menus/weekly`.
- Parámetros opcionales: `weekStartsAt` o `date`.
- Respuesta: `{ "data":{"id":"week-1","weekStartsAt":"2026-07-13","weekEndsAt":"2026-07-19","dailyMenuIds":["daily-1"],"published":true}}`.
- Obligatorios: todos. Errores: `404` semana no publicada.

### Promociones

- Sugerido: `GET /promotions`.
- Parámetros opcionales: `active`, `date`, `productId`, `categoryId`.
- Respuesta: `{ "data":[{"id":"promo-1","name":"Semana Vital","description":"...","type":"percentage","value":10,"productIds":["prod-1"],"startsAt":"2026-07-13","endsAt":"2026-07-19","active":true}]}`.
- Obligatorios: todos. Opcional: restricciones adicionales del backoffice.

## Autenticación y perfil

### Login

- `POST /auth/login`; body obligatorio: `{ "email":"...", "password":"..." }`.
- Respuesta: `{ "data":{"user":{...},"accessToken":"...","expiresAt":"..."} }`.
- Errores: `401` credenciales inválidas, `423` cuenta bloqueada, `429` intentos excesivos.

### Registro

- `POST /auth/register`; body: `firstName`, `lastName`, `email`, `phone`, `password` obligatorios.
- Respuesta: sesión y usuario, o usuario pendiente de verificación.
- Errores: `409` correo existente, `422` contraseña o datos inválidos.

### Recuperación

- `POST /auth/password/recovery`; body obligatorio: `{ "email":"..." }`.
- Respuesta: `{ "data":{"sent":true} }` sin revelar si el correo existe cuando la política lo requiera.
- Errores: `429` límite de solicitudes.

### Perfil

- `GET /me` devuelve el usuario autenticado.
- `PATCH /me` acepta opcionalmente `firstName`, `lastName`, `phone`.
- Usuario obligatorio: `id`, `firstName`, `lastName`, `email`, `phone`, `addresses`, `createdAt`.
- Errores: `401`, `409` teléfono/correo en uso, `422` validación.

## Direcciones y entrega

### Guardar dirección

- `POST /me/addresses`; para editar: `PATCH /me/addresses/{id}`.
- Obligatorios: `label`, `recipientName`, `street`, `streetNumber`, `city`, `province`, `postalCode`, `phone`, `isDefault`.
- Opcionales: `floor`, `apartment`, `deliveryNotes`, `shippingZoneId`.
- Respuesta: dirección completa con `id`.
- Errores: `404` zona, `422` dirección fuera de cobertura.

### Zonas de envío

- `GET /shipping/zones`; parámetro opcional `postalCode`.
- Respuesta: `{ "data":[{"id":"zone-1","name":"CABA","postalCodes":["C1061"],"price":1800,"freeShippingFrom":30000,"active":true}]}`.
- Obligatorios: `id`, `name`, `postalCodes`, `price`, `active`; opcional `freeShippingFrom`.

### Calcular envío

- `POST /shipping/quote`.
- Body obligatorio: `postalCode`, `zoneId`, `date`, `items`; opcional `couponCode`, `addressId`.
- Respuesta: `{ "data":{"available":true,"zoneId":"zone-1","cost":1800,"freeShipping":false,"timeSlots":[{"id":"slot-1","label":"12:00 — 14:00","startsAt":"12:00","endsAt":"14:00","active":true}]}}`.
- Errores: `409` sin capacidad, `422` fuera de zona/fecha.

## Pedidos

### Crear pedido

- `POST /orders`; enviar header `Idempotency-Key`.
- Body obligatorio: `items[{productId,quantity,notes?}]`, `paymentMethodId`, `timeSlotId`, `pickup`; según modalidad, `shippingAddress` o `addressId`.
- Opcionales: `userId`, `couponCode`, `notes`.
- Respuesta: pedido con `id`, `status`, detalles, subtotal, envío, descuento, total, moneda y fecha.
- Errores: `409` stock/precio cambió o clave duplicada, `410` horario cerrado, `422` mínimo/cupón/dirección.

### Pedidos del usuario

- `GET /me/orders`; parámetros opcionales: `status`, `page`, `limit`, `from`, `to`.
- Respuesta: lista de pedidos resumidos.
- Errores: `401`.

### Detalle de pedido

- `GET /orders/{id}`; parámetro obligatorio `id`.
- Respuesta: pedido completo. Estados: `pending`, `confirmed`, `preparing`, `ready_for_pickup`, `on_the_way`, `delivered`, `cancelled`.
- Errores: `403` pedido ajeno, `404` inexistente.

## Cupones y pagos

### Validar cupón

- `POST /coupons/validate`.
- Body obligatorio: `code`, `items`; opcional: `userId`, `zoneId`, `date`, `deliveryMethod`.
- Respuesta: `{ "data":{"coupon":{...},"discount":1500,"freeShipping":false,"message":"Cupón aplicado"} }`.
- Errores: `404` inexistente, `409` usado/límite, `410` vencido, `422` mínimo o alcance no aplicable.

### Iniciar pago

- `POST /payments`.
- Body obligatorio: `orderId`, `methodId`; opcional: `returnUrl`. El importe definitivo debe obtenerse del pedido, no confiarse al cliente.
- Respuesta: `{ "data":{"id":"pay-1","orderId":"order-1","methodId":"mp","amount":21600,"currency":"ARS","status":"pending","redirectUrl":"https://...","createdAt":"..."} }`.
- `redirectUrl` es opcional. Nunca devolver secretos.
- Errores: `409` pedido ya pagado, `422` medio inválido, `503` proveedor no disponible.

### Estado del pago

- `GET /payments/{id}` o `GET /orders/{orderId}/payment`.
- Respuesta: transacción con estado `pending`, `approved`, `rejected` o `cancelled`.
- Errores: `403`, `404`.

## Configuración del comercio

### Obtener configuración

- `GET /store/config`; sin parámetros.
- Respuesta: `{ "data":{"id":"store-1","name":"Vital Food","tagline":"...","currency":"ARS","locale":"es-AR","timezone":"America/Argentina/Buenos_Aires","orderDeadline":"10:30","phone":"...","email":"...","address":"...","businessHours":"...","pickupEnabled":true,"deliveryEnabled":true,"minimumOrder":8000,"socialLinks":[{"network":"instagram","label":"Instagram","url":"https://..."}],"banners":[{"id":"banner-1","title":"...","placement":"catalog","active":true}]}}`.
- Obligatorios: datos base, flags, mínimo, contacto, horarios, `socialLinks`, `banners`.
- Opcionales de banner: `eyebrow`, `description`, `imageUrl`, `actionLabel`, `actionUrl`.
- Errores: `503` configuración indisponible; el frontend debe mostrar fallback neutro.

## Otros recursos consumidos

- Medios de pago: `GET /payment-methods`.
- Franjas: `GET /shipping/time-slots?date=&zoneId=&method=`.
- Favoritos: `GET/POST/DELETE /me/favorites`.
- Recomendaciones: `GET /recommendations?context=&productId=`.
- Contacto, redes y banners forman parte de `/store/config`.

## Adaptación y transporte

- `lib/config.ts`: URL base, endpoints, timeout y reintentos.
- `lib/apiClient.ts`: headers, bearer token, 401, errores, timeout, reintentos y `AbortSignal`.
- `adapters/backofficeAdapter.ts`: transformación de nombres externos al dominio.
- `services/*`: selección `mock`/`api` y reglas de acceso.
- Nunca importar `mocks/*` desde páginas o componentes.
