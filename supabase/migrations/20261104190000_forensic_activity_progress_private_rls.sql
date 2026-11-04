-- Conquistas recreativas de Perícia: isoladas por usuário, sem rankings públicos.
-- Não utiliza investigator_badges (conquistas institucionais/verificadas).
create table if not exists public.forensic_activity_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_code text not null check (activity_code in ('trilha','custodia','papiloscopia')),
  state jsonb not null default '{}'::jsonb
    check (jsonb_typeof(state) = 'object' and octet_length(state::text) <= 2048),
  best_steps smallint not null default 0 check (best_steps between 0 and 9),
  best_score smallint not null default 0 check (best_score between 0 and 90 and best_score % 10 = 0),
  ever_completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, activity_code),
  constraint forensic_activity_progress_limits check (
    (activity_code = 'trilha' and best_steps between 0 and 9)
    or (activity_code in ('custodia','papiloscopia') and best_steps between 0 and 2 and best_score = 0)
  ),
  constraint forensic_activity_completed_consistency check (
    not ever_completed
    or (activity_code = 'trilha' and best_steps = 9)
    or (activity_code in ('custodia','papiloscopia') and best_steps = 2)
  )
);
comment on table public.forensic_activity_progress is
  'Progresso e selos educativos privados de Perícia. Não são laudos ou credenciais verificadas.';
alter table public.forensic_activity_progress enable row level security;
revoke all on table public.forensic_activity_progress from public, anon;
grant select, insert, update on table public.forensic_activity_progress to authenticated;

drop policy if exists forensic_progress_self_select on public.forensic_activity_progress;
create policy forensic_progress_self_select on public.forensic_activity_progress
for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists forensic_progress_self_insert on public.forensic_activity_progress;
create policy forensic_progress_self_insert on public.forensic_activity_progress
for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists forensic_progress_self_update on public.forensic_activity_progress;
create policy forensic_progress_self_update on public.forensic_activity_progress
for update to authenticated using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
