const {
  db,
  json,
  parseJson,
  normalizeEmail,
  validEmail,
  signSession,
  sessionCookie,
  comparePassword,
} = require("./_auth");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Método no permitido." });

  const body = parseJson(event);
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");

  if (!validEmail(email) || password.length < 1) {
    return json(400, { error: "Revisa tu correo y contraseña." });
  }

  try {
    const rows = await db.sql`
      select id, password_hash
      from users
      where email = ${email}
      limit 1
    `;
    const user = rows[0];
    if (!user?.password_hash || !(await comparePassword(password, user.password_hash))) {
      return json(401, { error: "Correo o contraseña incorrectos." });
    }

    const token = signSession(user.id);
    return json(200, { ok: true }, { "Set-Cookie": sessionCookie(token) });
  } catch (error) {
    console.error("login_failed", error);
    return json(500, { error: "No pudimos iniciar sesión. Inténtalo de nuevo en unos minutos." });
  }
};
