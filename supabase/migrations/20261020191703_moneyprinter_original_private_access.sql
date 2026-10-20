create table public.studio_mpt_access(owner_id uuid primary key references auth.users(id) on delete cascade,connections jsonb not null default '[]'::jsonb check(jsonb_typeof(connections)='array' and jsonb_array_length(connections)<=3),updated_at timestamptz not null default now());
alter table public.studio_mpt_access enable row level security;
revoke all on public.studio_mpt_access from anon,authenticated;
grant all on public.studio_mpt_access to service_role;
