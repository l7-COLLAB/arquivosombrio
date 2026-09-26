-- Programa de Investigadores: esquema preparado para revisão antes de aplicar em produção.
-- Nenhum cliente pode conceder pontos ou privilégios diretamente.
create table if not exists public.investigator_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 lifetime_xp integer not null default 0 check(lifetime_xp >= 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.investigator_events (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 event_type text not null,
 source_type text not null,
 source_id text not null,
 xp_delta integer not null check(xp_delta between -1000 and 1000 and xp_delta <> 0),
 verified_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 unique(user_id,event_type,source_type,source_id)
);
create table if not exists public.investigator_entitlements (
 user_id uuid not null references auth.users(id) on delete cascade,
 entitlement_code text not null,
 awarded_at timestamptz not null default now(),
 grant_reason text not null,
 primary key(user_id,entitlement_code)
);
create table if not exists public.investigator_badges (
 user_id uuid not null references auth.users(id) on delete cascade,
 badge_code text not null,
 awarded_at timestamptz not null default now(),
 primary key(user_id,badge_code)
);
alter table public.investigator_profiles enable row level security;
alter table public.investigator_events enable row level security;
alter table public.investigator_entitlements enable row level security;
alter table public.investigator_badges enable row level security;
create policy investigator_profile_self_read on public.investigator_profiles for select to authenticated using ((select auth.uid())=user_id);
create policy investigator_events_self_read on public.investigator_events for select to authenticated using ((select auth.uid())=user_id);
create policy investigator_entitlements_self_read on public.investigator_entitlements for select to authenticated using ((select auth.uid())=user_id);
create policy investigator_badges_self_read on public.investigator_badges for select to authenticated using ((select auth.uid())=user_id);
grant select on public.investigator_profiles, public.investigator_events, public.investigator_entitlements, public.investigator_badges to authenticated;
-- Pontuação deverá ser concedida por rotina de servidor autenticada e auditável.
-- Antes de ativar: revisar política de exclusão de conta e concessões vitalícias.
