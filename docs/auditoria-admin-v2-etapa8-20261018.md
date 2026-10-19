# Auditoria técnica — Admin V2 — Etapa 8 (18/10/2026)

## Escopo
Central Admin V2, interface de navegação, busca de funções, editor legado, rascunhos, agendamentos e publicação. Revisão sem executar ações administrativas de escrita.

## Verificado pelo código
- A página exige sessão Supabase e verificação administrativa recente antes de iniciar o painel.
- O módulo do painel verifica a função administrativa novamente na montagem.
- Busca lateral e assistência editorial são carregadas após a montagem autenticada e não enviam pedidos de escrita ao backend.
- O editor mantém a busca original por nome, a ordenação e o filtro de acompanhamento.
- As etiquetas de **rascunho** e **agendado** são explícitas no editor para registros que as fornecem. Sem etiqueta, não presumir que o arquivo está publicado.
- Os scripts de publicação/edição existentes não foram modificados.
- Último deploy anterior à auditoria: GitHub Pages concluído com sucesso no commit `d5bf8ae56039549f8631aa1bfce1a31c79f05797`.

## Validação automatizada introduzida
`node --test tests/admin-v2-regressions.mjs` examina sintaxe do JavaScript e contratos essenciais de autenticação, navegação e editor. Um workflow próprio executa as verificações em pull requests e alterações de Admin V2 na branch principal.

## Pendente — exige sessão administrativa controlada
1. Login, sessão expirada e autorização recusada.
2. Busca e navegação por teclado no desktop e no celular.
3. Abrir registro existente e verificar leitura dos dados sem salvar.
4. Rascunho: salvar, reabrir e confirmar persistência usando apenas conteúdo descartável autorizado.
5. Agendamento: verificar fuso horário, data/hora e comportamento sem publicação antecipada.
6. Publicação: verificar versão pública, permissões, cache e opção de reversão com caso de teste autorizado.
7. Estados de falha: erro de rede, ação duplicada e falha de upload.

## Limites
Não houve autenticação real nesta auditoria, testes end-to-end ou publicação de arquivos de teste. Sucesso do GitHub Pages não comprova integridade funcional no navegador. Não foram alteradas novels, conteúdos dos casos, schema Supabase, operações administrativas nem credenciais.

## Complemento de validação — Supabase e deploy (18/10/2026)

Consultas realizadas em modo **somente leitura** no projeto Supabase `Arquivo Sombrio`, identificado como `iuhotznurbyujzbyhizf`. Nenhum registro foi criado, editado, publicado ou excluído.

- Projeto Supabase: `ACTIVE_HEALTHY` no momento da consulta.
- RLS ativa nas tabelas `Casos`, `casos_diarios`, `pericias`, `admin_drafts` e `admin_audit_log`.
- Políticas de escrita de `Casos`, `casos_diarios` e `pericias` (INSERT/UPDATE/DELETE) referenciam a função `is_arquivo_sombrio_admin()`.
- Políticas de escrita de `admin_drafts` exigem simultaneamente `user_id = auth.uid()` e `is_arquivo_sombrio_admin()`.
- Contagem por `status_publicacao`: `Casos`: 18 publicados, 3 rascunhos; `casos_diarios`: 29 publicados, 5 rascunhos; `pericias`: 12 publicados, 2 rascunhos. Nenhum registro marcado `agendado` nessas três tabelas na leitura.
- GitHub Actions no commit `5dcc9e0c5b5230b9e62b27b87466c214a90780dc`: fluxo `Verificar Admin V2` e fluxo `Deploy Arquivo Sombrio (GitHub Pages)` concluídos com sucesso.

**Limite:** estas consultas confirmam configurações e estados do banco, não a execução real das operações com uma conta administrativa. Não houve testes com login em navegador, mudança de estado, gravação, agendamento, publicação, cache da página pública ou reversão. RLS ativa e políticas existentes não dispensam testes de autorização sob papéis diferentes.
