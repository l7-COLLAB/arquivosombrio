begin;
alter table public."Casos" add column acompanhamento_status text not null default 'normal' check (acompanhamento_status in ('normal','ativo','encerrado')), add column acompanhamento_encerrado_em timestamptz;
alter table public.casos_diarios add column acompanhamento_status text not null default 'normal' check (acompanhamento_status in ('normal','ativo','encerrado')), add column acompanhamento_encerrado_em timestamptz;
create table public.case_updates (
 id uuid primary key default gen_random_uuid(),
 dossier_id bigint references public."Casos"(id) on delete cascade,
 daily_id bigint references public.casos_diarios(id) on delete cascade,
 update_date date not null,
 title text not null default '' check (length(title)<=200),
 body text not null check (length(trim(body)) between 1 and 30000),
 information_type text not null default 'fato_confirmado' check (information_type in ('fato_confirmado','testemunho','hipotese','controversia','nao_confirmado','correcao')),
 sources jsonb not null default '[]'::jsonb check (jsonb_typeof(sources)='array'),
 position integer not null default 0,
 deleted_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (num_nonnulls(dossier_id,daily_id)=1)
);
create index case_updates_dossier_date on public.case_updates(dossier_id,update_date desc,position,id) where deleted_at is null;
create index case_updates_daily_date on public.case_updates(daily_id,update_date desc,position,id) where deleted_at is null;
create table public.case_update_history (
 id bigint generated always as identity primary key,
 update_id uuid not null references public.case_updates(id) on delete cascade,
 snapshot jsonb not null,
 changed_at timestamptz not null default now(),
 changed_by uuid default auth.uid()
);
alter table public.case_updates enable row level security;
alter table public.case_update_history enable row level security;
grant select on public.case_updates to anon,authenticated;
grant insert,update on public.case_updates to authenticated;
grant select,insert on public.case_update_history to authenticated;
grant usage,select on sequence public.case_update_history_id_seq to authenticated;
create policy case_updates_public_read on public.case_updates for select to anon,authenticated using (
 (deleted_at is null and ((dossier_id is not null and exists(select 1 from public."Casos" c where c.id=dossier_id and c.status_publicacao='publicado')) or (daily_id is not null and exists(select 1 from public.casos_diarios c where c.id=daily_id and c.status_publicacao='publicado')))) or (select public.is_arquivo_sombrio_admin())
);
create policy case_updates_admin_insert on public.case_updates for insert to authenticated with check ((select public.is_arquivo_sombrio_admin()));
create policy case_updates_admin_update on public.case_updates for update to authenticated using ((select public.is_arquivo_sombrio_admin())) with check ((select public.is_arquivo_sombrio_admin()));
create policy case_update_history_admin_read on public.case_update_history for select to authenticated using ((select public.is_arquivo_sombrio_admin()));
create policy case_update_history_admin_insert on public.case_update_history for insert to authenticated with check ((select public.is_arquivo_sombrio_admin()));
create function public.validate_case_update() returns trigger language plpgsql security invoker set search_path='' as $$
declare s jsonb;
begin
 if new.update_date > (now() at time zone 'America/Sao_Paulo')::date then raise exception 'A data da atualização não pode estar no futuro.'; end if;
 if jsonb_array_length(new.sources)>30 then raise exception 'Máximo de 30 fontes por atualização.'; end if;
 for s in select value from jsonb_array_elements(new.sources) loop
  if jsonb_typeof(s)<>'object' or coalesce(length(trim(s->>'titulo')),0) not between 1 and 300 or coalesce(s->>'url','') !~ '^(https?://[^[:space:]]+)?$' or length(coalesce(s->>'url',''))>2000 then raise exception 'Fonte inválida: informe título e URL HTTP/HTTPS opcional.'; end if;
 end loop;
 if tg_op='UPDATE' then
  if new.dossier_id is distinct from old.dossier_id or new.daily_id is distinct from old.daily_id then raise exception 'Não é permitido transferir uma atualização para outro arquivo.'; end if;
  insert into public.case_update_history(update_id,snapshot) values(old.id,to_jsonb(old));
  new.created_at=old.created_at;
 end if;
 new.updated_at=clock_timestamp();
 return new;
end $$;
create trigger validate_case_update before insert or update on public.case_updates for each row execute function public.validate_case_update();
create function public.validate_case_tracking() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.acompanhamento_status='encerrado' then
  if tg_op='INSERT' or old.acompanhamento_status is distinct from 'encerrado' then new.acompanhamento_encerrado_em=now(); else new.acompanhamento_encerrado_em=old.acompanhamento_encerrado_em; end if;
 else new.acompanhamento_encerrado_em=null;
 end if;
 return new;
end $$;
create trigger validate_case_tracking before insert or update of acompanhamento_status,acompanhamento_encerrado_em on public."Casos" for each row execute function public.validate_case_tracking();
create trigger validate_daily_tracking before insert or update of acompanhamento_status,acompanhamento_encerrado_em on public.casos_diarios for each row execute function public.validate_case_tracking();
-- Aggregation preserves the original publication date. Invoker view enforces parent RLS.
create view public.case_tracking_summary with (security_invoker=true) as
 select 'dossie'::text content_type,c.id,c.acompanhamento_status,c.acompanhamento_encerrado_em,c.published_at published_at,c.updated_at content_modified_at,
 max(u.update_date) filter (where u.deleted_at is null) latest_update_date,max(u.updated_at) updates_modified_at
 from public."Casos" c left join public.case_updates u on u.dossier_id=c.id group by c.id
 union all
 select 'garimpo'::text,c.id,c.acompanhamento_status,c.acompanhamento_encerrado_em,c.publicado_em,c.updated_at,max(u.update_date) filter (where u.deleted_at is null),max(u.updated_at)
 from public.casos_diarios c left join public.case_updates u on u.daily_id=c.id group by c.id;
grant select on public.case_tracking_summary to anon,authenticated;
-- No privileged publicly callable function is introduced.
revoke all on function public.validate_case_update(),public.validate_case_tracking() from public,anon,authenticated;
commit;
