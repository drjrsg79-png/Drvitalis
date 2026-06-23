## Proyecto: Vitalis
App de salud sexual masculina con IA. Urólogo experto disponible 24/7.

## Stack
- Next.js 15, App Router, TypeScript
- Tailwind CSS v3
- Supabase (auth + base de datos)
- Stripe (suscripciones recurrentes)
- API de Anthropic — modelo claude-sonnet-4-20250514

## Estructura de carpetas
- src/app/ — rutas y páginas (App Router)
- src/app/api/vitalis/route.ts — llamada a Anthropic (solo servidor)
- src/app/api/stripe/checkout/route.ts — crear sesión de pago
- src/app/api/stripe/webhook/route.ts — recibir notificaciones de Stripe
- src/components/VitalisApp.tsx — componente principal de la app
- src/lib/supabase.ts — cliente de Supabase
- supabase/schema.sql — script SQL completo de la base de datos

## Variables de entorno
- ANTHROPIC_API_KEY — solo servidor, nunca exponer al cliente
- NEXT_PUBLIC_SUPABASE_URL — pública
- NEXT_PUBLIC_SUPABASE_ANON_KEY — pública
- STRIPE_SECRET_KEY — solo servidor
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY — pública
- STRIPE_WEBHOOK_SECRET — solo servidor
- NEXT_PUBLIC_URL — URL base de producción

## Tablas en Supabase
- users (id, email, nombre, pais, condicion, historial_medico)
- subscriptions (user_id, stripe_customer_id, status, plan, precio, moneda)
- chat_history (user_id, messages jsonb, created_at)
- adherencia (user_id, fecha, ejercicios_completados, dosis_tomadas)
- protocolo (user_id, medicamentos jsonb, ejercicios jsonb)

## Reglas de desarrollo
- Las llamadas a la API de Anthropic van SOLO desde /api/vitalis (nunca desde el cliente)
- Las llamadas a Stripe Secret Key van SOLO desde rutas /api
- Row Level Security activado en todas las tablas de Supabase
- No usar console.log en código que se suba a producción
- No usar tipos any en TypeScript salvo casos excepcionales

## Producto
- Nombre: Vitalis
- Precio: $599 MXN por mes
- Moneda Stripe: mxn
- Sin emojis en la interfaz del Dr. Vitalis
- El Dr. Vitalis responde siempre en español, tono médico profesional

## Pendientes para conectar Supabase con la suscripción real
- En src/app/api/stripe/webhook/route.ts, los TODO marcan dónde
  insertar/actualizar la tabla subscriptions cuando Stripe confirma el pago.
- Falta integrar Supabase Auth en el flujo de Onboarding (actualmente
  el perfil solo vive en el estado de React, no se persiste todavía).
