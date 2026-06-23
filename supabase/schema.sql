-- ================================================================
-- VITALIS — Script completo de base de datos
-- Proyecto: Vitalis / Salud Sexual Masculina
-- Base de datos: postgres (Supabase)
-- Esquema: public
-- ================================================================
-- Instrucciones:
-- 1. Ir a Supabase → SQL Editor → New Query
-- 2. Copiar y pegar todo este script
-- 3. Clic en Run (Ctrl + Enter)
-- ================================================================

create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------
-- TABLA: users
-- ----------------------------------------------------------------
create table if not exists public.users (
  id                 uuid references auth.users on delete cascade primary key,
  email              text unique not null,
  nombre             text,
  edad               integer,
  pais               text,
  condicion          text,
  tiempo_problema    text,
  objetivo           text,
  medicamentos       text,
  alergias           text,
  presion            text,
  diabetes           text,
  cardio             text,
  onboarding_completo boolean default false,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

comment on table public.users is 'Perfil médico de cada paciente de Vitalis';

-- ----------------------------------------------------------------
-- TABLA: subscriptions
-- ----------------------------------------------------------------
create table if not exists public.subscriptions (
  id                      uuid default uuid_generate_v4() primary key,
  user_id                 uuid references public.users(id) on delete cascade not null,
  stripe_customer_id      text unique,
  stripe_subscription_id  text unique,
  status                  text default 'inactive',
  plan                    text default 'pro',
  precio                  integer default 599,
  moneda                  text default 'mxn',
  current_period_start    timestamptz,
  current_period_end      timestamptz,
  cancel_at_period_end    boolean default false,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

comment on table public.subscriptions is 'Suscripciones mensuales a Vitalis Pro — $599 MXN/mes';

-- ----------------------------------------------------------------
-- TABLA: chat_history
-- ----------------------------------------------------------------
create table if not exists public.chat_history (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.users(id) on delete cascade not null,
  messages    jsonb not null default '[]',
  sesion_date date default current_date,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

comment on table public.chat_history is 'Historial de consultas con el Dr. Vitalis';

-- ----------------------------------------------------------------
-- TABLA: adherencia
-- ----------------------------------------------------------------
create table if not exists public.adherencia (
  id                       uuid default uuid_generate_v4() primary key,
  user_id                  uuid references public.users(id) on delete cascade not null,
  fecha                    date default current_date,
  ejercicios_completados   integer default 0,
  dosis_tomadas            integer default 0,
  kegel_manana             boolean default false,
  kegel_noche              boolean default false,
  cardio_completado        boolean default false,
  medicamento_tomado       boolean default false,
  notas                    text,
  created_at               timestamptz default now(),
  unique(user_id, fecha)
);

comment on table public.adherencia is 'Registro diario de adherencia al protocolo médico';

-- ----------------------------------------------------------------
-- TABLA: protocolo
-- ----------------------------------------------------------------
create table if not exists public.protocolo (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references public.users(id) on delete cascade not null,
  medicamentos    jsonb default '[]',
  ejercicios      jsonb default '[]',
  notas_medicas   text,
  generado_en     timestamptz default now(),
  updated_at      timestamptz default now(),
  unique(user_id)
);

comment on table public.protocolo is 'Protocolo médico personalizado del Dr. Vitalis por paciente';

-- ----------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------
alter table public.users         enable row level security;
alter table public.subscriptions enable row level security;
alter table public.chat_history  enable row level security;
alter table public.adherencia    enable row level security;
alter table public.protocolo     enable row level security;

-- ----------------------------------------------------------------
-- POLÍTICAS DE SEGURIDAD
-- ----------------------------------------------------------------
create policy "users: acceso solo al propio perfil"
  on public.users for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "subscriptions: acceso solo a la propia suscripcion"
  on public.subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "chat_history: acceso solo al propio historial"
  on public.chat_history for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "adherencia: acceso solo a la propia adherencia"
  on public.adherencia for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "protocolo: acceso solo al propio protocolo"
  on public.protocolo for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- FUNCIÓN: actualizar updated_at automáticamente
-- ----------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at
  before update on public.users
  for each row execute procedure public.set_updated_at();

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute procedure public.set_updated_at();

create trigger chat_history_updated_at
  before update on public.chat_history
  for each row execute procedure public.set_updated_at();

create trigger protocolo_updated_at
  before update on public.protocolo
  for each row execute procedure public.set_updated_at();

-- ----------------------------------------------------------------
-- FUNCIÓN + TRIGGER: crear perfil automático al registrarse
-- ----------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------
-- ÍNDICES
-- ----------------------------------------------------------------
create index if not exists idx_subscriptions_user_id
  on public.subscriptions(user_id);

create index if not exists idx_subscriptions_stripe_customer
  on public.subscriptions(stripe_customer_id);

create index if not exists idx_chat_history_user_id
  on public.chat_history(user_id);

create index if not exists idx_adherencia_user_fecha
  on public.adherencia(user_id, fecha desc);

create index if not exists idx_protocolo_user_id
  on public.protocolo(user_id);

-- ================================================================
-- VERIFICACIÓN FINAL
-- Ejecuta esto al final para confirmar que todo se creó bien
-- ================================================================
select
  table_name,
  pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as tamaño
from information_schema.tables
where table_schema = 'public'
order by table_name;
