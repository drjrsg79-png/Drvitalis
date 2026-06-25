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

export type EstadoUsuario = {
  id: string;
  nombre: string | null;
  email: string;
  edad: number | null;
  pais: string | null;
  condicion: string | null;
  subscription_status: string | null;
  chat_messages: ChatMessage[] | null;
};

// Crea o actualiza el usuario por correo y devuelve su id.
export async function upsertUsuario(perfil: UsuarioBasico): Promise<string> {
  const edad = perfil.edad && /^\d+$/.test(perfil.edad.trim())
    ? parseInt(perfil.edad.trim(), 10)
    : null;

  const filas = await db.sql<{ id: string }>`
    insert into users (email, nombre, edad, pais, condicion)
    values (${perfil.email}, ${perfil.nombre || null}, ${edad}, ${perfil.pais || null}, ${perfil.condicion || null})
    on conflict (email) do update set
      nombre    = coalesce(excluded.nombre, users.nombre),
      edad      = coalesce(excluded.edad, users.edad),
      pais      = coalesce(excluded.pais, users.pais),
      condicion = coalesce(excluded.condicion, users.condicion)
    returning id
  `;
  return filas[0].id;
}

export async function obtenerEstadoPorEmail(email: string): Promise<EstadoUsuario | null> {
  const filas = await db.sql<EstadoUsuario>`
    select
      users.id,
      users.nombre,
      users.email,
      users.edad,
      users.pais,
      users.condicion,
      subscriptions.status as subscription_status,
      chat_history.messages as chat_messages
    from users
    left join subscriptions on subscriptions.user_id = users.id
    left join lateral (
      select messages
      from chat_history
      where chat_history.user_id = users.id
      order by updated_at desc
      limit 1
    ) chat_history on true
    where lower(users.email) = lower(${email})
    limit 1
  `;

  return filas[0] || null;
}

export async function obtenerEstadoPorUserId(userId: string): Promise<EstadoUsuario | null> {
  const filas = await db.sql<EstadoUsuario>`
    select
      users.id,
      users.nombre,
      users.email,
      users.edad,
      users.pais,
      users.condicion,
      subscriptions.status as subscription_status,
      chat_history.messages as chat_messages
    from users
    left join subscriptions on subscriptions.user_id = users.id
    left join lateral (
      select messages
      from chat_history
      where chat_history.user_id = users.id
      order by updated_at desc
      limit 1
    ) chat_history on true
    where users.id = ${userId}
    limit 1
  `;

  return filas[0] || null;
}

export async function guardarHistorial(email: string, messages: ChatMessage[]): Promise<void> {
  const estado = await obtenerEstadoPorEmail(email);
  if (!estado) return;

  await db.sql`
    with latest as (
      select id
      from chat_history
      where user_id = ${estado.id}
      order by updated_at desc
      limit 1
    ),
    updated as (
      update chat_history
      set messages = ${JSON.stringify(messages)}::jsonb
      where id in (select id from latest)
      returning id
    )
    insert into chat_history (user_id, messages)
    select ${estado.id}, ${JSON.stringify(messages)}::jsonb
    where not exists (select 1 from updated)
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
