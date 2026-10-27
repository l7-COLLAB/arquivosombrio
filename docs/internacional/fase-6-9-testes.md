# Fase 6.9 — editor local e matriz de testes

**Estado: código preparado e revisão estrutural; sem deploy e sem testes de escrita reais.**

## Diagnóstico do Supabase
- O projeto conectado continua sem branches de desenvolvimento.
- A tabela `international_content_versions` ainda não existe no banco principal.
- Por isso, **não executar** as RPCs ou a migração SQL diretamente em produção.

## Interface preparada
- Em `admin-v2/internacional/index.html`, cada origem carregada pode abrir um editor local de tradução.
- Campos: idioma, título, resumo, narrativa e URLs de fontes.
- Botão `Conferir texto localmente` valida preenchimento e formato das URLs, sem alegar revisão factual.
- Botões de salvar e enviar à revisão permanecem desabilitados e não têm eventos associados.
- A prévia não persiste, publica ou altera o conteúdo original. Texto digitado se perde ao trocar de origem/recarregar.
- Os scripts não incluem chamadas de gravação `insert`, `update`, `delete`, `upsert` ou `rpc`.

## Auditoria de regressão planejada
`sql/internacional/fase-6-9-verificacao-ensaio.sql` contém consultas de inspeção e roteiro de testes com perfis anon, autenticado comum e admin.

## Defeitos e riscos que devem ser resolvidos em banco de ensaio antes de ativar escrita
- Revalidar privilégio de funções `SECURITY DEFINER` e membership/grants herdados.
- Validar serialização e integridade de revisão com dois administradores simultâneos.
- Garantir bloqueio consistente das alterações da origem ao validar `updated_at`; hoje a função verifica a origem, mas o acesso concorrente à tabela-fonte deve ser testado.
- Revisar validação profunda dos `jsonb`, limites de tamanho, URLs de fontes e conteúdo potencialmente malicioso.
- Revisar política de expiração de JWT e restrição de sessões revogadas.
- Implementar estados `approved`/`published` apenas em fase futura, com revisão humana, logs e endpoints próprios.
- `sql/internacional/fase-6-6-conteudos-localizados.sql` é obsoleto para deploy, não executar em conjunto com 6.8.

## Critérios para habilitar salvamento
Testes reais do arquivo de verificação, advisors Supabase, rollback, backend auditado, janela de lançamento e revisão editorial concluídos.

## Próxima fase candidata — 6.10
Corrigir resultados dos testes em ambiente isolado e, quando aprovados, conectar exclusivamente as RPCs autenticadas ao editor, sem liberar publicação internacional.
