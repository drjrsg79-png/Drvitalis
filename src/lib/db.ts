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
  tiempoProblema?: string;
  objetivo?: string;
  medicamentos?: string;
  alergias?: string;
  presion?: string;
  diabetes?: string;
  cardio?: string;
};

// Crea o actualiza el usuario por correo y devuelve su id.
export async function upsertUsuario(perfil: UsuarioBasico): Promise<string> {
  const edad = perfil.edad && /^\d+$/.test(perfil.edad.trim())
    ? parseInt(perfil.edad.trim(), 10)
    : null;

  const filas = await db.sql<{ id: string }>`
    insert into users (
      email,
      nombre,
      edad,
      pais,
      condicion,
      tiempo_problema,
      objetivo,
      medicamentos,
      alergias,
      presion,
      diabetes,
      cardio,
      onboarding_completo
    )
    values (
      ${perfil.email},
      ${perfil.nombre || null},
      ${edad},
      ${perfil.pais || null},
      ${perfil.condicion || null},
      ${perfil.tiempoProblema || null},
      ${perfil.objetivo || null},
      ${perfil.medicamentos || null},
      ${perfil.alergias || null},
      ${perfil.presion || null},
      ${perfil.diabetes || null},
      ${perfil.cardio || null},
      true
    )
    on conflict (email) do update set
      nombre    = coalesce(excluded.nombre, users.nombre),
      edad      = coalesce(excluded.edad, users.edad),
      pais      = coalesce(excluded.pais, users.pais),
      condicion = coalesce(excluded.condicion, users.condicion),
      tiempo_problema = coalesce(excluded.tiempo_problema, users.tiempo_problema),
      objetivo = coalesce(excluded.objetivo, users.objetivo),
      medicamentos = coalesce(excluded.medicamentos, users.medicamentos),
      alergias = coalesce(excluded.alergias, users.alergias),
      presion = coalesce(excluded.presion, users.presion),
      diabetes = coalesce(excluded.diabetes, users.diabetes),
      cardio = coalesce(excluded.cardio, users.cardio),
      onboarding_completo = true
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
