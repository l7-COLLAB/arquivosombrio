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
