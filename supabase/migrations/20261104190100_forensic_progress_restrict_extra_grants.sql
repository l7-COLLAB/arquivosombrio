-- Remover grants herdados de privilégios padrão: TRUNCATE jamais deve ser permitido.
revoke all on table public.forensic_activity_progress from authenticated;
grant select, insert, update on table public.forensic_activity_progress to authenticated;
