# Administração Lite · iOS 9.3.5

A Administração Lite é um editor remoto de rascunhos. A senha é lida exclusivamente pela Edge Function `lite-admin` através do segredo `LITE_ADMIN_PASSWORD`. Não colocar senhas ou chaves administrativas no HTML, JavaScript, histórico ou armazenamento do navegador.

## Categorias e dados

Dossiês, Garimpo Sombrio, Perícia Forense, Lendas, Creepypastas, livros e capítulos têm campos específicos. Listas, cronologias, blocos, fontes e outros campos estruturados usam JSON quando a coluna do Supabase é estruturada. Os capítulos são registros independentes e podem ser associados a uma obra existente.

## Fluxo

1. Entrar com o código validado no servidor.
2. Criar um rascunho ou copiar um arquivo existente para uma cópia de preparação.
3. Salvar na tabela `lite_admin_staging`. Cada edição usa `updated_at` como controle de concorrência; uma versão antiga não substitui uma mais recente.
4. No painel V2, abrir **Rascunhos do iPad**.
5. Dossiês, Garimpo, Perícia, Lendas e Creepypastas são importados para o fluxo de rascunhos próprio do V2. Obras e capítulos abrem os formulários do módulo Novels já preenchidos. A transferência de obras/capítulos usa armazenamento temporário no mesmo navegador.
6. Conferir e salvar explicitamente no V2. Nenhuma etapa da Administração Lite publica, agenda ou altera tabelas de conteúdo.

O rascunho Lite original permanece guardado depois da transferência. O formulário V2 de obra abre como rascunho. O de capítulo também abre com status rascunho; publicação ou agendamento exigem uma escolha e uma ação explícitas no V2.

## Segurança e compatibilidade

- RLS continua ativa nas tabelas auxiliares. O papel `service_role` é usado somente pelo servidor.
- O V2 só pode ler a staging quando `is_arquivo_sombrio_admin()` aprova a sessão.
- A interface Lite usa HTML convencional, CSS simples, JavaScript ES5 e `XMLHttpRequest`.
- CORS permite somente `https://arquivosombrio.net.br`.
- A sessão não é gravada no navegador, expira em 45 minutos e pode ser revogada ao sair.
- O limite de tentativas é de cinco por IP em 15 minutos.
- O painel verifica concorrência, mas ainda não mantém histórico recuperável de revisões.

## Migrações implantadas

- `20260926014429_lite_admin_private_staging_and_sessions.sql`
- `20260926020815_lite_admin_explicit_service_role_permissions.sql`
- `20260926021744_lite_admin_v2_inbox_and_read_catalog_grants.sql`
- `20260926021958_admin_drafts_literary_types_for_lite_review.sql`

## Testes pendentes

A sintaxe JavaScript e os privilégios/RLS foram checados. Ainda faltam os testes de autenticação com o código válido, criação/recuperação/conflito de rascunhos, transferência no painel V2, falhas de rede, expiração de sessão, rejeição/limitação de códigos inválidos e teste em Safari no iPad com iOS 9.3.5. A branch ainda não está publicada.
