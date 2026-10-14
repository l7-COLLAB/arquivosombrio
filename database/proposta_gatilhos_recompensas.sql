-- Executar somente após revisar no Supabase. Eventos verificados pelo banco.
create or replace function public.investigator_award_activity() returns trigger language plpgsql security definer set search_path='' as $$
declare kind text; points integer; source text; owner_id uuid; approved boolean;
begin
 if TG_TABLE_NAME='user_favorites' then
  kind:='favorite'; points:=3; source:=new.item_type||':'||new.item_id; owner_id:=new.user_id; approved:=true;
 elsif TG_TABLE_NAME='forum_posts' then
  kind:='forum_post'; points:=15; source:=new.id::text; owner_id:=new.user_id; approved:=new.status='publicado' and length(trim(coalesce(new.content,'')))>=80;
 elsif TG_TABLE_NAME='forum_comments' then
  kind:='forum_comment'; points:=10; source:=new.id::text; owner_id:=new.user_id; approved:=length(trim(coalesce(new.content,'')))>=40;
 else return new; end if;
 if owner_id is null or not approved then return new; end if;
 -- No máximo 3 recompensas por categoria/dia. Limita incentivo ao spam.
 if (select count(*) from public.investigator_events where user_id=owner_id and event_type=kind and created_at >= date_trunc('day',now()))>=3 then return new; end if;
 insert into public.investigator_events(user_id,event_type,source_type,source_id,xp_delta)
 values(owner_id,kind,TG_TABLE_NAME,source,points) on conflict do nothing;
 if found then
  insert into public.investigator_profiles(user_id,lifetime_xp) values(owner_id,points)
  on conflict(user_id) do update set lifetime_xp=public.investigator_profiles.lifetime_xp+excluded.lifetime_xp,updated_at=now();
 end if;
 return new;
end $$;
revoke all on function public.investigator_award_activity() from public,anon,authenticated;
create trigger investigator_favorite_reward after insert on public.user_favorites for each row execute function public.investigator_award_activity();
create trigger investigator_forum_post_reward after insert on public.forum_posts for each row execute function public.investigator_award_activity();
create trigger investigator_forum_comment_reward after insert on public.forum_comments for each row execute function public.investigator_award_activity();
-- Leituras completas, sugestões aprovadas, medalhas e privilégios exigem validadores próprios.
