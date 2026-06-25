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

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type SesionUsuario = {
  user: {
    id: string;
    nombre: string | null;
    email: string;
    edad: number | null;
    pais: string | null;
    condicion: string | null;
  } | null;
  subscriptionStatus: string | null;
  active: boolean;
  messages: ChatMessage[];
};

// Crea o actualiza el usuario por correo y devuelve su id.
export async function upsertUsuario(perfil: UsuarioBasico): Promise<string> {
  const email = perfil.email.trim().toLowerCase();
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
  await asegurarSuscripcion(userId);
  await db.sql`
    update subscriptions set
      status                 = 'active',
      stripe_customer_id     = coalesce(${stripeCustomerId}, stripe_customer_id),
      stripe_subscription_id = coalesce(${stripeSubscriptionId}, stripe_subscription_id)
    where user_id = ${userId}
  `;
}

// Activa o reconcilia una suscripción usando el correo de Stripe como respaldo.
export async function activarSuscripcionPorEmail(
  email: string,
  stripeCustomerId: string | null,
  stripeSubscriptionId: string | null
): Promise<void> {
  const userId = await upsertUsuario({ email: email.trim().toLowerCase(), nombre: "" });
  await activarSuscripcion(userId, stripeCustomerId, stripeSubscriptionId);
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

// Recupera el perfil, estado de pago e historial más reciente por correo.
export async function obtenerSesionPorEmail(email: string): Promise<SesionUsuario> {
  const normalized = email.trim().toLowerCase();
  const filas = await db.sql<{
    id: string;
    nombre: string | null;
    email: string;
    edad: number | null;
    pais: string | null;
    condicion: string | null;
    status: string | null;
    messages: ChatMessage[] | null;
  }>`
    select
      users.id,
      users.nombre,
      users.email,
      users.edad,
      users.pais,
      users.condicion,
      subscriptions.status,
      chat_history.messages
    from users
    left join subscriptions on subscriptions.user_id = users.id
    left join lateral (
      select messages
      from chat_history
      where chat_history.user_id = users.id
      order by updated_at desc
      limit 1
    ) chat_history on true
    where lower(users.email) = ${normalized}
    limit 1
  `;

  const row = filas[0];
  if (!row) {
    return { user: null, subscriptionStatus: null, active: false, messages: [] };
  }

  return {
    user: {
      id: row.id,
      nombre: row.nombre,
      email: row.email,
      edad: row.edad,
      pais: row.pais,
      condicion: row.condicion,
    },
    subscriptionStatus: row.status,
    active: row.status === "active",
    messages: Array.isArray(row.messages) ? row.messages : [],
  };
}

// Guarda el historial más reciente del usuario activo.
export async function guardarHistorialPorEmail(email: string, messages: ChatMessage[]): Promise<void> {
  const session = await obtenerSesionPorEmail(email);
  if (!session.user || !session.active) return;

  await db.sql`
    insert into chat_history (user_id, messages)
    values (${session.user.id}, ${JSON.stringify(messages)}::jsonb)
    on conflict (user_id, sesion_date) do update set
      messages = excluded.messages,
      updated_at = now()
  `;
}
