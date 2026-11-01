-- Etapa 9: fila editorial privada, deduplicacao e trilha de entregas.
-- Esta migracao NAO envia e-mails, NAO executa cron e NAO habilita campanha.
begin;

create table if not exists public.editorial_newsletter_delivery_queue (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.editorial_newsletter_editions(id) on delete restrict,
  subscriber_id uuid not null references public.editorial_newsletter_subscribers(id) on delete restrict,
  status text not null default 'preparado'
    check (status in ('preparado','cancelado','em_envio','aceito','entregue','falhou','incerto','bounce','reclamacao')),
  provider_message_id text,
  attempts integer not null default 0 check (attempts between 0 and 10),
  queued_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (edition_id,subscriber_id)
);
comment on table public.editorial_newsletter_delivery_queue is
  'Fila privada para futuro envio; unique(edition_id,subscriber_id) impede duplicidade. Preparar nao envia.';
create index if not exists editorial_newsletter_delivery_queue_status_idx
  on public.editorial_newsletter_delivery_queue(status,queued_at);
create index if not exists editorial_newsletter_delivery_queue_subscriber_idx
  on public.editorial_newsletter_delivery_queue(subscriber_id,status);

create table if not exists public.editorial_newsletter_delivery_events (
  id bigint generated always as identity primary key,
  delivery_id uuid not null references public.editorial_newsletter_delivery_queue(id) on delete restrict,
  event_type text not null
    check (event_type in ('preparado','cancelado','em_envio','aceito','entregue','falhou','incerto','bounce','reclamacao')),
  provider_event_id text,
  recorded_at timestamptz not null default now(),
  notes text check (char_length(notes) <= 500),
  unique(provider_event_id)
);
comment on table public.editorial_newsletter_delivery_events is
  'Trilha privada e auditavel para integracao futura de webhooks Resend; sem e-mails ou tokens.';
create index if not exists editorial_newsletter_delivery_events_delivery_idx
  on public.editorial_newsletter_delivery_events(delivery_id,recorded_at desc);

alter table public.editorial_newsletter_delivery_queue enable row level security;
alter table public.editorial_newsletter_delivery_events enable row level security;
revoke all on public.editorial_newsletter_delivery_queue from public,anon,authenticated;
revoke all on public.editorial_newsletter_delivery_events from public,anon,authenticated;
revoke all on sequence public.editorial_newsletter_delivery_events_id_seq from public,anon,authenticated;
grant select,insert,update on public.editorial_newsletter_delivery_queue to service_role;
grant select,insert,update on public.editorial_newsletter_delivery_events to service_role;
grant usage,select on sequence public.editorial_newsletter_delivery_events_id_seq to service_role;

-- A Edge Function autorizada utiliza service_role para executar esta funcao.
-- SECURITY INVOKER preserva permissoes reais, sem bypass por DEFINER.
create or replace function public.editorial_prepare_newsletter_queue(p_edition uuid)
returns integer language plpgsql security invoker set search_path = ''
as $$
declare
  inserted integer := 0;
begin
  if p_edition is null or not exists (
    select 1 from public.editorial_newsletter_editions
    where id = p_edition and status = 'aprovado'
  ) then
    raise exception 'Edição não está aprovada para preparação' using errcode = '22023';
  end if;

  insert into public.editorial_newsletter_delivery_queue (edition_id,subscriber_id,status)
  select p_edition, s.id, 'preparado'
  from public.editorial_newsletter_subscribers s
  where s.status = 'confirmado' and s.confirmed_at is not null
  on conflict (edition_id,subscriber_id) do nothing;

  get diagnostics inserted = row_count;
  return inserted;
end;
$$;
revoke all on function public.editorial_prepare_newsletter_queue(uuid) from public,anon,authenticated;
grant execute on function public.editorial_prepare_newsletter_queue(uuid) to service_role;

-- Uma edicao com fila preparada fica imutavel; revise e aprove outra edicao
-- caso seja necessario alterar conteudo. Updated_at sozinho e permitido.
create or replace function public.editorial_block_queued_edition_changes()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if exists (select 1 from public.editorial_newsletter_delivery_queue q where q.edition_id = old.id)
    and (new.title,new.subject,new.preheader,new.body_text,new.cta_label,new.cta_url,new.status)
      is distinct from (old.title,old.subject,old.preheader,old.body_text,old.cta_label,old.cta_url,old.status)
  then
    raise exception 'Edição com fila preparada não pode ser alterada' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.editorial_block_queued_edition_changes() from public,anon,authenticated;
drop trigger if exists editorial_block_queued_edition_changes on public.editorial_newsletter_editions;
create trigger editorial_block_queued_edition_changes
before update on public.editorial_newsletter_editions
for each row execute function public.editorial_block_queued_edition_changes();

commit;
