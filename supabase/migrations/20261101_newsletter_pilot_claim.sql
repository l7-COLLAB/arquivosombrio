begin;
create or replace function public.editorial_claim_newsletter_batch(
 p_edition uuid, p_limit integer, p_pilot_email text
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
 if p_pilot_email is not null and (pg_catalog.length(p_pilot_email)>254 or p_limit<>1) then
  raise exception 'Teste piloto inválido' using errcode='22023';
 end if;
 perform pg_catalog.pg_advisory_xact_lock(21400,1001);
 select count(*)::integer into quota_used
 from public.editorial_newsletter_delivery_queue q
 where q.dispatch_started_at >= pg_catalog.now() - interval '24 hours';
 limit_allowed := least(p_limit,greatest(0,50-quota_used));
 if limit_allowed <= 0 then return; end if;
 return query
 with eligible as (
  select q.id
  from public.editorial_newsletter_delivery_queue q
  join public.editorial_newsletter_subscribers s on s.id=q.subscriber_id
  join public.editorial_newsletter_editions e on e.id=q.edition_id
  where q.edition_id=p_edition
   and (p_pilot_email is null or pg_catalog.lower(s.email)=pg_catalog.lower(p_pilot_email))
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

revoke all on function public.editorial_claim_newsletter_batch(uuid,integer,text) from public,anon,authenticated;
grant execute on function public.editorial_claim_newsletter_batch(uuid,integer,text) to service_role;
commit;
