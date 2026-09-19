-- Alinha consentimentos e torna o fluxo de exclusao de conta seguro.

alter table public.forum_comments alter column user_id drop not null;

alter table public.forum_comments
  drop constraint if exists forum_comments_user_id_fkey,
  add constraint forum_comments_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete set null;

alter table public.forum_posts
  drop constraint if exists forum_posts_user_id_fkey,
  add constraint forum_posts_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete set null;

create or replace function public.record_legal_acceptance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.raw_user_meta_data ->> 'age_18_confirmed' = 'true'
     and new.raw_user_meta_data ->> 'legal_acceptance' = 'true'
     and new.raw_user_meta_data ->> 'terms_version' = '1.1'
     and new.raw_user_meta_data ->> 'privacy_version' = '1.2'
     and new.raw_user_meta_data ->> 'guidelines_version' = '1.0'
  then
    insert into public.legal_acceptances (
      user_id, age_18_confirmed, terms_version, privacy_version, guidelines_version
    ) values (
      new.id, true, '1.1', '1.2', '1.0'
    )
    on conflict (user_id, terms_version, privacy_version, guidelines_version)
    do nothing;
  end if;
  return new;
end;
$function$;

revoke all on function public.record_legal_acceptance() from public, anon, authenticated;

create or replace function public.request_account_deletion(p_content_choice text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_request_id uuid;
  v_record record;
begin
  if v_user_id is null then raise exception 'Usuario nao autenticado.'; end if;
  if p_content_choice not in ('delete_all', 'review_for_anonymization') then
    raise exception 'Opcao de exclusao invalida.';
  end if;

  select id into v_request_id
  from public.account_deletion_requests
  where user_id = v_user_id and status in ('pending', 'under_review', 'approved')
  order by requested_at desc limit 1;
  if v_request_id is not null then return v_request_id; end if;

  select email into v_email from auth.users where id = v_user_id;
  insert into public.account_deletion_requests (user_id, user_email, content_choice)
  values (v_user_id, v_email, p_content_choice)
  returning id into v_request_id;

  if p_content_choice = 'delete_all' then
    delete from public.forum_comments where user_id = v_user_id;
    delete from public.forum_posts where user_id = v_user_id;
    delete from public."Comentarios" where user_id = v_user_id;
    delete from public."Sugestoes" where user_id = v_user_id;
  else
    update public.forum_posts set account_content_state = 'pending_deletion_review' where user_id = v_user_id;
    update public.forum_comments set account_content_state = 'pending_deletion_review' where user_id = v_user_id;
    update public."Comentarios" set account_content_state = 'pending_deletion_review' where user_id = v_user_id;
    update public."Sugestoes" set account_content_state = 'pending_deletion_review' where user_id = v_user_id;

    for v_record in select * from public.forum_posts where user_id = v_user_id loop
      insert into public.account_content_review
        (deletion_request_id, former_user_id, content_type, content_table, content_id, content_snapshot)
      values (v_request_id, v_user_id, 'forum_post', 'forum_posts', v_record.id::text, to_jsonb(v_record))
      on conflict do nothing;
    end loop;
    for v_record in select * from public.forum_comments where user_id = v_user_id loop
      insert into public.account_content_review
        (deletion_request_id, former_user_id, content_type, content_table, content_id, content_snapshot)
      values (v_request_id, v_user_id, 'forum_comment', 'forum_comments', v_record.id::text, to_jsonb(v_record))
      on conflict do nothing;
    end loop;
    for v_record in select * from public."Comentarios" where user_id = v_user_id loop
      insert into public.account_content_review
        (deletion_request_id, former_user_id, content_type, content_table, content_id, content_snapshot)
      values (v_request_id, v_user_id, 'comentario', 'Comentarios', v_record.id::text, to_jsonb(v_record))
      on conflict do nothing;
    end loop;
    for v_record in select * from public."Sugestoes" where user_id = v_user_id loop
      insert into public.account_content_review
        (deletion_request_id, former_user_id, content_type, content_table, content_id, content_snapshot)
      values (v_request_id, v_user_id, 'sugestao', 'Sugestoes', v_record.id::text, to_jsonb(v_record))
      on conflict do nothing;
    end loop;
  end if;

  insert into public.admin_notifications (type, title, message, related_id, metadata)
  values (
    'account_deletion', 'Conta excluida: contribuicoes aguardam tratamento',
    case when p_content_choice = 'delete_all'
      then 'A conta e as contribuicoes do usuario foram excluidas.'
      else 'A conta foi excluida e as contribuicoes ficaram ocultas para revisao administrativa.' end,
    v_request_id,
    jsonb_build_object('former_user_id', v_user_id, 'content_choice', p_content_choice)
  );
  return v_request_id;
end;
$function$;

revoke all on function public.request_account_deletion(text) from public, anon;
grant execute on function public.request_account_deletion(text) to authenticated;

create or replace function public.review_former_user_content(p_review_id uuid, p_decision text)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare v_item public.account_content_review%rowtype;
begin
  if coalesce((auth.jwt() ->> 'role') = 'service_role', false) is not true
     and not public.is_arquivo_sombrio_admin() then
    raise exception 'Acesso administrativo necessario.';
  end if;
  if p_decision not in ('keep_anonymous', 'delete') then raise exception 'Decisao invalida.'; end if;

  select * into v_item from public.account_content_review where id = p_review_id for update;
  if not found then raise exception 'Item nao encontrado.'; end if;
  if v_item.status <> 'pending' then raise exception 'Item ja revisado.'; end if;

  if v_item.content_table = 'forum_posts' then
    if p_decision = 'keep_anonymous' then
      update public.forum_posts set user_id=null, author_name='Usuario excluido', account_content_state='anonymous' where id::text=v_item.content_id;
    else delete from public.forum_posts where id::text=v_item.content_id; end if;
  elsif v_item.content_table = 'forum_comments' then
    if p_decision = 'keep_anonymous' then
      update public.forum_comments set user_id=null, author_name='Usuario excluido', account_content_state='anonymous' where id::text=v_item.content_id;
    else delete from public.forum_comments where id::text=v_item.content_id; end if;
  elsif v_item.content_table = 'Comentarios' then
    if p_decision = 'keep_anonymous' then
      update public."Comentarios" set user_id=null, nome='Usuario excluido', email=null, account_content_state='anonymous' where id::text=v_item.content_id;
    else delete from public."Comentarios" where id::text=v_item.content_id; end if;
  elsif v_item.content_table = 'Sugestoes' then
    if p_decision = 'keep_anonymous' then
      update public."Sugestoes" set user_id=null, nome='Usuario excluido', email=null, account_content_state='anonymous' where id::text=v_item.content_id;
    else delete from public."Sugestoes" where id::text=v_item.content_id; end if;
  else raise exception 'Tipo de conteudo nao reconhecido.';
  end if;

  update public.account_content_review
  set status=case when p_decision='keep_anonymous' then 'approved_anonymous' else 'deleted' end,
      admin_decision=p_decision, reviewed_at=now(), reviewed_by=auth.uid()
  where id=p_review_id;

  if not exists (select 1 from public.account_content_review where deletion_request_id=v_item.deletion_request_id and status='pending') then
    update public.account_deletion_requests
    set status='completed', completed_at=now(), reviewed_at=coalesce(reviewed_at,now()), reviewed_by=coalesce(reviewed_by,auth.uid())
    where id=v_item.deletion_request_id;
  end if;
end;
$function$;

revoke all on function public.review_former_user_content(uuid,text) from public, anon;
grant execute on function public.review_former_user_content(uuid,text) to authenticated, service_role;

drop policy if exists "Leitura publica de posts ativos" on public.forum_posts;
create policy "Leitura publica de posts ativos" on public.forum_posts for select to anon
using (status='publicado' and account_content_state in ('active','anonymous'));

drop policy if exists "Usuarios veem posts permitidos" on public.forum_posts;
create policy "Usuarios veem posts permitidos" on public.forum_posts for select to authenticated
using (public.is_arquivo_sombrio_admin() or (select auth.uid())=user_id or (status='publicado' and account_content_state in ('active','anonymous')));

drop policy if exists "Leitura publica de comentarios ativos" on public.forum_comments;
create policy "Leitura publica de comentarios ativos" on public.forum_comments for select to anon
using (account_content_state in ('active','anonymous'));

drop policy if exists "Usuarios veem comentarios permitidos" on public.forum_comments;
create policy "Usuarios veem comentarios permitidos" on public.forum_comments for select to authenticated
using (public.is_arquivo_sombrio_admin() or (select auth.uid())=user_id or account_content_state in ('active','anonymous'));

drop policy if exists "Visitantes podem ver comentarios aprovados" on public."Comentarios";
create policy "Visitantes podem ver comentarios aprovados" on public."Comentarios" for select to anon
using (status='aprovado' and account_content_state in ('active','anonymous'));

drop policy if exists "Usuarios veem comentarios permitidos" on public."Comentarios";
create policy "Usuarios veem comentarios permitidos" on public."Comentarios" for select to authenticated
using (public.is_arquivo_sombrio_admin() or (select auth.uid())=user_id or (status='aprovado' and account_content_state in ('active','anonymous')));
