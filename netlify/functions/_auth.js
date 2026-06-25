const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

const COOKIE_NAME = "vitalis_session";
const ONE_WEEK_SECONDS = 60 * 60 * 24 * 7;

let pool;

function getConnectionString() {
  const connectionString = process.env.NETLIFY_DB_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Database connection is not configured");
  }
  return connectionString;
}

function getPool() {
  if (!pool) {
    pool = new Pool({ connectionString: getConnectionString() });
  }
  return pool;
}

const db = {
  async sql(strings, ...values) {
    const text = strings.reduce((query, part, index) => {
      const placeholder = index < values.length ? `$${index + 1}` : "";
      return query + part + placeholder;
    }, "");
    const result = await getPool().query(text, values);
    return result.rows;
  },
};

function json(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  };
}

function parseJson(event) {
  try {
    return JSON.parse(event.body || "{}");
  } catch {
    return {};
  }
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function requireJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  return process.env.JWT_SECRET;
}

function signSession(userId) {
  return jwt.sign({ user_id: userId }, requireJwtSecret(), { expiresIn: "7d" });
}

function sessionCookie(token) {
  return [
    `${COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    `Max-Age=${ONE_WEEK_SECONDS}`,
  ].join("; ");
}

function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

function getCookie(event, name) {
  const cookieHeader = event.headers.cookie || event.headers.Cookie || "";
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function verifySession(event) {
  const token = getCookie(event, COOKIE_NAME);
  if (!token) return null;
  try {
    return jwt.verify(token, requireJwtSecret());
  } catch {
    return null;
  }
}

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = {
  db,
  json,
  parseJson,
  normalizeEmail,
  validEmail,
  signSession,
  sessionCookie,
  clearSessionCookie,
  verifySession,
  hashPassword,
  comparePassword,
};
