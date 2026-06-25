alter table users
  add column if not exists password_hash text;

create index if not exists idx_users_email
  on users(email);

create index if not exists idx_subscriptions_active_access
  on subscriptions(user_id, status, current_period_end);
