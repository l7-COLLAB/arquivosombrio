create table public.studio_hosts (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
 name text not null check(length(name) between 1 and 80), token_hash text not null unique,
 last_seen timestamptz, revoked boolean not null default false, created_at timestamptz not null default now()
);
create index studio_hosts_owner_idx on public.studio_hosts(owner_id);
create table public.studio_pair_codes (
 code_hash text primary key, owner_id uuid not null references auth.users(id) on delete cascade,
 name text not null check(length(name) between 1 and 80), expires_at timestamptz not null
);
create table public.studio_jobs (
 id uuid primary key default gen_random_uuid(),owner_id uuid not null references auth.users(id) on delete cascade,
 host_id uuid not null references public.studio_hosts(id),status text not null default 'queued' check(status in ('queued','processing','completed','failed')),
 payload jsonb not null,lease uuid,lease_until timestamptz,attempts integer not null default 0,
 result_path text,subtitle_text text,error text,created_at timestamptz not null default now(),finished_at timestamptz
);
create index studio_jobs_host_status_idx on public.studio_jobs(host_id,status,created_at);
create index studio_jobs_owner_idx on public.studio_jobs(owner_id,created_at desc);
alter table public.studio_hosts enable row level security;
alter table public.studio_pair_codes enable row level security;
alter table public.studio_jobs enable row level security;
revoke all on public.studio_hosts,public.studio_pair_codes,public.studio_jobs from anon,authenticated;
grant all on public.studio_hosts,public.studio_pair_codes,public.studio_jobs to service_role;
create function public.studio_pair_host(p_code_hash text,p_token_hash text) returns jsonb language plpgsql security invoker set search_path='' as $$
declare pair public.studio_pair_codes; host public.studio_hosts;
begin
 select * into pair from public.studio_pair_codes where code_hash=p_code_hash and expires_at>now() for update;
 if not found then raise exception 'Código inválido ou expirado';end if;
 perform pg_advisory_xact_lock(hashtextextended(pair.owner_id::text,42));
 if (select count(*) from public.studio_hosts where owner_id=pair.owner_id and not revoked)>=3 then raise exception 'Limite de três hospedeiros atingido';end if;
 insert into public.studio_hosts(owner_id,name,token_hash,last_seen) values(pair.owner_id,pair.name,p_token_hash,now()) returning * into host;
 delete from public.studio_pair_codes where code_hash=p_code_hash;
 return jsonb_build_object('id',host.id,'name',host.name);
end;$$;
create function public.studio_enqueue_tts(p_owner uuid,p_host uuid,p_payload jsonb) returns uuid language plpgsql security invoker set search_path='' as $$
declare job uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_owner::text,43));
 if not exists(select 1 from public.studio_hosts where id=p_host and owner_id=p_owner and not revoked) then raise exception 'Hospedeiro indisponível';end if;
 if (select count(*) from public.studio_jobs where owner_id=p_owner and status in ('queued','processing'))>=3 then raise exception 'Aguarde os trabalhos da fila';end if;
 insert into public.studio_jobs(owner_id,host_id,payload) values(p_owner,p_host,p_payload) returning id into job;return job;
end;$$;
create function public.studio_claim_job(p_host uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
declare job public.studio_jobs;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_host::text,44));
 if not exists(select 1 from public.studio_hosts where id=p_host and not revoked) then raise exception 'Hospedeiro revogado';end if;
 update public.studio_hosts set last_seen=now() where id=p_host;
 update public.studio_jobs set status=case when attempts<2 then 'queued' else 'failed' end,lease=null,lease_until=null,error='Processamento interrompido' where host_id=p_host and status='processing' and lease_until<now();
 if exists(select 1 from public.studio_jobs where host_id=p_host and status='processing') then return null;end if;
 select * into job from public.studio_jobs where host_id=p_host and status='queued' order by created_at for update skip locked limit 1;
 if not found then return null;end if;
 update public.studio_jobs set status='processing',lease=gen_random_uuid(),lease_until=now()+interval '2 minutes',attempts=attempts+1,error=null where id=job.id returning * into job;
 return jsonb_build_object('id',job.id,'lease',job.lease,'payload',job.payload);
end;$$;
revoke all on function public.studio_pair_host(text,text),public.studio_enqueue_tts(uuid,uuid,jsonb),public.studio_claim_job(uuid) from public,anon,authenticated;
grant execute on function public.studio_pair_host(text,text),public.studio_enqueue_tts(uuid,uuid,jsonb),public.studio_claim_job(uuid) to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('studio-results','studio-results',false,20971520,array['audio/mpeg']) on conflict(id) do nothing;
