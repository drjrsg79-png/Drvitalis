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

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type SesionUsuario = {
  perfil: {
    nombre: string;
    email: string;
    edad: string;
    pais: string;
    condicion: string;
  };
  subscriptionStatus: string;
  hasActiveSubscription: boolean;
  messages: ChatMessage[];
};

const normalizarEmail = (email: string) => email.trim().toLowerCase();

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

export async function obtenerSesionPorEmail(email: string): Promise<SesionUsuario | null> {
  const filas = await db.sql<{
    id: string;
    email: string;
    nombre: string | null;
    edad: number | null;
    pais: string | null;
    condicion: string | null;
    subscription_status: string | null;
    messages: ChatMessage[] | null;
  }>`
    select
      u.id,
      u.email,
      u.nombre,
      u.edad,
      u.pais,
      u.condicion,
      s.status as subscription_status,
      h.messages
    from users u
    left join subscriptions s on s.user_id = u.id
    left join lateral (
      select messages
      from chat_history
      where user_id = u.id
      order by updated_at desc
      limit 1
    ) h on true
    where u.email = ${normalizarEmail(email)}
    limit 1
  `;

  const row = filas[0];
  if (!row) return null;

  const subscriptionStatus = row.subscription_status || "inactive";
  return {
    perfil: {
      nombre: row.nombre || "",
      email: row.email,
      edad: row.edad ? String(row.edad) : "",
      pais: row.pais || "",
      condicion: row.condicion || "",
    },
    subscriptionStatus,
    hasActiveSubscription: subscriptionStatus === "active",
    messages: Array.isArray(row.messages) ? row.messages : [],
  };
}

export async function guardarHistorialChat(email: string, messages: ChatMessage[]): Promise<void> {
  const filas = await db.sql<{ id: string }>`
    select id
    from users
    where email = ${normalizarEmail(email)}
    limit 1
  `;

  const userId = filas[0]?.id;
  if (!userId) return;

  await db.sql`
    insert into chat_history (user_id, messages)
    values (${userId}, ${JSON.stringify(messages)}::jsonb)
    on conflict (user_id, sesion_date) do update set
      messages = excluded.messages
  `;
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
