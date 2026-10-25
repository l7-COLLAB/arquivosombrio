# Homologação local da consulta editorial — Fase 5.74

Ambiente **somente local**, com Docker, Supabase CLI e Node.js 22. Não executar comandos de `supabase link`, `db pull`, `db push` ou deploy contra produção.

1. Em uma cópia local do repositório, confirme que Docker está funcionando e consulte `supabase --help`, `supabase start --help` e `supabase functions serve --help`.
2. Inicialize o Supabase local com `supabase start` se a configuração do projeto e suas migrações puderem ser executadas com segurança. Nunca importe dados reais.
3. Em um terminal separado, sirva somente a função com `supabase functions serve editorial-candidates`; confira nas opções da versão instalada o comportamento de verificação JWT.
4. Crie contas **fictícias exclusivamente no Auth local**. Para a conta de teste administrativa, atribua `app_metadata.role = admin` por um método administrativo local; jamais `user_metadata`.
5. Gere sessões dos usuários de teste no Auth local e execute GET e OPTIONS contra a URL local, inspecionando 401, 403, 200, CORS e `cache-control`. Não armazene nem versione tokens.
6. Registre somente códigos HTTP, cabeçalhos não sensíveis e identificadores fictícios. Elimine o ambiente ao concluir os testes.

**Verificação já automatizada:** `node tests/dossier-editorial-local-fixtures-phase574.mjs` executa mocks em memória; não constitui teste real de JWT ou do gateway.

**Importante:** a função ainda contém textos candidatos no código-fonte. O ambiente local não deve ser apresentado como sigiloso por si só. A versão publicada dependerá de revisão de segurança e aprovação editorial independente.
