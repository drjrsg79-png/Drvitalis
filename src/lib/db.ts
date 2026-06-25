import { getDatabase } from "@netlify/database";

// Cliente de Netlify Database (Postgres administrado).
// La conexión se configura sola en Netlify; no requiere variables ni llaves.
// El esquema vive en netlify/database/migrations y se aplica en cada deploy.
export const db = getDatabase();

export type UsuarioBasico = {
  nombre: string;
  email: string;
  edad?: string;
  pais?: string;
  condicion?: string;
};

export type ProAccess = {
  isPro: true;
  email: string;
  status: string;
  plan: string;
  renewalDate: string | null;
} | {
  isPro: false;
};

export function normalizarEmail(email: string): string {
  return String(email || "").trim().toLowerCase();
}

// Crea o actualiza el usuario por correo y devuelve su id.
export async function upsertUsuario(perfil: UsuarioBasico): Promise<string> {
  const email = normalizarEmail(perfil.email);
  const edad = perfil.edad && /^\d+$/.test(perfil.edad.trim())
    ? parseInt(perfil.edad.trim(), 10)
    : null;

  const filas = await db.sql<{ id: string }>`
    insert into users (email, nombre, edad, pais, condicion)
    values (${email}, ${perfil.nombre || null}, ${edad}, ${perfil.pais || null}, ${perfil.condicion || null})
    on conflict (email) do update set
      nombre    = coalesce(excluded.nombre, users.nombre),
      edad      = coalesce(excluded.edad, users.edad),
      pais      = coalesce(excluded.pais, users.pais),
      condicion = coalesce(excluded.condicion, users.condicion)
    returning id
  `;
  return filas[0].id;
}

// Garantiza una fila de suscripción para el usuario (estado inicial 'inactive').
export async function asegurarSuscripcion(userId: string): Promise<void> {
  await db.sql`
    insert into subscriptions (user_id)
    values (${userId})
    on conflict (user_id) do nothing
  `;
}

// Marca la suscripción como activa al confirmarse el pago en Stripe.
export async function activarSuscripcion(
  userId: string,
  stripeCustomerId: string | null,
  stripeSubscriptionId: string | null,
  status = "active",
  currentPeriodEnd?: Date | null
): Promise<void> {
  await db.sql`
    update subscriptions set
      status                 = ${status},
      stripe_customer_id     = coalesce(${stripeCustomerId}, stripe_customer_id),
      stripe_subscription_id = coalesce(${stripeSubscriptionId}, stripe_subscription_id),
      current_period_end     = coalesce(${currentPeriodEnd || null}, current_period_end)
    where user_id = ${userId}
  `;
}

export async function upsertSuscripcionActivaPorEmail(params: {
  email: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  status: string;
  plan?: string | null;
  currentPeriodEnd?: Date | null;
}): Promise<void> {
  const email = normalizarEmail(params.email);
  const userId = await upsertUsuario({ email, nombre: "" });
  await db.sql`
    insert into subscriptions (
      user_id,
      stripe_customer_id,
      stripe_subscription_id,
      status,
      plan,
      current_period_end
    )
    values (
      ${userId},
      ${params.stripeCustomerId},
      ${params.stripeSubscriptionId},
      ${params.status},
      ${params.plan || "pro"},
      ${params.currentPeriodEnd || null}
    )
    on conflict (user_id) do update set
      stripe_customer_id     = coalesce(excluded.stripe_customer_id, subscriptions.stripe_customer_id),
      stripe_subscription_id = coalesce(excluded.stripe_subscription_id, subscriptions.stripe_subscription_id),
      status                 = excluded.status,
      plan                   = coalesce(excluded.plan, subscriptions.plan),
      current_period_end     = coalesce(excluded.current_period_end, subscriptions.current_period_end)
  `;
}

export async function verifyProAccess(email: string): Promise<ProAccess> {
  const normalizedEmail = normalizarEmail(email);
  if (!normalizedEmail) return { isPro: false };

  const filas = await db.sql<{
    email: string;
    status: string;
    plan: string | null;
    renewal_date: string | null;
  }>`
    select
      users.email,
      subscriptions.status,
      subscriptions.plan,
      subscriptions.current_period_end::text as renewal_date
    from users
    inner join subscriptions on subscriptions.user_id = users.id
    where lower(trim(users.email)) = ${normalizedEmail}
    order by subscriptions.updated_at desc
    limit 1
  `;

  const subscription = filas[0];
  if (!subscription || !["active", "trialing"].includes(subscription.status)) {
    return { isPro: false };
  }

  return {
    isPro: true,
    email: normalizedEmail,
    status: subscription.status,
    plan: subscription.plan || "pro",
    renewalDate: subscription.renewal_date,
  };
}

// Actualiza el estado de la suscripción por su id de Stripe (cancelaciones, etc.).
export async function actualizarEstadoPorSubscriptionId(
  stripeSubscriptionId: string,
  status: string
): Promise<void> {
  await db.sql`
    update subscriptions set status = ${status}
    where stripe_subscription_id = ${stripeSubscriptionId}
  `;
}

// Marca un cobro recurrente fallido por el id de cliente de Stripe.
export async function marcarPorCustomerId(
  stripeCustomerId: string,
  status: string
): Promise<void> {
  await db.sql`
    update subscriptions set status = ${status}
    where stripe_customer_id = ${stripeCustomerId}
  `;
}
