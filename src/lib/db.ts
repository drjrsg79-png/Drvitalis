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

export type SubscriptionStatus = {
  isPro: boolean;
  status: string;
  plan: string;
  renewalDate: string | null;
};

export type StripeSubscriptionRecord = {
  email: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  status: string;
  plan?: string | null;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
};

export function normalizeEmail(email: string | null | undefined): string {
  return String(email || "").trim().toLowerCase();
}

// Crea o actualiza el usuario por correo y devuelve su id.
export async function upsertUsuario(perfil: UsuarioBasico): Promise<string> {
  const email = normalizeEmail(perfil.email);
  if (!email) {
    throw new Error("Email requerido");
  }

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
  stripeSubscriptionId: string | null
): Promise<void> {
  await db.sql`
    update subscriptions set
      status                 = 'active',
      stripe_customer_id     = coalesce(${stripeCustomerId}, stripe_customer_id),
      stripe_subscription_id = coalesce(${stripeSubscriptionId}, stripe_subscription_id)
    where user_id = ${userId}
  `;
}

export async function upsertStripeSubscription(record: StripeSubscriptionRecord): Promise<void> {
  const email = normalizeEmail(record.email);
  if (!email) {
    throw new Error("Email requerido para vincular suscripción");
  }

  const userId = await upsertUsuario({ email, nombre: "" });
  await db.sql`
    insert into subscriptions (
      user_id,
      stripe_customer_id,
      stripe_subscription_id,
      status,
      plan,
      current_period_start,
      current_period_end,
      cancel_at_period_end
    )
    values (
      ${userId},
      ${record.stripeCustomerId},
      ${record.stripeSubscriptionId},
      ${record.status},
      ${record.plan || "pro"},
      ${record.currentPeriodStart || null},
      ${record.currentPeriodEnd || null},
      ${record.cancelAtPeriodEnd || false}
    )
    on conflict (user_id) do update set
      stripe_customer_id     = coalesce(excluded.stripe_customer_id, subscriptions.stripe_customer_id),
      stripe_subscription_id = coalesce(excluded.stripe_subscription_id, subscriptions.stripe_subscription_id),
      status                 = excluded.status,
      plan                   = excluded.plan,
      current_period_start   = excluded.current_period_start,
      current_period_end     = excluded.current_period_end,
      cancel_at_period_end   = excluded.cancel_at_period_end
  `;
}

// Actualiza el estado de la suscripción por su id de Stripe (cancelaciones, etc.).
export async function actualizarEstadoPorSubscriptionId(
  stripeSubscriptionId: string,
  status: string,
  currentPeriodEnd?: Date | null
): Promise<void> {
  await db.sql`
    update subscriptions set
      status = ${status},
      current_period_end = coalesce(${currentPeriodEnd || null}, current_period_end)
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

export async function checkSubscriptionStatus(email: string): Promise<SubscriptionStatus> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return { isPro: false, status: "missing_email", plan: "free", renewalDate: null };
  }

  const filas = await db.sql<{
    status: string | null;
    plan: string | null;
    current_period_end: Date | string | null;
  }>`
    select s.status, s.plan, s.current_period_end
    from users u
    left join subscriptions s on s.user_id = u.id
    where lower(trim(u.email)) = ${normalizedEmail}
    order by s.updated_at desc nulls last
    limit 1
  `;

  const sub = filas[0];
  const status = sub?.status || "inactive";
  const isPro = status === "active" || status === "trialing";
  const renewalDate = sub?.current_period_end
    ? new Date(sub.current_period_end).toISOString()
    : null;

  return {
    isPro,
    status,
    plan: isPro ? sub?.plan || "pro" : "free",
    renewalDate,
  };
}
