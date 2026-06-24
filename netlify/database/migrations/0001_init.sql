-- ================================================================
-- VITALIS — Esquema inicial de base de datos
-- Base de datos: Netlify Database (Postgres administrado)
-- ================================================================
-- Esta migración la aplica Netlify automáticamente en cada deploy.
-- No hay que pegar nada en ningún panel ni copiar llaves a mano.
-- ================================================================

create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------
-- TABLA: users — perfil médico de cada paciente
-- ----------------------------------------------------------------
create table if not exists users (
  id                  uuid primary key default uuid_generate_v4(),
  email               text unique not null,
  nombre              text,
  edad                integer,
  pais                text,
  condicion           text,
  tiempo_problema     text,
  objetivo            text,
  medicamentos        text,
  alergias            text,
  presion             text,
  diabetes            text,
  cardio              text,
  onboarding_completo boolean default false,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ----------------------------------------------------------------
-- TABLA: subscriptions — suscripción mensual a Vitalis Pro
-- ----------------------------------------------------------------
create table if not exists subscriptions (
  id                     uuid primary key default uuid_generate_v4(),
  user_id                uuid references users(id) on delete cascade not null,
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  status                 text default 'inactive',
  plan                   text default 'pro',
  precio                 integer default 599,
  moneda                 text default 'mxn',
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  cancel_at_period_end   boolean default false,
  created_at             timestamptz default now(),
  updated_at             timestamptz default now(),
  unique(user_id)
);

-- ----------------------------------------------------------------
-- TABLA: chat_history — historial de consultas con el Dr. Vitalis
-- ----------------------------------------------------------------
create table if not exists chat_history (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references users(id) on delete cascade not null,
  messages    jsonb not null default '[]',
  sesion_date date default current_date,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ----------------------------------------------------------------
-- TABLA: adherencia — registro diario del protocolo
-- ----------------------------------------------------------------
create table if not exists adherencia (
  id                     uuid primary key default uuid_generate_v4(),
  user_id                uuid references users(id) on delete cascade not null,
  fecha                  date default current_date,
  ejercicios_completados integer default 0,
  dosis_tomadas          integer default 0,
  kegel_manana           boolean default false,
  kegel_noche            boolean default false,
  cardio_completado      boolean default false,
  medicamento_tomado     boolean default false,
  notas                  text,
  created_at             timestamptz default now(),
  unique(user_id, fecha)
);

-- ----------------------------------------------------------------
-- TABLA: protocolo — protocolo médico personalizado por paciente
-- ----------------------------------------------------------------
create table if not exists protocolo (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references users(id) on delete cascade not null,
  medicamentos  jsonb default '[]',
  ejercicios    jsonb default '[]',
  notas_medicas text,
  generado_en   timestamptz default now(),
  updated_at    timestamptz default now(),
  unique(user_id)
);

-- ----------------------------------------------------------------
-- FUNCIÓN + TRIGGERS: mantener updated_at al día automáticamente
-- ----------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at
  before update on users
  for each row execute procedure set_updated_at();

create trigger subscriptions_updated_at
  before update on subscriptions
  for each row execute procedure set_updated_at();

create trigger chat_history_updated_at
  before update on chat_history
  for each row execute procedure set_updated_at();

create trigger protocolo_updated_at
  before update on protocolo
  for each row execute procedure set_updated_at();

-- ----------------------------------------------------------------
-- ÍNDICES
-- ----------------------------------------------------------------
create index if not exists idx_subscriptions_user_id
  on subscriptions(user_id);

create index if not exists idx_subscriptions_stripe_customer
  on subscriptions(stripe_customer_id);

create index if not exists idx_chat_history_user_id
  on chat_history(user_id);

create index if not exists idx_adherencia_user_fecha
  on adherencia(user_id, fecha desc);

create index if not exists idx_protocolo_user_id
  on protocolo(user_id);
