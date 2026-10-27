# Fase 6.7 — interface administrativa e revisão de segurança

**Status:** prévia de consulta integrada por código na branch do PR #86. Não publicada, nem conectada a operações de gravação.

## Descobertas verificadas no Supabase
- `public.is_arquivo_sombrio_admin()` existe, é `STABLE`, `SECURITY INVOKER` (`prosecdef=false`) e verifica `auth.jwt()->'app_metadata'->>'role' = 'admin'`.
- A função não usa `user_metadata`. Como JWT pode ficar desatualizado, revalidar a sessão em funções de escrita e avaliar revogação de sessão no backend.
- `public.international_content_versions` **não existe** no banco consultado. Não aplicar scripts de escrita sem testes.
- Fonte dos dossiês: `public."Casos"` (`id bigint`); Garimpo: `public.casos_diarios` (`id bigint`).

## Entrega de interface
- `admin-v2/internacional/index.html` é uma **consulta somente leitura** em ambiente administrativo.
- Reutiliza a autenticação já existente em `admin-v2/legacy/js/admin-auth.js`, valida `app_metadata.role` e rechecagem de sessão.
- Exige marcação de verificação de sessão recente, como o Admin V2. Verificação client-side não substitui RLS; dados dependem das políticas existentes.
- Consulta até 100 casos por vez nas tabelas atuais, mostra IDs, títulos, tipo e estado; filtros de acervo e busca.
- Os três idiomas aparecem com estado **não verificado**, não como traduções existentes.
- Não chama INSERT, UPDATE, DELETE nem RPC; não executa migração, não disponibiliza botão de publicar ou salvar.
- A URL de preview não é privada por si: HTML de interface pode ser lido, mas dados dependem do backend autenticado. `noindex` não impede acesso à URL.

## Revisão do SQL 6.6 antes de aplicar
- O SQL da fase anterior permite UPDATE administrativo genérico para status não publicado. Isso é **insuficiente** para preservar transições (draft/review/approved), versionamento e imutabilidade de origem.
- Não aplicar sem mecanismo de verificação transacional da revisão de origem, controle de transições, auditoria de escrita e política de publicação.
- Recomenda-se revogar UPDATE geral de `authenticated` e disponibilizar apenas API/RPC autenticada estreita ou Edge Function autorizada, com transações e auditoria.
- Garantir que SQL de acesso não possa gravar diretamente `reviewer_user_id`, `approved_at` ou carimbos de publicação por UPDATE genérico.
- Não permitir acesso direto a service-role no navegador.
- Verificar políticas `anon`, `authenticated` e `service_role` em banco de teste; executar advisor e testes de regressão antes de produção.

## Próxima fase candidata 6.8
Implementar migração revisada em ambiente de desenvolvimento e endpoints para rascunho, revisão e aprovação com proteção contra alterações concorrentes; depois conectar controles funcionais de edição ao Admin V2.
