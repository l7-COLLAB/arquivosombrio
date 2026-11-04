-- Impede comentários entre usuários que bloquearam um ao outro.
create or replace function arquivo_private.guard_blocked_forum_comment()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare post_author uuid;
begin
  if new.user_id is null then return new; end if;
  if (select auth.uid()) is distinct from new.user_id then
    raise exception 'Comentários exigem a identidade autenticada do autor';
  end if;
  select p.user_id into post_author from public.forum_posts p where p.id=new.post_id;
  if post_author is not null and post_author <> new.user_id and exists (
    select 1 from public.user_blocks b
      where (b.user_id=post_author and b.blocked_user_id=new.user_id)
         or (b.user_id=new.user_id and b.blocked_user_id=post_author)
  ) then
    raise exception 'Interação não disponível entre usuários bloqueados';
  end if;
  return new;
end;
$$;
revoke all on function arquivo_private.guard_blocked_forum_comment() from public,anon,authenticated;
drop trigger if exists arquivo_guard_blocked_forum_comment on public.forum_comments;
create trigger arquivo_guard_blocked_forum_comment before insert on public.forum_comments
for each row execute function arquivo_private.guard_blocked_forum_comment();
