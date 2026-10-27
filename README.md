# Frontend — Sistema de Seguridad Inteligente Sisa

Aplicación web para la gestión de cámaras y la consulta de notificaciones de seguridad.
Incluye inicio de sesión, panel de control y recepción de notificaciones en tiempo real
mediante SignalR.

## Tecnologías

- Angular 17
- TypeScript 5.4
- RxJS 7.8
- SignalR (`@microsoft/signalr`)

## Requisitos

- Node.js y npm
- Backend de la aplicación disponible para las funciones que requieren acceso a datos

## Instalación y desarrollo

Desde esta carpeta, instala las dependencias con el archivo de bloqueo:

```bash
npm ci
```

Inicia el servidor de desarrollo:

```bash
npm start
```

La aplicación estará disponible en `http://localhost:4200/`.

## Compilación y pruebas

```bash
npm run build
npm run test:ci
```

La compilación genera sus archivos en `dist/`. Las pruebas se ejecutan con Karma en
Chrome Headless.

## Seguridad

No agregues contraseñas, tokens, claves ni archivos de configuración local al repositorio.
Si se necesita documentar una variable de entorno, usa únicamente valores de ejemplo no
secretos en `.env.example`.
