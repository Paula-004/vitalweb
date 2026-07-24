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

### Funciones conectadas

- Registro de clientes.
- Inicio de sesión con email y contraseña.
- Persistencia de la sesión en el navegador.
- Envío del bearer token en las solicitudes autenticadas.
- Consulta y actualización básica del perfil.
- Consulta de productos generados desde las opciones del menú.
- Consulta de categorías.
- Consulta de menús diarios.
- Consulta del menú semanal.
- Separación de permisos entre clientes y usuarios del backoffice.

### Endpoints disponibles

| Método | Endpoint | Uso |
| --- | --- | --- |
| `POST` | `/storefront/auth/register` | Registrar un cliente. |
| `POST` | `/storefront/auth/login` | Iniciar sesión. |
| `GET` | `/storefront/auth/me` | Obtener el perfil autenticado. |
| `PATCH` | `/storefront/auth/me` | Actualizar el perfil. |
| `GET` | `/storefront/products` | Obtener platos publicados desde el menú. |
| `GET` | `/storefront/categories` | Obtener categorías. |
| `GET` | `/storefront/menus/daily` | Obtener menús diarios. Acepta `date=YYYY-MM-DD`. |
| `GET` | `/storefront/menus/weekly` | Obtener el menú semanal. |

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

## Ajustes pendientes en `vitalweb`

- Mostrar estados de carga y error en `Storefront.tsx`.
- Eliminar variables sin uso que actualmente bloquean el lint del build.
- Proteger o redirigir las páginas que requieran sesión.
- Mostrar un mensaje claro si el backend está desconectado.
- Evitar cargar endpoints protegidos antes de restaurar la sesión.
- Incorporar validación de formularios.
- Agregar pruebas para login, registro, sesión expirada y menú vacío.
- Definir imágenes de respaldo cuando un plato no tenga `imageUrl`.

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
