# VitalWeb en Android Studio

La aplicacion nativa pertenece exclusivamente a VitalWeb y se genera con Capacitor.
El backoffice no necesita ni debe contener Capacitor, `android/` o `ios/`.

## Requisitos

- Android Studio con Android SDK 36 instalado.
- JDK 21 (el runtime incluido en Android Studio es suficiente).
- Un emulador con API 24 o posterior, o un telefono con depuracion USB habilitada.

## Preparar los recursos web

Desde la raiz de VitalWeb:

```powershell
npm install
npm run build:mobile
npm run cap:sync
```

El build movil consume la API publica de VitalWeb por HTTPS. Mercado Pago permanece
simulado hasta que se configuren explicitamente sus endpoints y credenciales en el
backend; ninguna clave privada debe agregarse a variables `NEXT_PUBLIC_*`.

## Abrir y ejecutar

```powershell
npm run cap:android
```

En Android Studio, esperar que termine Gradle Sync, elegir un emulador o dispositivo y
presionar Run. El modulo ejecutable es `app` y el application id es
`com.vitalfood.viandas`.

Cada cambio de interfaz requiere repetir `npm run build:mobile` y `npm run cap:sync`
antes de volver a ejecutar la aplicacion nativa.
