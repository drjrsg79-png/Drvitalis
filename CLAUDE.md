## Proyecto: Vitalis
App de salud sexual masculina con IA. Urólogo experto disponible 24/7.

## Stack
- Next.js 15, App Router, TypeScript
- Tailwind CSS v3
- Netlify Database (Postgres administrado) — paquete @netlify/database
- Stripe (suscripciones recurrentes)
- API de Anthropic vía Netlify AI Gateway — modelo claude-sonnet-4-5

## Estructura de carpetas
- src/app/ — rutas y páginas (App Router)
- src/app/api/vitalis/route.ts — llamada a Anthropic (solo servidor)
- src/app/api/perfil/route.ts — guardar el perfil del paciente
- src/app/api/stripe/checkout/route.ts — crear sesión de pago
- src/app/api/stripe/webhook/route.ts — recibir notificaciones de Stripe
- src/components/VitalisApp.tsx — componente principal de la app
- src/lib/db.ts — cliente de Netlify Database y helpers
- netlify/database/migrations/ — migraciones SQL (Netlify las aplica solo en cada deploy)

## Variables de entorno
- ANTHROPIC_API_KEY — solo servidor, nunca exponer al cliente
- NETLIFY_DATABASE_URL — la inyecta Netlify automáticamente; no hay que configurarla
- STRIPE_SECRET_KEY — solo servidor
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY — pública
- STRIPE_WEBHOOK_SECRET — solo servidor
- NEXT_PUBLIC_URL — URL base de producción

## Tablas en Netlify Database
- users (id, email, nombre, edad, pais, condicion, historial_medico)
- subscriptions (user_id, stripe_customer_id, status, plan, precio, moneda)
- chat_history (user_id, messages jsonb, created_at)
- adherencia (user_id, fecha, ejercicios_completados, dosis_tomadas)
- protocolo (user_id, medicamentos jsonb, ejercicios jsonb)

## Reglas de desarrollo
- Las llamadas a la API de Anthropic van SOLO desde /api/vitalis (nunca desde el cliente)
- Las llamadas a Stripe Secret Key van SOLO desde rutas /api
- Toda persistencia usa Netlify Database; los cambios de esquema van como
  migración nueva en netlify/database/migrations/ (nunca editar una ya aplicada)
- El control de acceso a los datos vive en las rutas /api del servidor
- No usar console.log en código que se suba a producción
- No usar tipos any en TypeScript salvo casos excepcionales

## Producto
- Nombre: Vitalis
- Precio: $599 MXN por mes
- Moneda Stripe: mxn
- Sin emojis en la interfaz del Dr. Vitalis
- El Dr. Vitalis responde siempre en español, tono médico profesional

## Pendientes
- El perfil del paciente ya se persiste al completar el onboarding
  (src/app/api/perfil/route.ts) y la suscripción se registra cuando Stripe
  confirma el pago (src/app/api/stripe/webhook/route.ts).
- Falta un login real: hoy el paciente se identifica solo por su email.
  Conviene añadir autenticación antes de exponer datos médicos por usuario.
