-- ================================================================
-- VITALIS — Mercado Pago y acceso temporal
-- ================================================================

alter table subscriptions
  add column if not exists mercadopago_payer_id text,
  add column if not exists mercadopago_subscription_id text,
  add column if not exists mercadopago_payment_id text,
  add column if not exists access_until timestamptz;

alter table subscriptions
  alter column precio set default 300;

create unique index if not exists idx_subscriptions_mercadopago_subscription
  on subscriptions(mercadopago_subscription_id)
  where mercadopago_subscription_id is not null;

create index if not exists idx_subscriptions_access_until
  on subscriptions(access_until);
