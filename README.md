# VitalWeb

Frontend comercial de Vital Food construido con Next.js, TypeScript y Tailwind. Actualmente usa servicios mockeados; no contiene backoffice ni base de datos.

## Desarrollo

```bash
npm install
npm run dev
npm test      # Vitest: servicios, adaptador y reglas de carrito
```

Copiar `.env.example` como `.env.local`. Para el modo actual:

```env
NEXT_PUBLIC_DATA_SOURCE=mock
NEXT_PUBLIC_API_URL=
```

## Cómo se elige el origen de cada dato

`NEXT_PUBLIC_DATA_SOURCE=api` no obliga a que todo exista en el backoffice. Cada servicio
pregunta por su endpoint con `useApiFor()`: si está configurado usa la API, y si no,
responde con el mock correspondiente. Así se puede ir conectando capacidad por capacidad
sin dejar pantallas rotas.

Para activar una capacidad alcanza con completar su variable en `.env.local`. La rama API
ya está implementada en todos los servicios; no hay que tocar páginas ni componentes.

## Simulado mientras falte su endpoint

- Autenticación, usuarios y direcciones.
- Cupones, promociones y favoritos.
- Zonas, envío, cotización y franjas horarias.
- Pedidos y estados.
- Configuración del comercio y recomendaciones.

No deben ingresarse datos reales de tarjeta, cuenta bancaria o credenciales. Ninguna respuesta mock acredita un pago verdadero.

## Pagos: simulados a propósito

El cobro real es lo único que todavía **no** está conectado. Mientras
`NEXT_PUBLIC_API_PAYMENT_CREATE_ENDPOINT` esté vacío, `paymentService.isSimulated` es
`true`: el checkout deja elegir el resultado a probar, la pantalla de resultado avisa que
no hubo cobro y `PaymentTransaction.isSimulation` queda en `true`.

Para conectarlo:

1. Mantener claves secretas únicamente en el backoffice. Nunca usar secretos en variables `NEXT_PUBLIC_*`.
2. Configurar `NEXT_PUBLIC_PAYMENT_PROVIDER` y, sólo si el proveedor lo requiere, su clave pública.
3. Completar `NEXT_PUBLIC_API_PAYMENT_CREATE_ENDPOINT` y `NEXT_PUBLIC_API_PAYMENT_STATUS_ENDPOINT`.
4. El backoffice crea la intención, verifica webhooks y confirma el pago. El navegador no decide el estado definitivo ni envía el importe: `paymentService.create` sólo manda `orderId`, `methodId` y `returnUrl`.
5. Si el proveedor devuelve `redirectUrl`, el checkout redirige solo.

## Cupones, favoritos y pedidos

Ya implementados en `services/`; sólo esperan su endpoint:

- **Cupones**: `couponService.validate` envía código, productos, cantidades, usuario, zona, fecha y modalidad. El descuento definitivo es el que devuelve el backoffice.
- **Favoritos**: `favoriteService` opera contra la cuenta cuando hay sesión y endpoint; al iniciar sesión fusiona (unión) los favoritos locales y limpia el `localStorage`.
- **Pedidos**: `orderService.create` manda `Idempotency-Key`; `repeat()` recotiza contra el catálogo vigente y devuelve productos descartados y diferencias de precio antes de tocar el carrito.

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

4. Completar sólo las variables de endpoints confirmadas. Las que queden vacías siguen usando mocks.
5. Ajustar aliases en `adapters/backofficeAdapter.ts` si los nombres de campo difieren.
6. Revisar la rama `api` del servicio correspondiente en `services/`.
7. Autorizar el host de imágenes: el de `NEXT_PUBLIC_API_URL` se agrega solo; para un CDN aparte usar `NEXT_PUBLIC_IMAGE_HOSTS=cdn.ejemplo.com,otro.ejemplo.com`.
8. Conectar el token mediante `configureApiClient`; el cliente agrega `Authorization` y limpia la sesión ante `401`.
9. Probar respuestas exitosas, vacías, `401`, `404`, `409`, `422`, timeout y servidor caído.
10. Ejecutar `npm run lint`, `npm test` y `npm run build`.

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
