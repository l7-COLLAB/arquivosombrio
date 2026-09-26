# Administração Lite · iOS 9.3.5

A Administração Lite é um editor remoto de rascunhos. A senha é lida apenas pela Edge Function `lite-admin` por meio do segredo `LITE_ADMIN_PASSWORD`. Não inserir senhas ou chaves administrativas no HTML, JavaScript, histórico ou armazenamento local.

## Categorias

Dossiês, Garimpo Sombrio, Perícia Forense, Lendas, Creepypastas, livros e capítulos têm campos próprios. Os campos estruturados aceitam JSON para preservar listas, blocos e relacionamentos. Capítulos são registros independentes e usam o ID da obra.

## Fluxo

1. Entrar com o código administrativo no servidor.
2. Criar rascunho ou copiar um registro existente para uma cópia isolada.
3. Salvar na tabela `lite_admin_staging`. Edições condicionais verificam `updated_at` para impedir sobrescrita silenciosa.
4. Na Central Administrativa V2, abrir **Rascunhos do iPad** e importar uma cópia para o fluxo de rascunhos do V2.
5. Revisar, editar e decidir publicação ou agendamento exclusivamente pelo painel V2.

A importação não remove o rascunho Lite e não altera tabelas de conteúdo público.

## Segurança e compatibilidade

- RLS permanece ativa nas tabelas auxiliares. O service role é usado somente no servidor.
- O V2 pode ler `lite_admin_staging` apenas quando `is_arquivo_sombrio_admin()` aprova a sessão.
- A função Lite não aceita publicação nem agendamento.
- A senha não é persistida no navegador; o token de sessão fica somente em memória e dura 45 minutos.
- A interface usa HTML convencional, CSS simples, JavaScript ES5 e `XMLHttpRequest`.
- CORS permite apenas `https://arquivosombrio.net.br`.
- O limite é de cinco tentativas por IP no intervalo de 15 minutos.

## Migrações relacionadas

- `20260926014429_lite_admin_private_staging_and_sessions.sql`
- `20260926020815_lite_admin_explicit_service_role_permissions.sql`
- `20260926021744_lite_admin_v2_inbox_and_read_catalog_grants.sql`
- `20260926021958_admin_drafts_literary_types_for_lite_review.sql`

## Estado dos testes

Validação de sintaxe JavaScript concluída para os arquivos alterados. Permissões e política RLS confirmadas no Supabase. Ainda é necessário testar login com o código válido, limite de tentativas, sessão, criação/recuperação/conflito de rascunhos, importação no V2 e Safari do iPad com iOS 9.3.5. Não liberar a publicação do branch antes desses testes físicos e de integração.
