# Fase 6.8 — migração restrita e API de rascunhos (preparada)

## Situação
A inspeção do Supabase de produção confirmou **nenhuma branch de desenvolvimento** e ausência de `public.international_content_versions`. Por segurança, nenhum DDL foi executado. O SQL em `sql/internacional/fase-6-8-rascunhos-seguros.sql` é um **substituto** da proposta 6.6, não um complemento cumulativo.

## Implementado na proposta GitHub
- `international_content_versions` com FK exclusiva para `Casos` ou `casos_diarios`, `locale`, `revision` e conteúdo independente.
- `international_content_audit` rastreia autoria, revisão anterior/seguinte e evento.
- RLS ativada em ambas; SELECT somente para administrador autenticado. Sem GRANT direto de INSERT/UPDATE/DELETE.
- `international_save_draft` aceita criação somente com `expected_revision=0`, e atualizações com revisão exata; bloqueia mudanças concorrentes e casos cuja origem mudou.
- `international_submit_review` exige dados mínimos, fontes, blocos e revisão consistente com a origem.
- Não existe operação de aprovação ou publicação; o banco só aceita `draft` ou `in_review`.

## Condições de implantação
1. Fazer cópia de segurança e criar ambiente de ensaio separado sem custos inesperados.
2. Inspecionar owner das funções e riscos de `SECURITY DEFINER`, `EXECUTE`, schemas expostos e privilégios herdados.
3. Testar anon, usuário comum e administrador com tokens reais **no ambiente de teste** e confirmar impossibilidade de escrita direta.
4. Testar criação simultânea, conflito de revisão, mudança da origem, submissão sem fontes e tentativa de publicação.
5. Validar retorno das RPCs pela Data API e auditoria. Confirmar também se `updated_at` da origem é confiável.
6. Rodar advisors e plano de rollback antes da aplicação ao projeto principal.
7. Integrar `admin-v2/internacional/index.html` apenas após passar nos testes. UI continua somente leitura por padrão.

## Segurança
As funções são `SECURITY DEFINER` e portanto **devem ser revisadas antes de qualquer deploy**. A autorização usa `auth.uid()` e `is_arquivo_sombrio_admin()` baseada em `app_metadata`, nunca `user_metadata`; `search_path` é vazio, os nomes de tabelas são qualificados e os grants de execução são limitados a `authenticated`. JWT revogado/desatualizado ainda exige política de sessão no backend. Acesso de browser nunca recebe `service_role`.

## Próxima etapa — 6.9
Executar testes reais num banco de ensaio, corrigir achados e habilitar, somente após isso, um formulário administrativo seguro para edição de rascunhos.
