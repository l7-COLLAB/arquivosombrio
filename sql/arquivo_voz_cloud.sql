-- Cloud voice jobs isolated from the existing Polly prewarm queue.
create table if not exists public.arquivo_voz_cloud_jobs (
 id uuid primary key default gen_random_uuid(),
 content_type text not null check(content_type in ('dossie','garimpo','pericia','lenda','creepypasta')),
 content_id bigint not null,
 source_hash text not null,
 narration_text text not null check(length(narration_text) between 1 and 200000),
 voice text not null default 'pf_dora',
 speed numeric(3,2) not null default 0.92 check(speed between 0.50 and 1.50),
 status text not null default 'pending' check(status in ('pending','running','review','approved','failed','cancelled')),
 audio_path text,
 error text,
 attempts integer not null default 0,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(content_type,content_id,source_hash)
);
alter table public.arquivo_voz_cloud_jobs enable row level security;
-- No public or authenticated access: only service-role worker and separately verified admin functions.
create index if not exists arquivo_voz_cloud_pending_idx on public.arquivo_voz_cloud_jobs(created_at) where status='pending';
create or replace function public.claim_arquivo_voz_cloud_job()
returns setof public.arquivo_voz_cloud_jobs
language plpgsql security definer set search_path = public
as $$
begin
 if auth.role() <> 'service_role' then raise exception 'not authorized'; end if;
 return query
 with next_job as (
   select id from public.arquivo_voz_cloud_jobs where status='pending'
   order by created_at for update skip locked limit 1
 )
 update public.arquivo_voz_cloud_jobs j
 set status='running', attempts=attempts+1, updated_at=now()
 from next_job where j.id=next_job.id
 returning j.*;
end $$;
revoke all on function public.claim_arquivo_voz_cloud_job() from public, anon, authenticated;
grant execute on function public.claim_arquivo_voz_cloud_job() to service_role;
