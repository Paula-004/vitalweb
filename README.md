# VitalWeb

Frontend comercial de Vital Food construido con Next.js, TypeScript y Tailwind. Actualmente usa servicios mockeados; no contiene backoffice ni base de datos.

## Desarrollo

```bash
npm install
npm run dev
```

Copiar `.env.example` como `.env.local`. Para el modo actual:

```env
NEXT_PUBLIC_DATA_SOURCE=mock
NEXT_PUBLIC_API_URL=
```

## Simulaciones actuales

- Autenticación, usuarios y direcciones.
- Catálogo, disponibilidad y stock.
- Carrito en `localStorage`.
- Cupones, promociones y favoritos.
- Zonas, envío y franjas horarias.
- Pedidos y estados.
- Mercado Pago, tarjeta, transferencia y efectivo.
- Resultados de pago aprobado, pendiente, rechazado y cancelado.

No deben ingresarse datos reales de tarjeta, cuenta bancaria o credenciales. Ninguna respuesta mock acredita un pago verdadero.

## Conectar pagos reales

1. Mantener claves secretas únicamente en el backoffice. Nunca usar secretos en variables `NEXT_PUBLIC_*`.
2. Configurar `NEXT_PUBLIC_PAYMENT_PROVIDER` y, sólo si el proveedor lo requiere, su clave pública.
3. Completar las rutas reales de creación y consulta de pagos.
4. Reemplazar la rama mock de `paymentService.simulate` por llamadas a `apiClient`.
5. El backoffice debe crear la intención, verificar webhooks y confirmar el pago. El navegador no debe decidir el estado definitivo.
6. Adaptar el retorno del proveedor a `PaymentTransaction` dentro del servicio.

## Conectar cupones

1. Configurar el endpoint de validación en `.env.local`.
2. Implementar la rama API de `couponService`.
3. Enviar código, usuario, productos, cantidades, modalidad, zona y fecha.
4. Usar como definitivos únicamente descuento, envío y total recalculados por el backoffice.
5. El backoffice debe validar vencimiento, compra mínima, límites, usos previos y alcance por productos/categorías.

## Conectar favoritos

1. Completar el endpoint de favoritos.
2. Reemplazar `favoriteService` basado en `localStorage` por operaciones autenticadas para listar, agregar y eliminar.
3. Mantener `FavoriteContext` como interfaz de estado; los componentes no necesitan importar el transporte.
4. Definir cómo se fusionan favoritos locales al iniciar sesión.

## Conectar pedidos y repetición

1. Configurar las rutas reales en `.env.local`.
2. Implementar listado, detalle, creación, cancelación y repetición en `orderService`.
3. Al repetir, solicitar al backoffice una nueva cotización: disponibilidad, stock, precios, promociones y envío pueden cambiar.
4. Mostrar productos descartados y diferencias de precio antes de modificar el carrito.
5. Crear pedidos con una clave de idempotencia para impedir dobles confirmaciones.
6. Confiar únicamente en el número y estado devueltos por el backoffice.

## Contratos

- `docs/BACKOFFICE_CONTRACT.md`: catálogo y menús.
- `docs/AUTH_ORDERS_API.md`: autenticación, direcciones, carrito, checkout, pedidos y pagos.

La adaptación de respuestas externas debe permanecer en `services/` y `lib/apiClient.ts`; las páginas y componentes no deben importar mocks.

## Cambiar de mocks a la API real

1. Confirmar los endpoints y formatos contra `docs/api-integration.md`.
2. Crear `.env.local` sin modificar `.env.example`.
3. Configurar:

```env
NEXT_PUBLIC_DATA_SOURCE=api
NEXT_PUBLIC_API_URL=https://api-del-backoffice.example/v1
NEXT_PUBLIC_API_TIMEOUT_MS=10000
NEXT_PUBLIC_API_RETRIES=2
```

4. Completar sólo las variables de endpoints confirmadas.
5. Ajustar aliases en `adapters/backofficeAdapter.ts`.
6. Implementar o revisar la rama `api` de cada archivo en `services/`.
7. Registrar el dominio real de imágenes/CDN en `next.config.mjs`.
8. Conectar el token mediante `configureApiClient`; el cliente agrega `Authorization` y limpia la sesión ante `401`.
9. Probar respuestas exitosas, vacías, `401`, `404`, `409`, `422`, timeout y servidor caído.
10. Ejecutar `npm run lint` y `npm run build`.

Para volver al modo offline o demostración:

```env
NEXT_PUBLIC_DATA_SOURCE=mock
```

No eliminar `mocks/`: es el origen previsto para desarrollo, demostraciones, pruebas y trabajo sin servidor.

## Seguridad de variables

Todo valor `NEXT_PUBLIC_*` queda visible en el navegador. Sólo puede contener URL base, rutas, tiempos de espera, nombre del proveedor y claves explícitamente públicas. Tokens privados, client secrets, claves de firma, credenciales de base de datos y secretos de webhooks deben existir exclusivamente en el backoffice.

## Contrato principal

- `docs/api-integration.md`: endpoints sugeridos, métodos, parámetros, respuestas, campos y errores.
- `adapters/backofficeAdapter.ts`: transformación entre respuestas externas y tipos internos.
