# Macroetapa 6.12 — Banco, segurança e Admin V2

**Estado: implementação de código na proposta #86, com escrita desativada.**

## Entregas agrupadas
1. Supabase real consultado: sem branch de desenvolvimento e sem tabelas internacionais.
2. SQL de rascunhos revisado das fases anteriores preservado como proposta para ensaio; nenhuma migração executada.
3. Criado cliente `admin-v2/internacional/draft-workflow.js` com contratos para RPC de salvar, submeter e consultar auditoria.
4. Editor atualizado para preservar JSON estruturado dos blocos, fontes documentais e histórico por revisão.
5. Criada suíte `scripts/test-internacional-workflow.mjs` para testar validação e bloqueio de chamadas de escrita.

## Ativação
Flag `enabled=false` literal no módulo, sem possibilidade de habilitação via configuração do navegador. Botões permanecem desabilitados. Habilitação requer revisão do código, ambiente isolado e testes reais.

## Testes e execução
`node --test scripts/test-internacional-workflow.mjs scripts/test-internacional-seguranca.mjs`.

Verificações estruturais conferidas no GitHub; não foram realizados testes funcionais de SQL, RLS ou autenticação real, porque falta banco de ensaio.

## Avisos externos preexistentes do advisor
- Função `public.request_account_deletion` SECURITY DEFINER acessível a autenticados: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
- Proteção contra senhas vazadas desativada: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- Tabelas existentes com RLS habilitada sem políticas, possivelmente fechadas intencionalmente.

## Gates necessários
Testar em banco isolado a compilação, grants, RPC, concorrência e auditoria, revisar SECURITY DEFINER e sessões, validar campos JSON e executar QA mobile/desktop. Depois disso o salvamento pode ser habilitado; publicação internacional continua bloqueada.
