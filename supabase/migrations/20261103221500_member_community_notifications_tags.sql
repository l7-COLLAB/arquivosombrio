-- Meu Arquivo: comunidade opt-in, etiquetas privadas e alertas de comentários.
-- Aplicação segura: RLS antes de qualquer grant para tabelas novas.
create schema if not exists arquivo_private;
revoke all on schema arquivo_private from public;
grant usage on schema arquivo_private to authenticated;

create table if not exists public.member_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 2 and 80),
  bio text not null default '' check (char_length(bio) <= 500),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.member_profiles enable row level security;
revoke all on public.member_profiles from anon;
grant select,insert,update,delete on public.member_profiles to authenticated;

-- A função lê somente o necessário para impedir que bloqueios sejam ignorados
-- por outras políticas RLS (as relações de bloqueio continuam privadas).
create or replace function arquivo_private.member_view_allowed(target uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is not null
     and not exists (
       select 1 from public.user_blocks b
       where (b.user_id = (select auth.uid()) and b.blocked_user_id = target)
          or (b.user_id = target and b.blocked_user_id = (select auth.uid()))
     );
$$;
revoke all on function arquivo_private.member_view_allowed(uuid) from public,anon;
grant execute on function arquivo_private.member_view_allowed(uuid) to authenticated;

drop policy if exists member_profiles_select on public.member_profiles;
create policy member_profiles_select on public.member_profiles for select
to authenticated using (
  user_id = (select auth.uid()) or
  (published is true and (select arquivo_private.member_view_allowed(user_id)))
);
drop policy if exists member_profiles_insert on public.member_profiles;
create policy member_profiles_insert on public.member_profiles for insert
to authenticated with check (user_id = (select auth.uid()));
drop policy if exists member_profiles_update on public.member_profiles;
create policy member_profiles_update on public.member_profiles for update
to authenticated using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
drop policy if exists member_profiles_delete on public.member_profiles;
create policy member_profiles_delete on public.member_profiles for delete
to authenticated using (user_id = (select auth.uid()));

-- Marcadores continuam privados e não podem ser vinculados a etiquetas alheias.
create unique index if not exists user_tags_id_user_id_unique
on public.user_tags(id,user_id);
create table if not exists public.user_item_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tag_id uuid not null,
  item_type text not null check (item_type in ('dossier','novel','favorite')),
  item_id text not null check (char_length(item_id) between 1 and 160),
  created_at timestamptz not null default now(),
  constraint user_item_tags_tag_owner_fk foreign key(tag_id,user_id)
    references public.user_tags(id,user_id) on delete cascade,
  constraint user_item_tags_unique unique(user_id,tag_id,item_type,item_id)
);
alter table public.user_item_tags enable row level security;
revoke all on public.user_item_tags from anon;
grant select,insert,delete on public.user_item_tags to authenticated;
drop policy if exists user_item_tags_select on public.user_item_tags;
create policy user_item_tags_select on public.user_item_tags for select to authenticated
using (user_id=(select auth.uid()));
drop policy if exists user_item_tags_insert on public.user_item_tags;
create policy user_item_tags_insert on public.user_item_tags for insert to authenticated
with check (user_id=(select auth.uid()));
drop policy if exists user_item_tags_delete on public.user_item_tags;
create policy user_item_tags_delete on public.user_item_tags for delete to authenticated
using (user_id=(select auth.uid()));

-- O banco recusa seguir alguém sem consentimento ou após bloqueio mútuo.
create or replace function arquivo_private.validate_member_follow()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is distinct from new.follower_id then
    raise exception 'A ação de seguir exige o próprio usuário autenticado';
  end if;
  if not exists (
    select 1 from public.member_profiles p where p.user_id = new.followed_id
      and p.published is true
      and arquivo_private.member_view_allowed(p.user_id)
  ) then
    raise exception 'Perfil não disponível para acompanhamento';
  end if;
  return new;
end;
$$;
revoke all on function arquivo_private.validate_member_follow() from public,anon,authenticated;
drop trigger if exists arquivo_validate_member_follow on public.user_follows;
create trigger arquivo_validate_member_follow before insert or update on public.user_follows
for each row execute function arquivo_private.validate_member_follow();

-- Bloquear encerra os seguimentos em ambos os sentidos.
create or replace function arquivo_private.remove_blocked_follows()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is distinct from new.user_id then
    raise exception 'Bloqueio exige o próprio usuário autenticado';
  end if;
  delete from public.user_follows f
   where (f.follower_id=new.user_id and f.followed_id=new.blocked_user_id)
      or (f.follower_id=new.blocked_user_id and f.followed_id=new.user_id);
  return new;
end;
$$;
revoke all on function arquivo_private.remove_blocked_follows() from public,anon,authenticated;
drop trigger if exists arquivo_remove_blocked_follows on public.user_blocks;
create trigger arquivo_remove_blocked_follows after insert on public.user_blocks
for each row execute function arquivo_private.remove_blocked_follows();

-- Alertas gerados pelo servidor, nunca pelo navegador de outro membro.
alter table public.user_notifications add column if not exists source_key text;
create unique index if not exists user_notifications_source_key_unique
on public.user_notifications(source_key) where source_key is not null;

create or replace function arquivo_private.notify_forum_comment()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  target_user uuid;
  allow_notify boolean;
begin
  if new.user_id is null or new.user_id is distinct from (select auth.uid())
     or new.account_content_state <> 'active' then return new; end if;
  select p.user_id into target_user
    from public.forum_posts p where p.id=new.post_id
    and p.status='publicado' and p.account_content_state='active';
  if target_user is null or target_user = new.user_id then return new; end if;
  if exists (select 1 from public.user_blocks b
      where (b.user_id=target_user and b.blocked_user_id=new.user_id)
         or (b.user_id=new.user_id and b.blocked_user_id=target_user))
  then return new; end if;
  select coalesce(pref.notify_comments,true) into allow_notify
    from public.user_preferences pref where pref.user_id=target_user;
  if coalesce(allow_notify,true) is false then return new; end if;
  insert into public.user_notifications
    (user_id,type,title,message,target_url,source_key)
  values
    (target_user,'comment','Novo comentário em uma publicação',
     'Sua publicação recebeu um comentário no Fórum.',
     'forum.html?post='||new.post_id,'forum_comment:'||new.id)
  on conflict (source_key) where source_key is not null do nothing;
  return new;
end;
$$;
revoke all on function arquivo_private.notify_forum_comment() from public,anon,authenticated;
drop trigger if exists arquivo_notify_forum_comment on public.forum_comments;
create trigger arquivo_notify_forum_comment after insert on public.forum_comments
for each row execute function arquivo_private.notify_forum_comment();
