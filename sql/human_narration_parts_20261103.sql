-- Arquivo Sombrio: narração humana por partes.
-- Migração aditiva. NÃO modifica as tabelas nem os áudios Polly/Kokoro.
-- Aplicar em staging antes de produção e validar backup.
create table if not exists public.human_narration_sets (
  id uuid primary key default gen_random_uuid(),
  narration_project_id uuid not null unique references public.narration_projects(id) on delete restrict,
  content_type text not null check (content_type in ('dossie','garimpo','pericia','lenda','creepypasta')),
  content_id bigint not null check (content_id > 0),
  expected_parts int not null default 1 check (expected_parts between 1 and 60),
  active_release_id uuid,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(content_type, content_id)
);

create table if not exists public.human_narration_parts (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.human_narration_sets(id) on delete cascade,
  sort_order integer not null check(sort_order between 1 and 1000),
  title text not null default '' check(length(title) <= 180),
  script_notes text not null default '' check(length(script_notes) <= 30000),
  audio_path text,
  audio_mime text check(audio_mime in ('audio/mpeg','audio/wav')),
  audio_rights_note text not null default '' check(length(audio_rights_note)<=1000),
  audio_size bigint check(audio_size between 1024 and 104857600),
  duration_seconds numeric(12,2) check(duration_seconds > 0 and duration_seconds <= 86400),
  status text not null default 'pending' check(status in ('pending','ready')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists human_narration_parts_order_idx on public.human_narration_parts(set_id,sort_order,id);

create table if not exists public.human_narration_uploads (
  id uuid primary key default gen_random_uuid(),
  part_id uuid not null references public.human_narration_parts(id) on delete cascade,
  audio_path text not null,
  audio_mime text not null default 'audio/mpeg' check(audio_mime in ('audio/mpeg','audio/wav')),
  audio_rights_note text not null default '' check(length(audio_rights_note)<=1000),
  file_size bigint not null check(file_size between 1024 and 31457280),
  duration_seconds numeric(12,2) check(duration_seconds > 0 and duration_seconds <= 86400),
  state text not null default 'uploading' check(state in ('uploading','finished','rejected')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists human_narration_uploads_part_idx on public.human_narration_uploads(part_id,created_at desc);

create table if not exists public.human_narration_releases (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.human_narration_sets(id) on delete restrict,
  parts_manifest jsonb not null check(jsonb_typeof(parts_manifest)='array'),
  source_updated_at timestamptz,
  duration_seconds numeric(12,2) not null check(duration_seconds > 0),
  approved_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists human_narration_releases_set_idx on public.human_narration_releases(set_id,created_at desc);

-- A publicação aponta para snapshot imutável; trocar rascunhos não altera versão publicada.
alter table public.human_narration_sets
  add constraint human_narration_sets_active_release_fk
  foreign key(active_release_id) references public.human_narration_releases(id) on delete restrict;

alter table public.human_narration_sets enable row level security;
alter table public.human_narration_parts enable row level security;
alter table public.human_narration_uploads enable row level security;
alter table public.human_narration_releases enable row level security;

-- Nenhuma política direta para anon/authenticated. Somente Edge Function com
-- sessão de administrador verificada e service_role no servidor acessa os dados.
revoke all on public.human_narration_sets from public,anon,authenticated;
revoke all on public.human_narration_parts from public,anon,authenticated;
revoke all on public.human_narration_uploads from public,anon,authenticated;
revoke all on public.human_narration_releases from public,anon,authenticated;
grant select,insert,update,delete on public.human_narration_sets to service_role;
grant select,insert,update,delete on public.human_narration_parts to service_role;
grant select,insert,update,delete on public.human_narration_uploads to service_role;
grant select,insert,update,delete on public.human_narration_releases to service_role;
