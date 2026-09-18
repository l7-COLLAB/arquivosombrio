
create table if not exists public.admin_audit_log (
    id uuid primary key default gen_random_uuid(),
    admin_user_id uuid not null references auth.users(id) on delete restrict,
    action text not null,
    target_type text not null,
    target_id text,
    details jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

alter table public.admin_audit_log enable row level security;

drop policy if exists "admin_consulta_historico" on public.admin_audit_log;
create policy "admin_consulta_historico"
on public.admin_audit_log
for select
to authenticated
using ((select public.is_arquivo_sombrio_admin()));

drop policy if exists "admin_registra_historico" on public.admin_audit_log;
create policy "admin_registra_historico"
on public.admin_audit_log
for insert
to authenticated
with check (
    (select public.is_arquivo_sombrio_admin())
    and admin_user_id = (select auth.uid())
);

revoke update, delete on public.admin_audit_log from anon, authenticated;
grant select, insert on public.admin_audit_log to authenticated;

create table if not exists public.content_reports (
    id uuid primary key default gen_random_uuid(),
    reporter_id uuid references auth.users(id) on delete set null,
    target_type text not null check (
        target_type in ('comentario', 'forum_post', 'forum_comment', 'relato', 'outro')
    ),
    target_id text not null,
    reason text not null check (
        reason in ('assedio', 'odio', 'dados_pessoais', 'acusacao_sem_fonte', 'spam', 'conteudo_ilegal', 'outro')
    ),
    details text,
    status text not null default 'pending' check (
        status in ('pending', 'reviewing', 'resolved', 'dismissed')
    ),
    resolution text,
    created_at timestamptz not null default now(),
    reviewed_at timestamptz,
    reviewed_by uuid references auth.users(id) on delete set null
);

alter table public.content_reports enable row level security;

drop policy if exists "usuario_envia_denuncia" on public.content_reports;
create policy "usuario_envia_denuncia"
on public.content_reports
for insert
to authenticated
with check (
    reporter_id = (select auth.uid())
    and status = 'pending'
    and reviewed_at is null
    and reviewed_by is null
);

drop policy if exists "usuario_ou_admin_consulta_denuncia" on public.content_reports;
create policy "usuario_ou_admin_consulta_denuncia"
on public.content_reports
for select
to authenticated
using (
    reporter_id = (select auth.uid())
    or (select public.is_arquivo_sombrio_admin())
);

drop policy if exists "admin_atualiza_denuncia" on public.content_reports;
create policy "admin_atualiza_denuncia"
on public.content_reports
for update
to authenticated
using ((select public.is_arquivo_sombrio_admin()))
with check ((select public.is_arquivo_sombrio_admin()));

drop policy if exists "admin_exclui_denuncia" on public.content_reports;
create policy "admin_exclui_denuncia"
on public.content_reports
for delete
to authenticated
using ((select public.is_arquivo_sombrio_admin()));

grant select, insert, update, delete on public.content_reports to authenticated;

create or replace function public.admin_list_users()
returns table (
    id uuid,
    email text,
    display_name text,
    created_at timestamptz,
    last_sign_in_at timestamptz,
    banned_until timestamptz,
    account_role text,
    age_18_confirmed boolean,
    terms_version text,
    privacy_version text,
    guidelines_version text,
    legal_accepted_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $function$
begin
    if not coalesce(
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
        false
    ) then
        raise exception 'Acesso administrativo não autorizado'
            using errcode = '42501';
    end if;

    return query
    select
        u.id,
        u.email::text,
        coalesce(
            nullif(u.raw_user_meta_data ->> 'display_name', ''),
            nullif(u.raw_user_meta_data ->> 'name', ''),
            split_part(coalesce(u.email, ''), '@', 1)
        )::text,
        u.created_at,
        u.last_sign_in_at,
        u.banned_until,
        coalesce(u.raw_app_meta_data ->> 'role', 'user')::text,
        la.age_18_confirmed,
        la.terms_version,
        la.privacy_version,
        la.guidelines_version,
        la.created_at
    from auth.users u
    left join lateral (
        select l.*
        from public.legal_acceptances l
        where l.user_id = u.id
        order by l.created_at desc, l.id desc
        limit 1
    ) la on true
    order by u.created_at desc;
end;
$function$;

revoke all on function public.admin_list_users() from public;
revoke all on function public.admin_list_users() from anon;
grant execute on function public.admin_list_users() to authenticated;

comment on table public.admin_audit_log is
'Histórico imutável das ações realizadas no painel administrativo.';
comment on table public.content_reports is
'Denúncias de conteúdo enviadas por usuários e analisadas pela administração.';
comment on function public.admin_list_users() is
'Lista administrativa mínima de contas e aceites legais; exige app_metadata.role=admin.';
