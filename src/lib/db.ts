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

// ----------------------------------------------------------------
// AUTENTICACIÓN — magic link y sesiones
// ----------------------------------------------------------------

export type EstadoUsuario = {
  id: string;
  email: string;
  nombre: string | null;
  edad: number | null;
  pais: string | null;
  condicion: string | null;
  suscripcionActiva: boolean;
};

// Crea (o reutiliza) el usuario por correo y devuelve su id. A diferencia de
// upsertUsuario, esta función no requiere perfil médico: se usa para el flujo
// de login, donde solo se conoce el correo.
export async function obtenerOcrearUsuarioPorEmail(email: string): Promise<string> {
  const filas = await db.sql<{ id: string }>`
    insert into users (email)
    values (${email})
    on conflict (email) do update set email = excluded.email
    returning id
  `;
  return filas[0].id;
}

// Genera un token de acceso de un solo uso, válido por 15 minutos.
export async function crearTokenAcceso(email: string, token: string): Promise<void> {
  await db.sql`
    insert into auth_tokens (email, token, expires_at)
    values (${email}, ${token}, now() + interval '15 minutes')
  `;
}

// Evita spam de solicitudes: si ya se generó un token para este correo en los
// últimos 60 segundos, no se permite generar otro de inmediato.
export async function solicitudRecienteParaCorreo(email: string): Promise<boolean> {
  const filas = await db.sql<{ id: string }>`
    select id from auth_tokens
    where email = ${email}
      and created_at > now() - interval '60 seconds'
    limit 1
  `;
  return filas.length > 0;
}

// Valida un token de acceso: debe existir, no estar usado y no haber expirado.
// Si es válido, lo marca como usado (un solo uso) y devuelve el correo asociado.
export async function consumirTokenAcceso(token: string): Promise<string | null> {
  const filas = await db.sql<{ email: string }>`
    update auth_tokens set used = true
    where token = ${token}
      and used = false
      and expires_at > now()
    returning email
  `;
  return filas[0]?.email ?? null;
}

// Crea una sesión de 30 días para el usuario y devuelve el token de sesión.
export async function crearSesion(userId: string, sessionToken: string): Promise<void> {
  await db.sql`
    insert into sessions (user_id, token, expires_at)
    values (${userId}, ${sessionToken}, now() + interval '30 days')
  `;
}

// Elimina una sesión (cerrar sesión).
export async function eliminarSesion(sessionToken: string): Promise<void> {
  await db.sql`
    delete from sessions where token = ${sessionToken}
  `;
}

// A partir del token de sesión (cookie), devuelve el perfil del usuario y si
// su suscripción está activa. Devuelve null si la sesión no existe o expiró.
export async function obtenerUsuarioPorSesion(sessionToken: string): Promise<EstadoUsuario | null> {
  const filas = await db.sql<{
    id: string;
    email: string;
    nombre: string | null;
    edad: number | null;
    pais: string | null;
    condicion: string | null;
    status: string | null;
  }>`
    select u.id, u.email, u.nombre, u.edad, u.pais, u.condicion, s.status
    from sessions sess
    join users u on u.id = sess.user_id
    left join subscriptions s on s.user_id = u.id
    where sess.token = ${sessionToken}
      and sess.expires_at > now()
  `;
  if (filas.length === 0) return null;
  const fila = filas[0];
  return {
    id: fila.id,
    email: fila.email,
    nombre: fila.nombre,
    edad: fila.edad,
    pais: fila.pais,
    condicion: fila.condicion,
    suscripcionActiva: fila.status === "active",
  };
}

// Obtiene el stripe_customer_id del usuario a partir de su sesión activa.
// Se usa para abrir el Customer Portal de Stripe (administrar suscripción).
// Devuelve null si la sesión no existe, expiró, o el usuario nunca pagó
// (y por tanto no tiene un cliente de Stripe asociado todavía).
export async function obtenerStripeCustomerIdPorSesion(sessionToken: string): Promise<string | null> {
  const filas = await db.sql<{ stripe_customer_id: string | null }>`
    select s.stripe_customer_id
    from sessions sess
    join users u on u.id = sess.user_id
    left join subscriptions s on s.user_id = u.id
    where sess.token = ${sessionToken}
      and sess.expires_at > now()
  `;
  return filas[0]?.stripe_customer_id ?? null;
}
