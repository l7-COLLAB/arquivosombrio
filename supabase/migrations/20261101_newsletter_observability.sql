-- Etapa 11: observabilidade privada e simulacao read-only.
-- Sem envio, sem agendamento e sem acesso a e-mails/tokens em respostas.
begin;

create or replace function public.editorial_newsletter_monitor_snapshot()
returns jsonb language sql stable security invoker set search_path = ''
as $$
with q as (
 select
  count(*)::integer total,
  count(*) filter(where status='preparado')::integer prepared,
  count(*) filter(where status='em_envio')::integer sending,
  count(*) filter(where status='aceito')::integer accepted,
  count(*) filter(where status='entregue')::integer delivered,
  count(*) filter(where status='falhou')::integer failed,
  count(*) filter(where status='incerto')::integer uncertain,
  count(*) filter(where status='cancelado')::integer cancelled,
  count(*) filter(where status='bounce')::integer bounced,
  count(*) filter(where status='reclamacao')::integer complained,
  count(*) filter(where dispatch_started_at>=pg_catalog.now()-interval '24 hours')::integer attempts_24h,
  count(*) filter(where dispatch_started_at>=pg_catalog.now()-interval '7 days')::integer attempts_7d,
  count(*) filter(where status='em_envio' and dispatch_started_at < pg_catalog.now()-interval '15 minutes')::integer stalled_15m,
  count(*) filter(where status='aceito' and updated_at < pg_catalog.now()-interval '48 hours')::integer accepted_48h,
  max(dispatch_started_at) last_dispatch_at
 from public.editorial_newsletter_delivery_queue
), s as (
 select
  count(*) filter(where status='confirmado')::integer confirmed,
  count(*) filter(where status='pendente')::integer pending,
  count(*) filter(where status='cancelado')::integer unsubscribed
 from public.editorial_newsletter_subscribers
), e as (
 select count(*) filter(where status='aprovado')::integer approved
 from public.editorial_newsletter_editions
), ev as (
 select count(*) filter(where recorded_at>=pg_catalog.now()-interval '7 days')::integer events_7d,
  max(recorded_at) last_event_at
 from public.editorial_newsletter_delivery_events
)
select pg_catalog.jsonb_build_object(
 'generated_at',pg_catalog.now(),
 'subscribers',pg_catalog.jsonb_build_object(
  'confirmed',s.confirmed,'pending',s.pending,'cancelled',s.unsubscribed),
 'editions',pg_catalog.jsonb_build_object('approved',e.approved),
 'delivery',pg_catalog.jsonb_build_object(
  'total',q.total,'prepared',q.prepared,'sending',q.sending,
  'accepted',q.accepted,'delivered',q.delivered,'failed',q.failed,
  'uncertain',q.uncertain,'cancelled',q.cancelled,
  'bounced',q.bounced,'complained',q.complained),
 'activity',pg_catalog.jsonb_build_object(
  'attempts_24h',q.attempts_24h,'attempts_7d',q.attempts_7d,
  'remaining_daily_quota',greatest(0,50-q.attempts_24h),
  'events_7d',ev.events_7d,
  'last_dispatch_at',q.last_dispatch_at,'last_event_at',ev.last_event_at),
 'attention',pg_catalog.jsonb_build_object(
  'stalled_15m',q.stalled_15m,'accepted_over_48h',q.accepted_48h,
  'uncertain',q.uncertain,'failed',q.failed,
  'bounced',q.bounced,'complained',q.complained)
)
from q cross join s cross join e cross join ev;
$$;
revoke all on function public.editorial_newsletter_monitor_snapshot()
 from public,anon,authenticated;
grant execute on function public.editorial_newsletter_monitor_snapshot()
 to service_role;

create or replace function public.editorial_newsletter_simulate_dispatch(p_edition uuid)
returns jsonb language sql stable security invoker set search_path = ''
as $$
with candidate as (
 select q.status as delivery_status,s.status as subscriber_status,s.confirmed_at,
 exists(
  select 1 from public.editorial_newsletter_delivery_queue prior
  where prior.subscriber_id=q.subscriber_id and prior.id<>q.id
   and prior.dispatch_started_at>=pg_catalog.now()-interval '7 days'
   and prior.status in ('em_envio','aceito','entregue','incerto','bounce','reclamacao')
 ) as in_cooldown
 from public.editorial_newsletter_delivery_queue q
 join public.editorial_newsletter_subscribers s on s.id=q.subscriber_id
 where q.edition_id=p_edition
), totals as (
 select
  count(*)::integer all_rows,
  count(*) filter(where delivery_status='preparado')::integer prepared,
  count(*) filter(where delivery_status='preparado'
     and (subscriber_status<>'confirmado' or confirmed_at is null))::integer unconfirmed,
  count(*) filter(where delivery_status='preparado'
     and subscriber_status='confirmado' and confirmed_at is not null
     and in_cooldown)::integer cooldown,
  count(*) filter(where delivery_status='preparado'
     and subscriber_status='confirmado' and confirmed_at is not null
     and not in_cooldown)::integer eligible
 from candidate
), quota as (
 select greatest(0,50-count(*)::integer) remaining
 from public.editorial_newsletter_delivery_queue
 where dispatch_started_at>=pg_catalog.now()-interval '24 hours'
), edition as (
 select coalesce((select status from public.editorial_newsletter_editions where id=p_edition),'nao_encontrada') state
)
select pg_catalog.jsonb_build_object(
 'edition_status',edition.state,
 'queued_total',totals.all_rows,
 'prepared',totals.prepared,
 'not_confirmed',totals.unconfirmed,
 'cooldown',totals.cooldown,
 'eligible_now',case when edition.state='aprovado' then totals.eligible else 0 end,
 'daily_quota_remaining',quota.remaining,
 'would_claim',case when edition.state='aprovado'
   then least(5,quota.remaining,totals.eligible) else 0 end,
 'simulation_only',true
)
from totals cross join quota cross join edition;
$$;
revoke all on function public.editorial_newsletter_simulate_dispatch(uuid)
 from public,anon,authenticated;
grant execute on function public.editorial_newsletter_simulate_dispatch(uuid)
 to service_role;
commit;
