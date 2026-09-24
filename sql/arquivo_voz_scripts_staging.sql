-- Staging editor: admin-only Kokoro scripts, isolated from Polly and public player.
create table if not exists public.arquivo_voz_scripts (
 block_id uuid primary key references public.narration_blocks(id) on delete cascade,
 project_id uuid not null references public.narration_projects(id) on delete cascade,
 source_snapshot text not null,
 script_text text not null check(length(trim(script_text)) between 1 and 200000),
 status text not null default 'draft' check(status in ('draft','reviewed')),
 updated_at timestamptz not null default now()
);
create index if not exists arquivo_voz_scripts_project_idx on public.arquivo_voz_scripts(project_id);
alter table public.arquivo_voz_scripts enable row level security;
create policy arquivo_voz_scripts_admin_select on public.arquivo_voz_scripts
 for select to authenticated using ((select public.is_arquivo_sombrio_admin()));
create policy arquivo_voz_scripts_admin_insert on public.arquivo_voz_scripts
 for insert to authenticated with check (
 (select public.is_arquivo_sombrio_admin()) and
 exists(select 1 from public.narration_blocks b where b.id=block_id and b.project_id=project_id)
 );
create policy arquivo_voz_scripts_admin_update on public.arquivo_voz_scripts
 for update to authenticated using ((select public.is_arquivo_sombrio_admin()))
 with check (
 (select public.is_arquivo_sombrio_admin()) and
 exists(select 1 from public.narration_blocks b where b.id=block_id and b.project_id=project_id)
 );
grant select,insert,update on public.arquivo_voz_scripts to authenticated;
