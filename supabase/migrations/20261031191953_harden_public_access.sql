-- Public access hardening. No editorial or account data is deleted.
-- RLS does not protect TRUNCATE or schema DDL.
revoke create on schema public from public, anon, authenticated;
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;

-- Retire direct anonymous access to legacy contributions. The current forum is separate.
revoke all on public."Comentarios", public."ImagensForum", public."Sugestoes" from anon;
revoke insert on public."Comentarios", public."ImagensForum", public."Sugestoes" from authenticated;
drop policy if exists "Visitantes podem enviar comentarios pendentes" on public."Comentarios";
drop policy if exists "Visitantes podem ver comentarios aprovados" on public."Comentarios";
drop policy if exists "Visitantes podem enviar imagens pendentes" on public."ImagensForum";
drop policy if exists "Visitantes podem ver imagens aprovadas" on public."ImagensForum";
drop policy if exists "Visitantes podem enviar sugestoes" on public."Sugestoes";
alter policy "Usuarios veem comentarios permitidos" on public."Comentarios"
  using ((select public.is_arquivo_sombrio_admin()) or (select auth.uid()) = user_id);

-- Both guest and signed-in metrics/suggestions must go through the limited Edge endpoint.
revoke insert on public.audio_usage_events from anon, authenticated;
drop policy if exists "audio metrics insert" on public.audio_usage_events;
grant insert on public.audio_usage_events, public."Sugestoes" to service_role;
grant usage, select on sequence public.audio_usage_events_id_seq to service_role;

-- Keep administrative history private; publish only the current visual configuration.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists public.visual_site_public (
  id smallint primary key check (id = 1),
  version_id bigint not null,
  settings jsonb not null check (jsonb_typeof(settings) = 'object')
);
alter table public.visual_site_public enable row level security;
revoke all on public.visual_site_public from public, anon, authenticated;
grant select on public.visual_site_public to anon, authenticated;
create policy visual_site_public_read on public.visual_site_public for select to anon, authenticated using (true);

create table if not exists public.home_featured_public (
  id smallint primary key check (id = 1),
  dossier_id bigint,
  selected_at timestamptz,
  updated_at timestamptz
);
alter table public.home_featured_public enable row level security;
revoke all on public.home_featured_public from public, anon, authenticated;
grant select on public.home_featured_public to anon, authenticated;
create policy home_featured_public_read on public.home_featured_public for select to anon, authenticated using (true);

-- Trigger functions are intentionally privileged, in a non-exposed schema and not callable
-- by API roles. They copy a fixed set of safe columns after authorized admin writes only.
create or replace function private.sync_public_visual_settings() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.visual_site_public(id, version_id, settings) values (1, new.id, new.settings)
  on conflict (id) do update set version_id = excluded.version_id, settings = excluded.settings
  where public.visual_site_public.version_id <= excluded.version_id;
  return new;
end $$;
revoke all on function private.sync_public_visual_settings() from public, anon, authenticated;
create trigger sync_public_visual_settings after insert on public.visual_site_versions
  for each row execute function private.sync_public_visual_settings();
insert into public.visual_site_public(id, version_id, settings)
  select 1, id, settings from public.visual_site_versions order by id desc limit 1
  on conflict (id) do update set version_id=excluded.version_id, settings=excluded.settings;

create or replace function private.sync_public_home_featured() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then delete from public.home_featured_public where id=old.id; return old; end if;
  insert into public.home_featured_public(id,dossier_id,selected_at,updated_at)
  values(new.id,new.dossier_id,new.selected_at,new.updated_at)
  on conflict(id) do update set dossier_id=excluded.dossier_id,selected_at=excluded.selected_at,updated_at=excluded.updated_at;
  return new;
end $$;
revoke all on function private.sync_public_home_featured() from public, anon, authenticated;
create trigger sync_public_home_featured after insert or update or delete on public.home_featured_config
  for each row execute function private.sync_public_home_featured();
insert into public.home_featured_public(id,dossier_id,selected_at,updated_at)
  select id,dossier_id,selected_at,updated_at from public.home_featured_config
  on conflict(id) do update set dossier_id=excluded.dossier_id,selected_at=excluded.selected_at,updated_at=excluded.updated_at;

revoke select on public.visual_site_versions, public.home_featured_config from anon;
alter policy visual_versions_read on public.visual_site_versions to authenticated
  using ((select public.is_arquivo_sombrio_admin()));
alter policy home_featured_public_read on public.home_featured_config to authenticated
  using ((select public.is_arquivo_sombrio_admin()));

-- Restrictive policies supplement existing publication policies and preserve admin previews.
do $$
declare item record;
begin
  for item in select * from (values
    ('Casos','published_at'),('casos_diarios','publicado_em'),('pericias','publicado_em'),
    ('lendas','publicado_em'),('creepypastas','publicado_em'),('novels','publicado_em')
  ) as dates(table_name,date_column) loop
    execute format('create policy enforce_publication_time on public.%I as restrictive for select to anon, authenticated using ((select public.is_arquivo_sombrio_admin()) or (status_publicacao = %L and (%I is null or %I <= now())))',item.table_name,'publicado',item.date_column,item.date_column);
  end loop;
end $$;
create policy enforce_publication_time on public.novel_capitulos as restrictive for select to anon, authenticated
using ((select public.is_arquivo_sombrio_admin()) or
  (status_publicacao='publicado' and (publicado_em is null or publicado_em<=now()) and
   (agendado_para is null or agendado_para<=now())));

-- A reply is public only while its parent thread is public too.
alter policy "Leitura publica de comentarios ativos" on public.forum_comments using (
  account_content_state in ('active','anonymous') and exists (
    select 1 from public.forum_posts p where p.id=forum_comments.post_id
      and p.status='publicado' and p.account_content_state in ('active','anonymous')));
alter policy "Usuarios veem comentarios permitidos" on public.forum_comments using (
  (select public.is_arquivo_sombrio_admin()) or (select auth.uid())=user_id or (
    account_content_state in ('active','anonymous') and exists (
      select 1 from public.forum_posts p where p.id=forum_comments.post_id
        and p.status='publicado' and p.account_content_state in ('active','anonymous'))));
alter policy "Enable insert for users based on user_id" on public.forum_comments with check (
  (select auth.uid())=user_id and account_content_state='active' and exists (
    select 1 from public.forum_posts p where p.id=forum_comments.post_id
      and p.status='publicado' and p.account_content_state in ('active','anonymous')));
