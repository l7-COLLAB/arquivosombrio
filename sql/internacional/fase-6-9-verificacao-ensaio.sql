-- Fase 6.9: checklist SQL para banco de ensaio APOS implantar SQL 6.8.
-- Operações somente leitura. NÃO promove e NÃO modifica dados.
select
 to_regclass('public.international_content_versions') is not null as translations_table_exists,
 to_regclass('public.international_content_audit') is not null as audit_table_exists;
select c.relname, c.relrowsecurity as rls_enabled
 from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relname in ('international_content_versions','international_content_audit');
select grantee, table_name, privilege_type
 from information_schema.role_table_grants
 where table_schema='public' and table_name in ('international_content_versions','international_content_audit')
 and grantee in ('anon','authenticated')
 order by table_name,grantee,privilege_type;
select p.proname, p.prosecdef as security_definer,
 p.proconfig as function_config
 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname in
 ('international_save_draft','international_submit_review');
select tablename, policyname, cmd, roles, qual, with_check
 from pg_catalog.pg_policies
 where schemaname='public' and tablename in ('international_content_versions','international_content_audit');
-- Testes a executar apenas na base de ensaio:
-- 1. token anon: SELECT e EXECUTE das RPCs precisam falhar.
-- 2. usuário autenticado comum: SELECT retorna zero registros; RPC retorna access denied.
-- 3. admin: criar rascunho revision=0, recuperar revision=1; salvar revision=1 -> revision=2.
-- 4. admin: salvar novamente revision=1 -> erro de conflito, conteúdo preservado.
-- 5. admin: tentar escrita direta via Data API -> permission denied.
-- 6. admin: mandar revisão sem fontes/blocos -> erro, estado draft preservado.
-- 7. admin: modificar updated_at da origem no ensaio, tentar avançar -> conflito.
-- 8. admin: enviar rascunho completo -> in_review + entrada de auditoria.
-- 9. ambos: nenhuma rota ou conteúdo publicado.
