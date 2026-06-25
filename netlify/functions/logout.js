const { json, clearSessionCookie } = require("./_auth");

exports.handler = async () => json(200, { ok: true }, { "Set-Cookie": clearSessionCookie() });
