# Contrato esperado del backoffice

El frontend consume respuestas con la forma `{ data, meta }`, donde `meta` contiene `requestId` y `timestamp`. Si el backoffice usa otra envoltura, la adaptación debe hacerse dentro de `services/`, sin modificar páginas ni componentes.

## Producto

| Campo | Tipo | Obligatorio | Uso |
| --- | --- | --- | --- |
| `id` | `string` | Sí | Identificador estable. |
| `slug` | `string` | Sí | URL de detalle. Debe ser único. |
| `name` | `string` | Sí | Nombre visible. |
| `shortDescription` | `string` | Sí | Texto de tarjetas y resultados. |
| `description` | `string` | Sí | Descripción completa del detalle. |
| `imageUrl` | `string` | Sí | Ruta local o URL HTTPS de la imagen principal. |
| `gallery` | `string[]` | No | Imágenes adicionales. |
| `price` | `number` | Sí | Precio regular en unidades, no centavos. |
| `promotionalPrice` | `number` | No | Precio vigente de promoción. |
| `currency` | `'ARS'` | Sí | Moneda. |
| `categoryId` | `string` | Sí | ID de una categoría existente. |
| `ingredients` | `string[]` | Sí | Lista de ingredientes. |
| `nutritionalInformation` | `object` | No | `calories`, `protein`, `carbohydrates`, `fat`, `sodium?`, `servingSize`. |
| `dietaryTags` | `string[]` | Sí | `vegetariano`, `vegano`, `sin-tacc`, `sin-lactosa`, `bajo-en-sodio`, `picante`. |
| `available` | `boolean` | Sí | Disponibilidad comercial general. |
| `stock` | `number` | Sí | Unidades disponibles. Cero representa agotado. |
| `availableDays` | `string[]` | Sí | Días en español y minúsculas. |
| `availableDate` | `YYYY-MM-DD` | No | Próxima fecha específica. |
| `orderDeadline` | `HH:mm` | Sí | Horario límite de pedido. |
| `active` | `boolean` | Sí | Permite ocultar el producto del catálogo. |
| `featured` | `boolean` | Sí | Prioridad en orden “Destacados”. |
| `bestSeller` | `boolean` | Sí | Prioridad en “Más vendidos”. |
| `displayOrder` | `number` | Sí | Orden manual ascendente. |
| `createdAt` | ISO 8601 | Sí | Orden “Más recientes”. |

## Categoría

`id`, `name`, `slug`, `description?`, `sortOrder`, `active`.

## Menús

`DailyMenu` espera `id`, `date`, `title`, `orderDeadline`, `deliveryTimeSlotId`, `active` e `items`. Cada item contiene `productId`, `availableStock?` y `featured?`.

`WeeklyMenu` espera `id`, `weekStartsAt`, `weekEndsAt`, `dailyMenuIds` y `published`.

## Promoción

`id`, `name`, `description`, `type` (`percentage`, `fixed` o `bundle`), `value`, `productIds`, `startsAt`, `endsAt`, `active`.

## Integración

1. Configurar `NEXT_PUBLIC_DATA_SOURCE=api` y `NEXT_PUBLIC_API_URL`.
2. Completar en `.env.local` las rutas reales listadas en `.env.example`.
3. Adaptar autenticación, parámetros y forma de respuesta únicamente en `lib/apiClient.ts` o en el servicio correspondiente.
4. Registrar en `next.config.mjs` los hosts de imágenes autorizados por el backoffice/CDN.

No existen endpoints locales ni persistencia propia en `vitalweb`.
