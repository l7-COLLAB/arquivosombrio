-- Fase 6.8 — projeto para banco de TESTES, nao executar diretamente em producao.
-- Substitui o SQL da fase 6.6; NAO executar ambos.
-- Apenas dossies e Garimpo, sem publicacao, sem alterar tabelas brasileiras.
begin;

create table if not exists public.international_content_versions (
 id uuid primary key default gen_random_uuid(),
 source_type text not null check (source_type in ('dossie','garimpo')),
 dossier_id bigint references public."Casos"(id) on delete restrict,
 daily_case_id bigint references public.casos_diarios(id) on delete restrict,
 locale text not null check (locale in ('en-US','es-ES','fr-FR')),
 editorial_status text not null default 'draft' check (editorial_status in ('draft','in_review')),
 revision integer not null default 1 check (revision > 0),
 source_updated_at timestamptz not null,
 translated_title text not null default '',
 translated_summary text not null default '',
 body_blocks jsonb not null default '[]'::jsonb check (pg_catalog.jsonb_typeof(body_blocks)='array'),
 translated_sources jsonb not null default '[]'::jsonb check (pg_catalog.jsonb_typeof(translated_sources)='array'),
 translator_user_id uuid references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint international_source_xor check (
 (source_type='dossie' and dossier_id is not null and daily_case_id is null)
 or (source_type='garimpo' and daily_case_id is not null and dossier_id is null)
 )
);
create unique index if not exists international_dossier_locale_v68
 on public.international_content_versions(dossier_id,locale) where dossier_id is not null;
create unique index if not exists international_daily_locale_v68
 on public.international_content_versions(daily_case_id,locale) where daily_case_id is not null;

create table if not exists public.international_content_audit (
 id bigint generated always as identity primary key,
 translation_id uuid not null references public.international_content_versions(id) on delete restrict,
 actor_id uuid not null references auth.users(id),
 action text not null check (action in ('create_draft','save_draft','submit_review','return_draft')),
 from_revision integer,
 to_revision integer not null,
 occurred_at timestamptz not null default now()
);
create index if not exists international_audit_translation_idx
 on public.international_content_audit(translation_id,occurred_at desc);

alter table public.international_content_versions enable row level security;
alter table public.international_content_audit enable row level security;
revoke all on public.international_content_versions from public,anon,authenticated;
revoke all on public.international_content_audit from public,anon,authenticated;
-- Somente leitura administrativa via RLS. Escritas exclusivamente por RPC.
grant select on public.international_content_versions to authenticated;
grant select on public.international_content_audit to authenticated;
drop policy if exists international_68_admin_read on public.international_content_versions;
create policy international_68_admin_read on public.international_content_versions
 for select to authenticated using ((select public.is_arquivo_sombrio_admin()));
drop policy if exists international_68_audit_admin_read on public.international_content_audit;
create policy international_68_audit_admin_read on public.international_content_audit
 for select to authenticated using ((select public.is_arquivo_sombrio_admin()));

-- Função privilegiada revisável: grant EXECUTE explicito, search_path vazio,
-- verificação de admin e auth.uid() na entrada, sem parâmetros SQL dinamicos.
create or replace function public.international_save_draft(
 p_source_type text,p_source_id bigint,p_locale text,p_expected_revision integer,
 p_title text,p_summary text,p_blocks jsonb,p_sources jsonb
) returns table(translation_id uuid,new_revision integer) language plpgsql
 security definer set search_path = '' as $$
declare
 v_uid uuid;v_source_time timestamptz;v_record public.international_content_versions%rowtype;
begin
 v_uid := auth.uid();
 -- Exigir sessao ativa: um JWT ainda valido nao basta quando sessao foi revogada.
 if v_uid is not null and not exists (
   select 1 from auth.sessions ses where ses.id = nullif(auth.jwt()->>'session_id','')::uuid and ses.user_id=v_uid
 ) then raise exception 'session invalid' using errcode='42501'; end if;
 if v_uid is null or not public.is_arquivo_sombrio_admin() then
   raise exception 'access denied' using errcode='42501';
 end if;
 if p_source_type not in ('dossie','garimpo') or p_locale not in ('en-US','es-ES','fr-FR')
 or p_source_id is null or p_source_id < 1
 or p_blocks is null or pg_catalog.jsonb_typeof(p_blocks)<>'array'
 or p_sources is null or pg_catalog.jsonb_typeof(p_sources)<>'array'
 or p_title is null or pg_catalog.length(p_title)>200
 or p_summary is null or pg_catalog.length(p_summary)>2000
 or pg_catalog.length(p_blocks::text)>250000 or pg_catalog.length(p_sources::text)>40000
 or p_expected_revision is null or p_expected_revision<0 then
   raise exception 'invalid draft' using errcode='22023';
 end if;
 if p_source_type='dossie' then
  select updated_at into v_source_time from public."Casos" where id=p_source_id for share;
 else
  select updated_at into v_source_time from public.casos_diarios where id=p_source_id for share;
 end if;
 if v_source_time is null then raise exception 'source not found' using errcode='P0002'; end if;
 -- Serializar criacoes do mesmo par origem/idioma.
 perform pg_catalog.pg_advisory_xact_lock(
  pg_catalog.hashtextextended(p_source_type||':'||p_source_id::text||':'||p_locale,0)
 );
 select * into v_record from public.international_content_versions v
  where v.source_type=p_source_type and v.locale=p_locale
  and ((p_source_type='dossie' and v.dossier_id=p_source_id)
    or (p_source_type='garimpo' and v.daily_case_id=p_source_id))
  for update;
 if not found then
  if p_expected_revision<>0 then raise exception 'revision conflict' using errcode='40001';end if;
  -- Confirmar que fonte continua sem alteracoes antes de criar rascunho.
  insert into public.international_content_versions(
    source_type,dossier_id,daily_case_id,locale,source_updated_at,translated_title,
    translated_summary,body_blocks,translated_sources,translator_user_id
  ) values(
    p_source_type,
    case when p_source_type='dossie' then p_source_id else null end,
    case when p_source_type='garimpo' then p_source_id else null end,
    p_locale,v_source_time,p_title,p_summary,p_blocks,p_sources,v_uid
  ) returning * into v_record;
  insert into public.international_content_audit(translation_id,actor_id,action,to_revision)
   values(v_record.id,v_uid,'create_draft',v_record.revision);
 else
  if v_record.revision<>p_expected_revision or v_record.editorial_status<>'draft'
     then raise exception 'revision conflict or not editable' using errcode='40001'; end if;
  if v_record.source_updated_at is distinct from v_source_time then
     raise exception 'source updated; manual reconciliation required' using errcode='40001';
  end if;
  update public.international_content_versions set
   translated_title=p_title,translated_summary=p_summary,body_blocks=p_blocks,
   translated_sources=p_sources,translator_user_id=v_uid,
   revision=revision+1,updated_at=now()
   where id=v_record.id returning * into v_record;
  insert into public.international_content_audit(
   translation_id,actor_id,action,from_revision,to_revision
  )values(v_record.id,v_uid,'save_draft',p_expected_revision,v_record.revision);
 end if;
 return query select v_record.id,v_record.revision;
end $$;

create or replace function public.international_submit_review(
 p_translation_id uuid,p_expected_revision integer
) returns integer language plpgsql security definer set search_path='' as $$
declare v_uid uuid;v_record public.international_content_versions%rowtype;v_current timestamptz;
begin
 v_uid:=auth.uid();
 if v_uid is not null and not exists (
   select 1 from auth.sessions ses where ses.id = nullif(auth.jwt()->>'session_id','')::uuid and ses.user_id=v_uid
 ) then raise exception 'session invalid' using errcode='42501'; end if;
 if v_uid is null or not public.is_arquivo_sombrio_admin() then
  raise exception 'access denied' using errcode='42501';end if;
 select * into v_record from public.international_content_versions
  where id=p_translation_id for update;
 if not found then raise exception 'not found' using errcode='P0002'; end if;
 if v_record.revision is distinct from p_expected_revision or v_record.editorial_status<>'draft'
  then raise exception 'revision conflict' using errcode='40001';end if;
 if pg_catalog.length(pg_catalog.btrim(v_record.translated_title))<3
  or pg_catalog.length(pg_catalog.btrim(v_record.translated_summary))<20
  or pg_catalog.jsonb_array_length(v_record.body_blocks)=0
  or pg_catalog.jsonb_array_length(v_record.translated_sources)=0 then
  raise exception 'incomplete translation' using errcode='22023';end if;
 if v_record.source_type='dossie' then
  select updated_at into v_current from public."Casos" where id=v_record.dossier_id for share;
 else
  select updated_at into v_current from public.casos_diarios where id=v_record.daily_case_id for share;
 end if;
 if v_current is distinct from v_record.source_updated_at then
  raise exception 'source changed' using errcode='40001';end if;
 update public.international_content_versions
 set editorial_status='in_review',revision=revision+1,updated_at=now()
 where id=p_translation_id returning * into v_record;
 insert into public.international_content_audit(translation_id,actor_id,action,from_revision,to_revision)
 values(v_record.id,v_uid,'submit_review',p_expected_revision,v_record.revision);
 return v_record.revision;
end $$;

revoke all on function public.international_save_draft(text,bigint,text,integer,text,text,jsonb,jsonb)
 from public,anon,authenticated;
revoke all on function public.international_submit_review(uuid,integer)
 from public,anon,authenticated;
grant execute on function public.international_save_draft(text,bigint,text,integer,text,text,jsonb,jsonb)
 to authenticated;
grant execute on function public.international_submit_review(uuid,integer)
 to authenticated;
commit;
