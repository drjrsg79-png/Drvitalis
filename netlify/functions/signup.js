const {
  db,
  json,
  parseJson,
  normalizeEmail,
  validEmail,
  signSession,
  sessionCookie,
  hashPassword,
} = require("./_auth");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Método no permitido." });

  const { password } = parseJson(event);
  const email = normalizeEmail(parseJson(event).email);

  if (!validEmail(email)) return json(400, { error: "Escribe un correo electrónico válido." });
  if (String(password || "").length < 8) {
    return json(400, { error: "La contraseña debe tener al menos 8 caracteres." });
  }

  try {
    const existing = await db.sql`
      select id, password_hash
      from users
      where email = ${email}
      limit 1
    `;

    if (existing[0]?.password_hash) {
      return json(409, { error: "Este correo ya tiene una cuenta. Inicia sesión." });
    }

    const passwordHash = await hashPassword(password);
    const rows = existing[0]
      ? await db.sql`
          update users
          set password_hash = ${passwordHash}
          where id = ${existing[0].id}
          returning id
        `
      : await db.sql`
          insert into users (email, password_hash)
          values (${email}, ${passwordHash})
          returning id
        `;

    const token = signSession(rows[0].id);
    return json(200, { ok: true }, { "Set-Cookie": sessionCookie(token) });
  } catch (error) {
    console.error("signup_failed", error);
    return json(500, { error: "No pudimos crear tu cuenta. Inténtalo de nuevo en unos minutos." });
  }
};
