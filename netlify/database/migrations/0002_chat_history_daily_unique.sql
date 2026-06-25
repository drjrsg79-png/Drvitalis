-- Permite actualizar una sola conversación diaria por usuario.
create unique index if not exists idx_chat_history_user_date_unique
  on chat_history(user_id, sesion_date);
