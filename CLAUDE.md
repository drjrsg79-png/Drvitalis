## Proyecto: Vitalis
App de salud sexual masculina con IA. Urólogo experto disponible 24/7.

## Stack
- Next.js 15, App Router, TypeScript
- Tailwind CSS v3
- Netlify Database (Postgres administrado) para persistencia
- Mercado Pago México (Checkout Pro y suscripciones/preapproval)
- API de Anthropic vía Netlify AI Gateway — modelo claude-sonnet-4-5

## Estructura de carpetas
- src/app/ — rutas y páginas (App Router)
- src/app/api/vitalis/route.ts — llamada a Anthropic (solo servidor)
- src/app/api/mercadopago/checkout/route.ts — crear pagos y suscripciones
- src/app/api/mercadopago/webhook/route.ts — recibir notificaciones firmadas
- src/app/api/mercadopago/subscription/route.ts — cancelar Vitalis Pro
- src/components/VitalisApp.tsx — componente principal de la app
- src/lib/db.ts — cliente de Netlify Database y helpers de consulta
- netlify/database/migrations/ — esquema SQL (Netlify lo aplica en el deploy)

## Variables de entorno
- ANTHROPIC_API_KEY — solo servidor, nunca exponer al cliente
- MERCADOPAGO_ACCESS_TOKEN — solo servidor
- MERCADOPAGO_WEBHOOK_SECRET — solo servidor
- NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY — pública
- NEXT_PUBLIC_URL — URL base de producción
- La base de datos no requiere variables: Netlify la configura sola.

## Tablas en la base de datos
- users (id, email, nombre, pais, condicion, historial_medico)
- subscriptions (user_id, status, plan, precio, moneda, datos de Mercado Pago, access_until)
- chat_history (user_id, messages jsonb, created_at)
- adherencia (user_id, fecha, ejercicios_completados, dosis_tomadas)
- protocolo (user_id, medicamentos jsonb, ejercicios jsonb)

## Reglas de desarrollo
- Las llamadas a la API de Anthropic van SOLO desde /api/vitalis (nunca desde el cliente)
- Las llamadas con MERCADOPAGO_ACCESS_TOKEN van SOLO desde rutas /api
- Todo cambio de esquema se hace con una nueva migración en netlify/database/migrations
- No usar console.log en código que se suba a producción
- No usar tipos any en TypeScript salvo casos excepcionales

## Producto
- Nombre: Vitalis
- Vitalis 7 días: $99 MXN, pago único, sin renovación automática
- Vitalis Pro: $300 MXN por mes
- Moneda Mercado Pago: MXN
- Sin emojis en la interfaz del Dr. Vitalis
- El Dr. Vitalis responde siempre en español, tono médico profesional

## Pendientes
- La persistencia ya está conectada: el checkout guarda el perfil y reserva
  el acceso, y el webhook activa o cancela los derechos según Mercado Pago.
- Falta autenticación de usuarios (login). Hoy el perfil se identifica por
  correo; cuando se agregue auth, ligar cada fila a la sesión del usuario.
- chat_history, adherencia y protocolo existen como tablas listas; aún no
  se escriben desde la app.
