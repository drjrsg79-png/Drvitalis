-- ================================================================
-- VITALIS — Esquema inicial (Netlify Database / Postgres)
-- Esta migracion la aplica Netlify automaticamente en cada deploy.
-- No es necesario ejecutar nada a mano.
-- ================================================================

-- ----------------------------------------------------------------
-- TABLA: users
-- Perfil de cada paciente. Se identifica por email (aun no hay login).
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id                 SERIAL PRIMARY KEY,
  email              TEXT UNIQUE NOT NULL,
  nombre             TEXT,
  edad               INTEGER,
  pais               TEXT,
  condicion          TEXT,
  historial_medico   TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- TABLA: subscriptions
-- Suscripciones mensuales a Vitalis Pro — $599 MXN/mes.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
  id                      SERIAL PRIMARY KEY,
  user_id                 INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT UNIQUE,
  status                  TEXT DEFAULT 'inactive',
  plan                    TEXT DEFAULT 'pro',
  precio                  INTEGER DEFAULT 599,
  moneda                  TEXT DEFAULT 'mxn',
  current_period_end      TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- TABLA: chat_history
-- Historial de consultas con el Dr. Vitalis.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_history (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  messages    JSONB NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- TABLA: adherencia
-- Registro diario de adherencia al protocolo medico.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS adherencia (
  id                       SERIAL PRIMARY KEY,
  user_id                  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fecha                    DATE DEFAULT CURRENT_DATE,
  ejercicios_completados   INTEGER DEFAULT 0,
  dosis_tomadas            INTEGER DEFAULT 0,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, fecha)
);

-- ----------------------------------------------------------------
-- TABLA: protocolo
-- Protocolo medico personalizado del Dr. Vitalis por paciente.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS protocolo (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  medicamentos    JSONB DEFAULT '[]',
  ejercicios      JSONB DEFAULT '[]',
  generado_en     TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);

-- ----------------------------------------------------------------
-- INDICES
-- ----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_adherencia_user_fecha ON adherencia(user_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_protocolo_user_id ON protocolo(user_id);
