-- Etapa 10: reivindicação atômica de lotes e eventos verificados, sem cron.
-- Nenhuma migração altera as flags de envio; a Edge Function exige ativação adicional.
begin;
alter table public.editorial_newsletter_delivery_queue
 add column if not exists dispatch_started_at timestamptz;
create unique index if not exists editorial_newsletter_delivery_provider_id_uidx
 on public.editorial_newsletter_delivery_queue(provider_message_id)
 where provider_message_id is not null;
create index if not exists editorial_newsletter_delivery_dispatch_idx
 on public.editorial_newsletter_delivery_queue(dispatch_started_at)
 where dispatch_started_at is not null;

-- O advisory lock serializa a reserva de lotes e o cálculo da cota diária global.
-- Envios com retorno incerto nunca são recolocados em 'preparado'.
create or replace function public.editorial_claim_newsletter_batch(
 p_edition uuid, p_limit integer default 5
)
returns table(
 delivery_id uuid, subscriber_id uuid, recipient_email text,
 mail_subject text, mail_preheader text, mail_body text,
 mail_cta_label text, mail_cta_url text
)
language plpgsql security invoker set search_path = ''
as $$
declare quota_used integer; limit_allowed integer;
begin
 if p_edition is null or p_limit is null or p_limit < 1 or p_limit > 5 then
  raise exception 'Lote inválido' using errcode = '22023';
 end if;
 perform pg_catalog.pg_advisory_xact_lock(21400,1001);
 select count(*)::integer into quota_used
 from public.editorial_newsletter_delivery_queue q
 where q.dispatch_started_at >= pg_catalog.now() - interval '24 hours';
 limit_allowed := pg_catalog.least(p_limit,pg_catalog.greatest(0,50-quota_used));
 if limit_allowed <= 0 then return; end if;
 return query
 with eligible as (
  select q.id
  from public.editorial_newsletter_delivery_queue q
  join public.editorial_newsletter_subscribers s on s.id=q.subscriber_id
  join public.editorial_newsletter_editions e on e.id=q.edition_id
  where q.edition_id=p_edition
   and q.status='preparado' and q.attempts=0
   and s.status='confirmado' and s.confirmed_at is not null
   and e.status='aprovado'
   and not exists (
    select 1 from public.editorial_newsletter_delivery_queue recent
    where recent.subscriber_id=q.subscriber_id and recent.id<>q.id
     and recent.dispatch_started_at>=pg_catalog.now()-interval '7 days'
     and recent.status in ('em_envio','aceito','entregue','incerto','bounce','reclamacao')
   )
  order by q.queued_at,q.id
  for update of q skip locked
  limit limit_allowed
 ), claimed as (
  update public.editorial_newsletter_delivery_queue q
   set status='em_envio',attempts=q.attempts+1,
       dispatch_started_at=pg_catalog.now(),updated_at=pg_catalog.now()
   from eligible v where q.id=v.id
   returning q.id,q.edition_id,q.subscriber_id
 )
 select c.id,s.id,s.email,e.subject,e.preheader,e.body_text,e.cta_label,e.cta_url
 from claimed c
 join public.editorial_newsletter_subscribers s on s.id=c.subscriber_id
 join public.editorial_newsletter_editions e on e.id=c.edition_id;
end;
$$;
revoke all on function public.editorial_claim_newsletter_batch(uuid,integer) from public,anon,authenticated;
grant execute on function public.editorial_claim_newsletter_batch(uuid,integer) to service_role;

-- Novo teste de elegibilidade ANTES do contato com a Resend.
create or replace function public.editorial_newsletter_can_send(p_delivery uuid)
returns boolean language sql stable security invoker set search_path = ''
as $$
 select exists (
  select 1 from public.editorial_newsletter_delivery_queue q
  join public.editorial_newsletter_subscribers s on s.id=q.subscriber_id
  join public.editorial_newsletter_editions e on e.id=q.edition_id
  where q.id=p_delivery and q.status='em_envio'
  and s.status='confirmado' and s.confirmed_at is not null
  and e.status='aprovado'
 );
$$;
revoke all on function public.editorial_newsletter_can_send(uuid) from public,anon,authenticated;
grant execute on function public.editorial_newsletter_can_send(uuid) to service_role;

create or replace function public.editorial_finish_newsletter_delivery(
 p_delivery uuid,p_status text,p_provider_id text default null
)
returns boolean language plpgsql security invoker set search_path = ''
as $$
declare changed integer;
begin
 if p_status not in ('aceito','falhou','incerto','cancelado') then
  raise exception 'Estado inválido' using errcode='22023';
 end if;
 if p_provider_id is not null and (char_length(p_provider_id)>180 or char_length(p_provider_id)<3) then
  raise exception 'Identificador inválido' using errcode='22023';
 end if;
 update public.editorial_newsletter_delivery_queue
  set status=p_status,
      provider_message_id=case when p_status='aceito' then p_provider_id else null end,
      updated_at=pg_catalog.now()
 where id=p_delivery and status='em_envio';
 get diagnostics changed=row_count;
 return changed=1;
end;
$$;
revoke all on function public.editorial_finish_newsletter_delivery(uuid,text,text) from public,anon,authenticated;
grant execute on function public.editorial_finish_newsletter_delivery(uuid,text,text) to service_role;

-- Apenas eventos com assinatura Svix verificada no backend chegam nesta RPC.
-- O svix-id é a chave única para ignorar retransmissões.
create or replace function public.editorial_record_newsletter_provider_event(
 p_provider_id text,p_event_id text,p_event_type text
)
returns boolean language plpgsql security invoker set search_path = ''
as $$
declare delivery uuid; subscriber uuid; new_status text;
begin
 if p_provider_id is null or char_length(p_provider_id) not between 3 and 180
   or p_event_id is null or char_length(p_event_id) not between 3 and 180
 then raise exception 'Parâmetros inválidos' using errcode='22023'; end if;
 new_status:=case p_event_type
  when 'email.sent' then 'aceito'
  when 'email.delivered' then 'entregue'
  when 'email.bounced' then 'bounce'
  when 'email.complained' then 'reclamacao'
  when 'email.failed' then 'falhou'
  when 'email.suppressed' then 'bounce'
  else null end;
 if new_status is null then return false; end if;
 select q.id,q.subscriber_id into delivery,subscriber
 from public.editorial_newsletter_delivery_queue q
 where q.provider_message_id=p_provider_id for update;
 if not found then raise exception 'Mensagem ainda não registrada' using errcode='P0002'; end if;
 if exists(select 1 from public.editorial_newsletter_delivery_events ev where ev.provider_event_id=p_event_id) then
  return false;
 end if;
 insert into public.editorial_newsletter_delivery_events
  (delivery_id,event_type,provider_event_id)
 values(delivery,new_status,p_event_id);
 update public.editorial_newsletter_delivery_queue q
 set status=case
   when q.status in ('reclamacao','bounce') then q.status
   when new_status in ('reclamacao','bounce') then new_status
   when q.status='entregue' then q.status
   when new_status='entregue' then 'entregue'
   when q.status='falhou' then q.status
   when new_status='falhou' then 'falhou'
   when q.status='aceito' then q.status
   else new_status end,
 updated_at=pg_catalog.now()
 where q.id=delivery;
 if new_status in ('bounce','reclamacao') then
  update public.editorial_newsletter_subscribers
   set status='cancelado',cancelled_at=coalesce(cancelled_at,pg_catalog.now())
  where id=subscriber and status='confirmado';
  update public.editorial_newsletter_delivery_queue
   set status='cancelado',updated_at=pg_catalog.now()
  where subscriber_id=subscriber and status='preparado';
 end if;
 return true;
end;
$$;
revoke all on function public.editorial_record_newsletter_provider_event(text,text,text) from public,anon,authenticated;
grant execute on function public.editorial_record_newsletter_provider_event(text,text,text) to service_role;
commit;
