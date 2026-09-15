-- ============================================================================
-- ARQUIVO SOMBRIO — MIGRAÇÃO 2026-09-15
-- Executar no Supabase Studio > SQL Editor (uma única vez).
--
-- Esta migração é ADITIVA e SEGURA: não apaga dados, não recria tabelas.
-- Revise e execute como transação única.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. CASOS — status de publicação (rascunho/publicado)
-- ----------------------------------------------------------------------------
-- Conteúdo existente é marcado como publicado para não sumir do site.

alter table public."Casos"
    add column if not exists status_publicacao text not null default 'rascunho';

update public."Casos"
    set status_publicacao = 'publicado';

-- ----------------------------------------------------------------------------
-- 2. CASOS — slug (URL amigável: caso.html?slug=...)
-- ----------------------------------------------------------------------------
-- Gera slug a partir do título (remove acentos, minúsculas, hífens)
-- com sufixo curto para evitar colisões.

alter table public."Casos"
    add column if not exists slug text;

update public."Casos"
    set slug = case
        when slug is not null and slug <> '' then slug
        else
            lower(
                regexp_replace(
                    translate(
                        coalesce(titulo, 'caso'),
                        'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñ',
                        'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn'
                    ),
                    '[^a-zA-Z0-9]+', '-', 'g'
                )
            ) || '-' || substr(md5(random()::text), 1, 7)
    end
    where slug is null or slug = '';

-- Garante unicidade e performance
create unique index if not exists casos_slug_unico
    on public."Casos" (lower(slug));

create index if not exists casos_publicados_idx
    on public."Casos" (created_at desc)
    where status_publicacao = 'publicado';

-- ----------------------------------------------------------------------------
-- 3. CASOS — RLS: rascunhos invisíveis ao público
-- ----------------------------------------------------------------------------
-- Estado atual: qualquer visitante lê TODAS as linhas.
-- Depois desta migração: anônimos só leem 'publicado';
-- a administradora (app_metadata.role = 'admin') lê tudo.

drop policy if exists "Casos_leitura_publica" on public."Casos";
drop policy if exists "casos_select_public" on public."Casos";

create policy "Casos_leitura_publica"
    on public."Casos"
    for select
    to anon, authenticated
    using (
        status_publicacao = 'publicado'
        or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    );

-- ----------------------------------------------------------------------------
-- 4. SUGESTOES — colunas padronizadas (aditivas)
-- ----------------------------------------------------------------------------
-- O formulário do site envia: nome, titulo, descricao.

alter table public."Sugestoes"
    add column if not exists nome text;
alter table public."Sugestoes"
    add column if not exists titulo text;
alter table public."Sugestoes"
    add column if not exists descricao text;
alter table public."Sugestoes"
    add column if not exists criado_em timestamptz not null default now();

-- ----------------------------------------------------------------------------
-- 5. SUGESTOES — RLS: leitura só para a administração
-- ----------------------------------------------------------------------------
-- Hoje: qualquer visitante pode LER todas as sugestões.
-- Depois: só a administradora lê; envio público continua permitido.

alter table public."Sugestoes" enable row level security;

drop policy if exists "Sugestoes_leitura_publica" on public."Sugestoes";
drop policy if exists "sugestoes_select_public" on public."Sugestoes";
drop policy if exists "Sugestoes_envio_publico" on public."Sugestoes";
drop policy if exists "sugestoes_insert_public" on public."Sugestoes";

create policy "Sugestoes_leitura_admin"
    on public."Sugestoes"
    for select
    to authenticated
    using (
        coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    );

create policy "Sugestoes_envio_publico"
    on public."Sugestoes"
    for insert
    to anon, authenticated
    with check (
        char_length(coalesce(titulo, '')) between 3 and 200
        and char_length(coalesce(nome, '')) between 2 and 120
    );

-- ----------------------------------------------------------------------------
-- 6. Verificação automática (mostra o resultado no final da execução)
-- ----------------------------------------------------------------------------

select
    'Casos' as tabela,
    count(*) as total,
    count(*) filter (where status_publicacao = 'publicado') as publicados,
    count(*) filter (where slug is not null) as com_slug
from public."Casos";

commit;
