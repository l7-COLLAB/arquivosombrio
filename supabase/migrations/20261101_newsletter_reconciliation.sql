-- Etapa 13: reconciliação administrativa conservadora e leitura de incidentes.
-- Mensagens com estado desconhecido nunca voltam à fila de envio.
begin;

create or replace function public.editorial_newsletter_list_incidents(p_limit integer default 10)
returns jsonb language plpgsql stable security invoker set search_path = ''
as $$
declare response jsonb;
begin
 if p_limit is null or p_limit < 1 or p_limit > 20 then
  raise exception 'Limite inválido' using errcode='22023';
 end if;

 select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
  'delivery_id',i.id,
  'status',i.status,
  'dispatch_started_at',i.dispatch_started_at,
  'elapsed_minutes',i.elapsed_minutes,
  'has_provider_id',i.has_provider_id,
  'can_mark_uncertain',i.can_mark_uncertain
 ) order by i.dispatch_started_at nulls last,i.id),'[]'::jsonb)
 into response
 from (
  select q.id,q.status,q.dispatch_started_at,
   greatest(0,floor(extract(epoch from (pg_catalog.now()-q.dispatch_started_at))/60))::integer elapsed_minutes,
   q.provider_message_id is not null has_provider_id,
   q.status='em_envio'
    and q.provider_message_id is null
    and q.dispatch_started_at <= pg_catalog.now()-interval '15 minutes' can_mark_uncertain
  from public.editorial_newsletter_delivery_queue q
  where (q.status='em_envio'
      and q.dispatch_started_at <= pg_catalog.now()-interval '15 minutes')
     or q.status='incerto'
     or (q.status='aceito'
      and q.updated_at <= pg_catalog.now()-interval '48 hours')
  order by q.dispatch_started_at nulls last,q.id
  limit p_limit
 ) i;

 return response;
end;
$$;

revoke all on function public.editorial_newsletter_list_incidents(integer)
 from public,anon,authenticated;
grant execute on function public.editorial_newsletter_list_incidents(integer)
 to service_role;

create or replace function public.editorial_newsletter_mark_stale_uncertain(p_delivery uuid)
returns boolean language plpgsql volatile security invoker set search_path = ''
as $$
declare affected integer;
begin
 if p_delivery is null then
  raise exception 'Identificador obrigatório' using errcode='22023';
 end if;

 update public.editorial_newsletter_delivery_queue
 set status='incerto',updated_at=pg_catalog.now()
 where id=p_delivery
  and status='em_envio'
  and attempts>=1
  and provider_message_id is null
  and dispatch_started_at <= pg_catalog.now()-interval '15 minutes';

 get diagnostics affected=row_count;
 return affected=1;
end;
$$;

revoke all on function public.editorial_newsletter_mark_stale_uncertain(uuid)
 from public,anon,authenticated;
grant execute on function public.editorial_newsletter_mark_stale_uncertain(uuid)
 to service_role;

commit;
