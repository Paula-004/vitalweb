# Próximos pasos de integración

Este documento describe cómo continuar la integración entre:

- `vitalweb`: tienda web utilizada por los clientes.
- `Gestion-de-clientes`: backoffice y API NestJS.

## Estado actual

La web conserva los mocks y puede alternar entre ambos orígenes mediante:

```env
NEXT_PUBLIC_DATA_SOURCE=mock
```

o:

```env
NEXT_PUBLIC_DATA_SOURCE=api
```

En el entorno local quedó seleccionado `api`.

### Resolución por capacidad, no global

`NEXT_PUBLIC_DATA_SOURCE=api` ya no obliga a que todo exista en el backoffice. Cada
servicio consulta `useApiFor(endpoint)` en `lib/config.ts`: usa la API sólo si esa ruta
está configurada y, si no lo está, responde con el mock correspondiente en lugar de
romper la pantalla.

Consecuencia práctica: **el lado del frontend de cada prioridad de este documento ya está
implementado**. Para activar una capacidad alcanza con publicar la ruta en el backoffice
y completar su variable en `.env.local`; no hace falta tocar componentes ni páginas.

### Implementado del lado de `vitalweb`

- Registro de clientes.
- Inicio de sesión con email y contraseña.
- Persistencia de la sesión en el navegador.
- Envío del bearer token en las solicitudes autenticadas.
- Consulta y actualización básica del perfil.
- Consulta de productos, categorías, menús diarios y menú semanal.

### Estado del backoffice: las rutas `/storefront/*` todavía NO existen

Verificado sobre `Gestion-de-clientes/backend/src`: no hay ninguna aparición de
`storefront` ni un `setGlobalPrefix`. Los controladores existentes son los internos del
backoffice y están pensados para su personal:

| Controlador | Observación |
| --- | --- |
| `@Controller('auth')` | `POST /auth/login` y `GET /auth/me` son del **personal**, no de clientes. `/auth/users` exige `AdminGuard`. No hay registro de clientes. |
| `@Controller('menus')` | Protegido con `AuthGuard, AdminGuard`: un visitante anónimo no puede leerlo. |
| `@Controller('categories')`, `clients`, `deliveries`, `recipes`, `stock`, … | Resto del backoffice. |

Por lo tanto, **ninguna de las capacidades de arriba funciona todavía contra la API real**.
Configurar `NEXT_PUBLIC_API_*` con rutas `/storefront/...` produce `404` en todas.

Lo que falta crear en el backoffice es un módulo `storefront` público (sin `AdminGuard`)
que exponga, como mínimo:

| Método | Endpoint | Uso |
| --- | --- | --- |
| `POST` | `/storefront/auth/register` | Registrar un cliente. |
| `POST` | `/storefront/auth/login` | Iniciar sesión como cliente. |
| `GET` | `/storefront/auth/me` | Obtener el perfil autenticado. |
| `PATCH` | `/storefront/auth/me` | Actualizar el perfil. |
| `GET` | `/storefront/products` | Platos publicados. Debe ser público. |
| `GET` | `/storefront/categories` | Categorías. Debe ser público. |
| `GET` | `/storefront/menus/daily` | Menús diarios. Acepta `date=YYYY-MM-DD`. |
| `GET` | `/storefront/menus/weekly` | Menú semanal. |

### Conflicto de puertos en desarrollo

Ambos proyectos usan el puerto `3000` por defecto (`backend/.env` tiene `PORT=3000` y Next
también). El que arranca segundo queda en otro puerto: el backend busca uno libre con
`findFreePort` y escribe el elegido en `frontend/public/backend-port.json`.

Apuntar `NEXT_PUBLIC_API_URL` a `http://localhost:3000` cuando ahí está corriendo Next hace
que la web se pida los datos a sí misma y **todo responda 404**. Conviene fijar un puerto
distinto para el backend, por ejemplo `PORT=3100`, y usar
`NEXT_PUBLIC_API_URL=http://localhost:3100`.

## Prioridad 1: completar el catálogo

El modelo actual del backoffice contiene opciones de menú, pero no todos los
campos comerciales que usa `vitalweb`.

Se recomienda agregar o definir:

- Stock o cantidad máxima disponible.
- Estado publicado/oculto.
- Ingredientes.
- Etiquetas alimentarias.
- Descripción corta y descripción completa.
- Precio promocional.
- Horario límite de pedido configurable.
- Galería de imágenes.
- Indicadores de destacado y más vendido.
- Identificador estable o slug comercial.

También se debe decidir si `MenuOption` seguirá representando simultáneamente
un producto y su publicación diaria, o si conviene separar:

- `Product`: información permanente del plato.
- `DailyMenu`: publicación de productos para una fecha.

Separarlos evita duplicar un mismo plato cada vez que se publica en otro día.

Mientras tanto, `adapters/backofficeAdapter.ts` asume valores tolerantes para los campos
que el backoffice no envía: `active` y `available` en `true`, `featured` y `bestSeller` en
`false`, y `stock` en `ASSUMED_STOCK`. Sin eso, un producto sin esos campos se mostraría
como inactivo y agotado. **Ese stock asumido no es real**: hasta que el backoffice lo
publique, la web no puede impedir que se venda más de lo que hay.

## Prioridad 2: direcciones y zonas de entrega

Implementar:

| Método | Endpoint sugerido |
| --- | --- |
| `GET` | `/storefront/me/addresses` |
| `POST` | `/storefront/me/addresses` |
| `PATCH` | `/storefront/me/addresses/:id` |
| `DELETE` | `/storefront/me/addresses/:id` |
| `GET` | `/storefront/shipping/zones` |
| `POST` | `/storefront/shipping/quote` |
| `GET` | `/storefront/shipping/time-slots` |

Actualmente `Client.address` es un único texto. Para soportar varias direcciones
conviene crear un modelo `ClientAddress` relacionado con `Client`.

La cotización debe validar:

- Código postal o zona.
- Fecha seleccionada.
- Franja horaria disponible.
- Costo de envío.
- Pedido mínimo.
- Retiro por el local.

## Prioridad 3: carrito y pedidos

El carrito puede permanecer en el navegador, pero el precio, stock y total final
siempre deben validarse en el backend.

Implementar:

| Método | Endpoint sugerido |
| --- | --- |
| `POST` | `/storefront/orders` |
| `GET` | `/storefront/me/orders` |
| `GET` | `/storefront/orders/:id` |
| `POST` | `/storefront/orders/:id/cancel` |

El pedido debería guardar:

- Cliente autenticado.
- Productos y cantidades.
- Copia del nombre y precio de cada producto.
- Dirección o modalidad de retiro.
- Franja de entrega.
- Notas.
- Subtotal.
- Costo de envío.
- Descuento.
- Total.
- Estado del pedido y del pago.

Para crear pedidos se recomienda exigir el header `Idempotency-Key`, evitando
pedidos duplicados si el cliente toca dos veces el botón o se reintenta una
solicitud.

Se debe definir cómo conviven los pedidos web con el modelo actual `Delivery`.
Una alternativa es crear `Order` y `OrderItem`, y generar o vincular una
`Delivery` cuando el pedido queda confirmado.

## Prioridad 4: pagos

Definir primero el proveedor, por ejemplo Mercado Pago, transferencia o pago
contra entrega.

Endpoints sugeridos:

| Método | Endpoint sugerido |
| --- | --- |
| `GET` | `/storefront/payment-methods` |
| `POST` | `/storefront/payments` |
| `GET` | `/storefront/payments/:id` |
| `POST` | `/webhooks/payments/:provider` |

Estado en la web: el flujo de checkout, confirmación y pantalla de resultado ya funciona
completo, pero **el cobro está simulado**. `paymentService.isSimulated` es `true` mientras
`NEXT_PUBLIC_API_PAYMENT_CREATE_ENDPOINT` esté vacío; en ese modo la UI avisa
explícitamente que no hay cobro real y permite elegir el resultado a probar. Al completar
esa variable, `paymentService.create` pasa a llamar al backoffice, deja de enviar el
importe y respeta el `redirectUrl` del proveedor sin tocar componentes.

Reglas importantes:

- El backend calcula el importe usando el pedido guardado.
- La web nunca envía un importe considerado confiable.
- Los secretos del proveedor quedan sólo en el backend.
- El webhook debe validar la firma del proveedor.
- El cambio de estado debe ser idempotente.

## Prioridad 5: cupones y promociones

Implementar:

| Método | Endpoint sugerido |
| --- | --- |
| `GET` | `/storefront/promotions` |
| `POST` | `/storefront/coupons/validate` |

La validación debe considerar vigencia, pedido mínimo, productos, categorías,
cantidad de usos y si el cliente ya utilizó el cupón.

## Prioridad 6: favoritos

Crear una relación entre cliente y producto.

| Método | Endpoint sugerido |
| --- | --- |
| `GET` | `/storefront/me/favorites` |
| `POST` | `/storefront/me/favorites` |
| `DELETE` | `/storefront/me/favorites/:productId` |

## Prioridad 7: recuperación de contraseña

Actualmente la pantalla existe, pero el modo API todavía no tiene recuperación
real.

Implementar:

| Método | Endpoint sugerido |
| --- | --- |
| `POST` | `/storefront/auth/password/recovery` |
| `POST` | `/storefront/auth/password/reset` |

El backend debe:

- Responder de forma neutra aunque el email no exista.
- Generar un token de uso único y corta duración.
- Guardar sólo un hash del token.
- Invalidarlo luego del cambio.
- Limitar la cantidad de intentos.

## Prioridad 8: configuración del comercio

Implementar `GET /storefront/config` para reemplazar textos fijos de la web:

- Nombre y slogan.
- Teléfono, email y WhatsApp.
- Dirección.
- Horarios.
- Pedido mínimo.
- Retiro y envío habilitados.
- Horario límite.
- Redes sociales.
- Banners.

## Ajustes resueltos en `vitalweb`

- Estados de carga y error: `useAsyncData` los expone y `MenuOptions` los muestra con
  botón de reintento.
- Lint y build limpios.
- Rutas con sesión: `useRequireSession` redirige a `/login?next=…` y vuelve al destino
  después de ingresar.
- Backend desconectado: `apiClient` normaliza el error y cada pantalla lo muestra; las
  capacidades sin endpoint caen a mock en lugar de fallar.
- No se piden endpoints protegidos antes de restaurar la sesión (`ready` en `AuthContext`).
- Validación de formularios en login, registro, recuperación, perfil, dirección y checkout.
- Imagen de respaldo en `ProductImage` cuando el plato no trae `imageUrl`.

## Variables a completar por prioridad

| Prioridad | Variable en `.env.local` |
| --- | --- |
| 2 | `NEXT_PUBLIC_API_ADDRESSES_ENDPOINT`, `NEXT_PUBLIC_API_SHIPPING_ZONES_ENDPOINT`, `NEXT_PUBLIC_API_SHIPPING_QUOTE_ENDPOINT`, `NEXT_PUBLIC_API_TIME_SLOTS_ENDPOINT` |
| 3 | `NEXT_PUBLIC_API_ORDERS_ENDPOINT`, `NEXT_PUBLIC_API_MY_ORDERS_ENDPOINT` |
| 4 | `NEXT_PUBLIC_API_PAYMENT_ENDPOINT`, `NEXT_PUBLIC_API_PAYMENT_CREATE_ENDPOINT`, `NEXT_PUBLIC_API_PAYMENT_STATUS_ENDPOINT` |
| 5 | `NEXT_PUBLIC_API_PROMOTIONS_ENDPOINT`, `NEXT_PUBLIC_API_COUPONS_ENDPOINT` |
| 6 | `NEXT_PUBLIC_API_FAVORITES_ENDPOINT` |
| 7 | `NEXT_PUBLIC_API_PASSWORD_RECOVERY_ENDPOINT`, `NEXT_PUBLIC_API_PASSWORD_RESET_ENDPOINT` |
| 8 | `NEXT_PUBLIC_API_STORE_CONFIG_ENDPOINT`, `NEXT_PUBLIC_API_RECOMMENDATIONS_ENDPOINT` |

- Pruebas automatizadas con Vitest (`npm test`): login, registro, sesión expirada, menú
  vacío, tolerancia del adaptador y validación del carrito.

## Pendiente real en `vitalweb`

- Cobro real: el flujo de pago funciona de punta a punta pero **simulado**. Ver Prioridad 4.
- Las pruebas cubren servicios y adaptadores, no componentes React. Para probar pantallas
  haría falta sumar `jsdom` y `@testing-library/react`.

## Configuración local

Ejemplo para `.env.local`:

```env
NEXT_PUBLIC_DATA_SOURCE=api
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_PRODUCTS_ENDPOINT=/storefront/products
NEXT_PUBLIC_API_CATEGORIES_ENDPOINT=/storefront/categories
NEXT_PUBLIC_API_DAILY_MENU_ENDPOINT=/storefront/menus/daily
NEXT_PUBLIC_API_WEEKLY_MENU_ENDPOINT=/storefront/menus/weekly
NEXT_PUBLIC_API_CUSTOMER_LOGIN_ENDPOINT=/storefront/auth/login
NEXT_PUBLIC_API_CUSTOMER_REGISTER_ENDPOINT=/storefront/auth/register
NEXT_PUBLIC_API_CUSTOMER_ME_ENDPOINT=/storefront/auth/me
```

Si el backend ocupa otro puerto, se debe actualizar `NEXT_PUBLIC_API_URL` y
reiniciar Next.js.

## Orden recomendado de implementación

1. Corregir el lint y completar el contrato de producto/menú.
2. Crear direcciones, zonas y cotización de envío.
3. Crear pedidos e historial del cliente.
4. Vincular pedidos con entregas del backoffice.
5. Integrar medios de pago.
6. Implementar cupones y promociones.
7. Implementar favoritos.
8. Implementar recuperación de contraseña.
9. Reemplazar la configuración fija del comercio.
10. Agregar pruebas de integración y seguridad.

## Criterio para retirar los mocks

No se recomienda eliminarlos todavía. Primero deben estar conectados y probados:

- Catálogo y menús.
- Autenticación y perfil.
- Direcciones y entrega.
- Pedidos.
- Pagos.
- Promociones.
- Favoritos.
- Configuración del comercio.

Cuando el flujo completo funcione contra la API, los mocks pueden quedar
exclusivamente para pruebas o eliminarse en una tarea separada.
