# Fase 5.30 — Homologação isolada de cronologias do acervo

Data: 23/10/2026. PR #79 em rascunho, dependente da proposta #75.

## Implementado
- `previews/cronologia-acervo-real-fase5-30.html`: prévia isolada que carrega exclusivamente o JSON de revisão armazenado no repositório. Não utiliza cliente Supabase, credenciais nem mutações remotas.
- Dossiês incluídos: Dana Chandler (11 marcos e 1 nota excluída da cronologia) e Unabomber (18 marcos).
- As descrições e períodos da proposta estruturada são exibidos na interface existente sem atribuir categorias/fonte inventadas.
- `tests/dossier-browser-smoke.mjs`: navegador usa rota local simulada para fornecer HTML, JS, CSS e JSON previamente versionados; verifica seleção, contagem dos marcos, ausência de links de fontes inventados, overflow e gera captura.

## Limites
Testes verificam renderização técnica com **cópia real extraída anteriormente**, não fazem validação factual, atualização do banco ou integração de produção. Alguns marcos ainda exigem cotejo de fontes e notas de status, e nenhuma aprovação editorial é presumida.

## Verificação
Confirmar a regressão documental na versão final antes de marcar como tecnicamente homologada. Não fazer merge/deploy/gravação sem aprovação expressa.
