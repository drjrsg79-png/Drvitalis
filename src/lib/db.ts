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

export async function obtenerAccesoPorEmail(email: string): Promise<{
  activo: boolean;
  userId: string | null;
  nombre: string | null;
}> {
  const filas = await db.sql<{ id: string; nombre: string | null; status: string | null }>`
    select users.id, users.nombre, subscriptions.status
    from users
    left join subscriptions on subscriptions.user_id = users.id
    where users.email = ${normalizarEmail(email)}
    limit 1
  `;
  const fila = filas[0];
  if (!fila) return { activo: false, userId: null, nombre: null };

  return {
    activo: ["active", "trialing"].includes(fila.status || ""),
    userId: fila.id,
    nombre: fila.nombre,
  };
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
    insert into subscriptions (user_id, status, stripe_customer_id, stripe_subscription_id)
    values (${userId}, 'active', ${stripeCustomerId}, ${stripeSubscriptionId})
    on conflict (user_id) do update set
      status                 = 'active',
      stripe_customer_id     = coalesce(excluded.stripe_customer_id, subscriptions.stripe_customer_id),
      stripe_subscription_id = coalesce(excluded.stripe_subscription_id, subscriptions.stripe_subscription_id)
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
