# Fase 5.76 — Verificação local com usuários fictícios

O script `tests/dossier-editorial-local-auth-phase576.mjs` testa o gateway do Supabase **somente no loopback**. Não é executado em CI nem em produção: precisa de Supabase local, da Edge Function iniciada e de dois usuários fictícios criados no Auth local.

Pré-condições:
- Docker e Supabase CLI em execução local.
- `supabase start` e `supabase functions serve editorial-candidates` executados em uma cópia do repositório.
- Duas contas locais, uma com `app_metadata.role=admin`, outra sem o papel.
- Credenciais fornecidas apenas por variáveis locais `SUPABASE_LOCAL_ANON_KEY`, `LOCAL_ADMIN_EMAIL`, `LOCAL_ADMIN_PASSWORD`, `LOCAL_USER_EMAIL`, `LOCAL_USER_PASSWORD`. Opcional: `SUPABASE_LOCAL_URL` (loopback).
- Executar `node tests/dossier-editorial-local-auth-phase576.mjs`.

O teste não grava credenciais, não solicita service-role, não usa usuários reais nem acessa o projeto hospedado. O resultado do OPTIONS deverá ser avaliado especificamente à luz de `verify_jwt=true`; uma falha indica bloqueio de compatibilidade, não autorização para desativar JWT.

A homologação **real do gateway hospedado** ainda exigirá ambiente remoto separado e autorização de implantação. Não considerar concluída com os resultados locais.
