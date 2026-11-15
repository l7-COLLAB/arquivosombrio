# Fase 6.6 — persistência internacional e Admin V2

**Estado:** diagnóstico feito no Supabase de produção; SQL preparada em revisão no GitHub; **nenhuma migração aplicada**.

## Estrutura confirmada (26/10/2026)
- `public."Casos"`: `id bigint`, `updated_at timestamptz`, `status_publicacao`, `slug`, conteúdo em `historia` e `conteudo_blocos`.
- `public.casos_diarios`: `id bigint`, `updated_at timestamptz`, `status_publicacao`, `slug`, `conteudo`, `fontes`.
- `public.livros`: `id uuid`. Livros/capítulos **fora do escopo desta tabela inicial**; criar vínculo próprio após inspecionar capítulos.
- O painel já possui `admin_v2_versions`, `admin_v2_content_state`, `admin_v2_publication_jobs`.
- Políticas de `Casos` e `casos_diarios` usam `is_arquivo_sombrio_admin()` para alterações administrativas.
- A função existente deve passar por revisão de definição, grants e comportamento antes de aplicar a migração.

## SQL de proposta
`sql/internacional/fase-6-6-conteudos-localizados.sql`

- Cria `international_content_versions`, com FKs opcionais e mutuamente exclusivas para dossiês e Garimpo.
- Garante uma versão por idioma de cada origem com índices únicos parciais.
- Mantém traduções, fontes e blocos editoriais separados dos registros brasileiros.
- Inicia em `draft`; exige verificação factual e de direitos para eventual estado `published`.
- **Publicação bloqueada em RLS para usuários comuns e administradores** nesta fase; estado de publicação não tem rota pública nem política de leitura pública.
- RLS habilitada, sem política de leitura para `anon`; `authenticated` acessa somente quando `is_arquivo_sombrio_admin()` autorizar.

### Pendências de segurança importantes
1. Confirmar que `public.is_arquivo_sombrio_admin()` é segura, sem basear autorização em `user_metadata` editável.
2. Revisar as funções e políticas existentes; verificar se há grants adicionais por papéis herdados.
3. SQL não define imutabilidade estrita de origem em UPDATE nem verificações de versão concorrente: a futura API do painel precisa controlar isso com transações.
4. Aprovação/publicação devem ser operações em backend com auditoria e verificação de revisão atual da fonte; **não abrir UPDATE genérico do cliente para produção**.
5. O campo `source_updated_at` deverá ser confrontado com `updated_at` no momento da aprovação.
6. Confirmar backup, segurança RLS, execução de migração em clone local ou branch de teste e rollback antes de produção.

## Integração planejada ao Admin V2
- Na edição de um dossiê ou Garimpo, exibir aba `Traduções` com inglês, espanhol e francês.
- Listar estados independentes e mostrar diferença de revisão da origem.
- Abrir versão para tradução mantendo ordem dos blocos e vínculos de fontes.
- Salvar rascunho como função administrativa com controle de concorrência e registro no `admin_audit_log`.
- Encaminhar revisão e aprovação apenas depois de testes de backend e permissões.
- Não criar controles funcionais de publicação enquanto as rotas `/en/`, `/es/` e `/fr/` não existirem.

## Próxima fase 6.7
Preparar API administrativa autenticada e interface V2 em ambiente de teste, com versionamento, auditoria e teste de permissões para usuários anônimos, comuns e administradores.
