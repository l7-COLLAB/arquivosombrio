-- Arquivo Sombrio: barreiras RESTRITIVAS de publicação (03/11/2026).
-- As políticas SELECT originais são PERMISSIVE (OR), portanto a política
-- "enforce_publication_time" permissiva NÃO impede que outra exponha
-- conteúdo marcado publicado mas agendado.
--
-- Migração aditiva: não remove políticas, não altera linhas, grants ou rascunhos.
-- Para rollback controlado: DROP POLICY security_publication_gate_20261103
-- em cada tabela abaixo; conferir em cópia do banco e fazer backup antes
-- de executar em produção. Não rodar em produção sem validação de integração.

create policy security_publication_gate_20261103
on public."Casos" as restrictive for select to anon, authenticated
using (
  (select public.is_arquivo_sombrio_admin())
  or (status_publicacao = 'publicado'
      and (published_at is null or published_at <= now()))
);

create policy security_publication_gate_20261103
on public.casos_diarios as restrictive for select to anon, authenticated
using (
  (select public.is_arquivo_sombrio_admin())
  or (status_publicacao = 'publicado'
      and (publicado_em is null or publicado_em <= now()))
);

create policy security_publication_gate_20261103
on public.pericias as restrictive for select to anon, authenticated
using (
  (select public.is_arquivo_sombrio_admin())
  or (status_publicacao = 'publicado'
      and (publicado_em is null or publicado_em <= now()))
);

create policy security_publication_gate_20261103
on public.lendas as restrictive for select to anon, authenticated
using (
  (select public.is_arquivo_sombrio_admin())
  or (status_publicacao = 'publicado'
      and (publicado_em is null or publicado_em <= now()))
);

create policy security_publication_gate_20261103
on public.creepypastas as restrictive for select to anon, authenticated
using (
  (select public.is_arquivo_sombrio_admin())
  or (status_publicacao = 'publicado'
      and (publicado_em is null or publicado_em <= now()))
);

create policy security_publication_gate_20261103
on public.novels as restrictive for select to anon, authenticated
using (
  (select public.is_arquivo_sombrio_admin())
  or (status_publicacao = 'publicado'
      and (publicado_em is null or publicado_em <= now()))
);

create policy security_publication_gate_20261103
on public.novel_capitulos as restrictive for select to anon, authenticated
using (
  (select public.is_arquivo_sombrio_admin())
  or (
    status_publicacao = 'publicado'
    and (publicado_em is null or publicado_em <= now())
    and (agendado_para is null or agendado_para <= now())
    and exists (
      select 1 from public.novels n
      where n.id = novel_capitulos.novel_id
        and n.status_publicacao = 'publicado'
        and (n.publicado_em is null or n.publicado_em <= now())
    )
  )
);

create policy security_publication_gate_20261103
on public.novel_volumes as restrictive for select to anon, authenticated
using (
  (select public.is_arquivo_sombrio_admin())
  or exists (
    select 1 from public.novels n
    where n.id = novel_volumes.novel_id
      and n.status_publicacao = 'publicado'
      and (n.publicado_em is null or n.publicado_em <= now())
  )
);

create policy security_publication_gate_20261103
on public.novel_capitulo_audios as restrictive for select to anon, authenticated
using (
  (select public.is_arquivo_sombrio_admin())
  or (
    status = 'approved'
    and exists (
      select 1
      from public.novel_capitulos c
      join public.novels n on n.id = c.novel_id
      where c.id = novel_capitulo_audios.capitulo_id
        and c.status_publicacao = 'publicado'
        and (c.publicado_em is null or c.publicado_em <= now())
        and (c.agendado_para is null or c.agendado_para <= now())
        and n.status_publicacao = 'publicado'
        and (n.publicado_em is null or n.publicado_em <= now())
    )
  )
);

create policy security_publication_gate_20261103
on public.published_campaigns as restrictive for select to anon, authenticated
using (
  (select public.is_arquivo_sombrio_admin())
  or (
    publish_at <= now()
    and coalesce(payload->>'heroImage', '') not like 'staging:%'
    and coalesce(payload->>'cardImage', '') not like 'staging:%'
  )
);
