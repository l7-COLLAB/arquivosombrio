create table if not exists public.lite_admin_access_attempts (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  attempted_at timestamptz not null default now()
);
create index if not exists lite_admin_access_attempts_idx
  on public.lite_admin_access_attempts (ip_hash, attempted_at);

create table if not exists public.lite_admin_sessions (
  token_hash text primary key,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.lite_admin_staging (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category = any (array[
    'dossies', 'garimpo', 'pericia', 'lendas', 'creepypastas', 'novels', 'capitulos'
  ])),
  title text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.lite_admin_access_attempts enable row level security;
alter table public.lite_admin_sessions enable row level security;
alter table public.lite_admin_staging enable row level security;

revoke all privileges on table public.lite_admin_access_attempts,
  public.lite_admin_sessions, public.lite_admin_staging from anon, authenticated;
