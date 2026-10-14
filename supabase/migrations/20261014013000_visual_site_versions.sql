-- Estúdio Visual V2: histórico imutável e publicação apenas por administradores
create table if not exists public.visual_site_versions (
 id bigint generated always as identity primary key,
 created_at timestamptz not null default now(),
 author_id uuid not null references auth.users(id),
 note text not null default '',
 settings jsonb not null,
 constraint visual_settings_object check (jsonb_typeof(settings)='object'),
 constraint visual_settings_size check (octet_length(settings::text) <= 100000),
 constraint visual_note_size check (length(note) <= 200)
);
create index if not exists visual_site_versions_recent_idx on public.visual_site_versions (id desc);
alter table public.visual_site_versions enable row level security;
revoke all on public.visual_site_versions from anon, authenticated;
grant select on public.visual_site_versions to anon, authenticated;
grant insert (author_id,note,settings) on public.visual_site_versions to authenticated;
drop policy if exists visual_versions_read on public.visual_site_versions;
create policy visual_versions_read on public.visual_site_versions for select to anon,authenticated using (true);
drop policy if exists visual_versions_admin_insert on public.visual_site_versions;
create policy visual_versions_admin_insert on public.visual_site_versions for insert to authenticated
with check (
 author_id = (select auth.uid())
 and (select auth.jwt()->'app_metadata'->>'role') = 'admin'
 and jsonb_typeof(settings)='object'
);
-- No UPDATE or DELETE grants: rollback always creates a new immutable version.
