-- ================================================================
-- VITALIS — Autenticación por magic link y sesiones
-- ================================================================
-- Esta migración la aplica Netlify automáticamente en cada deploy.
-- ================================================================

-- ----------------------------------------------------------------
-- TABLA: auth_tokens — enlaces de acceso de un solo uso (magic link)
-- ----------------------------------------------------------------
create table if not exists auth_tokens (
  id          uuid primary key default uuid_generate_v4(),
  email       text not null,
  token       text unique not null,
  used        boolean default false,
  expires_at  timestamptz not null,
  created_at  timestamptz default now()
);

create index if not exists idx_auth_tokens_token
  on auth_tokens(token);

-- ----------------------------------------------------------------
-- TABLA: sessions — sesiones activas (cookie de sesión del usuario)
-- ----------------------------------------------------------------
create table if not exists sessions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references users(id) on delete cascade not null,
  token       text unique not null,
  expires_at  timestamptz not null,
  created_at  timestamptz default now()
);

create index if not exists idx_sessions_token
  on sessions(token);

create index if not exists idx_sessions_user_id
  on sessions(user_id);
