## Proyecto: Vitalis
App de salud sexual masculina con IA. Urólogo experto disponible 24/7.

## Stack
- Next.js 15, App Router, TypeScript
- Tailwind CSS v3
- Netlify Database (Postgres gestionado) con Drizzle ORM — almacenamiento
- Netlify Identity — autenticación (registro / inicio de sesión)
- Stripe (suscripciones recurrentes)
- API de Anthropic vía Netlify AI Gateway — modelo claude-sonnet-4-5

## Estructura de carpetas
- src/app/ — rutas y páginas (App Router)
- src/app/api/vitalis/route.ts — llamada a Anthropic (solo servidor)
- src/app/api/stripe/checkout/route.ts — crear sesión de pago
- src/app/api/stripe/webhook/route.ts — recibir notificaciones de Stripe y persistir la suscripción
- src/app/api/account/route.ts — leer/guardar el perfil y consultar la suscripción
- src/components/VitalisApp.tsx — componente principal de la app
- db/schema.ts — esquema de la base de datos (fuente de verdad)
- db/index.ts — cliente de Drizzle sobre Netlify Database
- drizzle.config.ts — configuración de migraciones
- netlify/database/migrations/ — migraciones aplicadas automáticamente por Netlify

## Variables de entorno
- ANTHROPIC_API_KEY — solo servidor, nunca exponer al cliente
- NETLIFY_DATABASE_URL — la inyecta Netlify automáticamente (no configurar a mano)
- STRIPE_SECRET_KEY — solo servidor
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY — pública
- STRIPE_WEBHOOK_SECRET — solo servidor
- NEXT_PUBLIC_URL — URL base de producción

## Tablas en Netlify Database (db/schema.ts)
Las tablas se enlazan por el email del paciente (dato común entre Netlify Identity y Stripe).
- users (email, identity_id, nombre, edad, pais, condicion, onboarding_completo)
- subscriptions (email, stripe_customer_id, stripe_subscription_id, status, plan, precio, moneda)
- chat_history (email, messages jsonb, created_at)
- adherencia (email, fecha, ejercicios_completados, dosis_tomadas)
- protocolo (email, medicamentos jsonb, ejercicios jsonb)

## Reglas de desarrollo
- Las llamadas a la API de Anthropic van SOLO desde /api/vitalis (nunca desde el cliente)
- Las llamadas a Stripe Secret Key van SOLO desde rutas /api
- El almacenamiento usa Netlify Database; los cambios de esquema requieren una
  migración generada con `npx drizzle-kit generate` (nunca aplicar migraciones a mano)
- La autenticación usa Netlify Identity (@netlify/identity); las mutaciones de
  sesión (login/signup/logout) corren en el navegador
- No usar console.log en código que se suba a producción
- No usar tipos any en TypeScript salvo casos excepcionales

## Producto
- Nombre: Vitalis
- Precio: $599 MXN por mes
- Moneda Stripe: mxn
- Sin emojis en la interfaz del Dr. Vitalis
- El Dr. Vitalis responde siempre en español, tono médico profesional

## Almacenamiento y autenticación (conectados)
- El webhook de Stripe (src/app/api/stripe/webhook/route.ts) inserta/actualiza la
  tabla subscriptions cuando Stripe confirma el pago, lo cancela o falla el cobro.
- El onboarding persiste el perfil del paciente en Netlify Database vía
  /api/account; ya no vive solo en el estado de React.
- Netlify Identity gestiona el registro y el inicio de sesión. Un usuario con
  suscripción activa es reconocido en visitas futuras sin volver a pagar.
