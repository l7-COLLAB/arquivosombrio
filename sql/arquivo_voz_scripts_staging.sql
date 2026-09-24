-- STAGING ONLY. Apply after verifying narration_projects admin ownership model.
-- Private, per-block Kokoro script; no changes to Polly or public audio.
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
-- Owner check uses the same narrator identity already recorded by the V2 editor.
-- Review existing admin authorization before production deployment.
create policy "narrator reads own Kokoro scripts" on public.arquivo_voz_scripts
 for select to authenticated using (
 exists(select 1 from public.narration_projects p
        where p.id=project_id and p.narrator_id=auth.uid())
 );
create policy "narrator inserts own Kokoro scripts" on public.arquivo_voz_scripts
 for insert to authenticated with check (
 exists(select 1 from public.narration_projects p
        join public.narration_blocks b on b.project_id=p.id
        where p.id=project_id and b.id=block_id and p.narrator_id=auth.uid())
 );
create policy "narrator updates own Kokoro scripts" on public.arquivo_voz_scripts
 for update to authenticated using (
 exists(select 1 from public.narration_projects p
        where p.id=project_id and p.narrator_id=auth.uid())
 ) with check (
 exists(select 1 from public.narration_projects p
        join public.narration_blocks b on b.project_id=p.id
        where p.id=project_id and b.id=block_id and p.narrator_id=auth.uid())
 );
grant select,insert,update on public.arquivo_voz_scripts to authenticated;
