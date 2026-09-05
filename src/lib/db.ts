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

export async function activarAccesoSieteDias(
  userId: string,
  paymentId: string,
  payerId: string | null
): Promise<void> {
  await db.sql`
    insert into subscriptions (
      user_id, status, plan, precio, moneda, mercadopago_payment_id,
      mercadopago_payer_id, access_until
    )
    values (
      ${userId}, 'active', '7_dias', 99, 'mxn', ${paymentId},
      ${payerId}, now() + interval '7 days'
    )
    on conflict (user_id) do update set
      status = 'active',
      plan = '7_dias',
      precio = 99,
      moneda = 'mxn',
      mercadopago_payment_id = excluded.mercadopago_payment_id,
      mercadopago_payer_id = coalesce(excluded.mercadopago_payer_id, subscriptions.mercadopago_payer_id),
      access_until = case
        when subscriptions.mercadopago_payment_id = excluded.mercadopago_payment_id
          then subscriptions.access_until
        else greatest(coalesce(subscriptions.access_until, now()), now()) + interval '7 days'
      end
  `;
}

export async function activarVitalisPro(
  userId: string,
  subscriptionId: string | null,
  payerId: string | null,
  paymentId: string | null = null
): Promise<void> {
  await db.sql`
    insert into subscriptions (
      user_id, status, plan, precio, moneda, mercadopago_subscription_id,
      mercadopago_payer_id, mercadopago_payment_id, access_until
    )
    values (
      ${userId}, 'active', 'pro', 300, 'mxn', ${subscriptionId},
      ${payerId}, ${paymentId}, null
    )
    on conflict (user_id) do update set
      status = 'active',
      plan = 'pro',
      precio = 300,
      moneda = 'mxn',
      mercadopago_subscription_id = coalesce(excluded.mercadopago_subscription_id, subscriptions.mercadopago_subscription_id),
      mercadopago_payer_id = coalesce(excluded.mercadopago_payer_id, subscriptions.mercadopago_payer_id),
      mercadopago_payment_id = coalesce(excluded.mercadopago_payment_id, subscriptions.mercadopago_payment_id),
      access_until = null
  `;
}

export async function actualizarEstadoPorMercadoPagoSubscriptionId(
  subscriptionId: string,
  status: string
): Promise<void> {
  await db.sql`
    update subscriptions set status = ${status}
    where mercadopago_subscription_id = ${subscriptionId}
  `;
}

export async function actualizarEstadoMercadoPagoPorUsuario(
  userId: string,
  status: string
): Promise<void> {
  await db.sql`
    update subscriptions set status = ${status}
    where user_id = ${userId}
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
  plan: string | null;
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
    plan: string | null;
    access_until: string | null;
  }>`
    select u.id, u.email, u.nombre, u.edad, u.pais, u.condicion,
      s.status, s.plan, s.access_until
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
    plan: fila.plan,
    suscripcionActiva:
      fila.status === "active" &&
      (fila.plan === "pro" ||
        (fila.plan === "7_dias" &&
          Boolean(fila.access_until) &&
          new Date(fila.access_until as string).getTime() > Date.now())),
  };
}

export async function obtenerMercadoPagoSubscriptionIdPorSesion(
  sessionToken: string
): Promise<string | null> {
  const filas = await db.sql<{ mercadopago_subscription_id: string | null }>`
    select s.mercadopago_subscription_id
    from sessions sess
    join users u on u.id = sess.user_id
    left join subscriptions s on s.user_id = u.id
    where sess.token = ${sessionToken}
      and sess.expires_at > now()
  `;
  return filas[0]?.mercadopago_subscription_id ?? null;
}
