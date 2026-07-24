# Endpoints requeridos para clientes y pedidos

Este documento describe capacidades, no impone nombres de rutas. Las URLs definitivas deben ser informadas por el backoffice y configuradas en los servicios de `vitalweb`.

## Autenticación

- Registro: recibe nombre, apellido, correo, teléfono y contraseña; devuelve sesión y usuario.
- Login: recibe correo y contraseña; devuelve token/sesión y usuario.
- Renovación o consulta de sesión autenticada.
- Logout o revocación de sesión.
- Solicitud de recuperación de contraseña.
- Confirmación de nueva contraseña mediante token temporal.
- Consulta y actualización del perfil autenticado.

La sesión mock actual es sólo demostrativa, vive en memoria y no ofrece garantías de seguridad.

## Direcciones

- Listar direcciones del usuario autenticado.
- Crear dirección.
- Actualizar dirección.
- Eliminar dirección.
- Marcar una dirección como principal.
- Validar código postal y devolver zona/costo de envío.

Campos: `recipientName`, `street`, `streetNumber`, `floor?`, `apartment?`, `city`, `province`, `postalCode`, `phone`, `deliveryNotes?`, `isDefault`, `shippingZoneId?`.

## Carrito

Actualmente el carrito demo se guarda exclusivamente en `localStorage`. Para sincronización real se requerirían operaciones para:

- Obtener o crear carrito activo.
- Agregar producto y cantidad.
- Cambiar cantidad.
- Agregar observación por línea.
- Eliminar línea.
- Guardar observación general.
- Aplicar o retirar cupón.
- Vaciar carrito.
- Validar precios, stock, disponibilidad, fecha, horario límite y monto mínimo.

El backoffice debe recalcular importes y validar todo nuevamente; nunca debe confiar en los totales enviados por el navegador.

## Checkout y pedidos

- Consultar zonas y costos de envío.
- Consultar franjas disponibles por fecha, zona y modalidad.
- Consultar medios de pago habilitados.
- Cotizar checkout: subtotal, promociones, cupón, envío y total.
- Crear pedido de forma idempotente.
- Listar pedidos del usuario.
- Obtener detalle de pedido.
- Consultar estado actualizado.
- Repetir pedido o devolver productos nuevamente disponibles.
- Cancelar un pedido cuando las reglas lo permitan.

Estados esperados: `pending`, `confirmed`, `preparing`, `ready_for_pickup`, `on_the_way`, `delivered`, `cancelled`.

## Pagos

- Crear intención u orden de pago.
- Consultar estado del pago.
- Procesar retorno del proveedor.
- Webhook servidor a servidor en el backoffice.

`vitalweb` no debe recibir secretos del proveedor ni confirmar pagos únicamente desde el navegador.

## Adaptación

Los contratos se implementan en `types/`. El transporte y autenticación HTTP se conectarán en `lib/apiClient.ts`. Cada transformación entre la respuesta real y el dominio del frontend debe quedar dentro de `services/`.
