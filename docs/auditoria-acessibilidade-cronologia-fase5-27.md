# Fase 5.27 — Auditoria final de acessibilidade (escopo automatizado)

Data: 23/10/2026. PR #79 (rascunho). Nenhuma escrita Supabase, merge ou deploy.

## Base aprovada
O HEAD anterior `92c8e9c496b1d62e196bb071f06bdbfd7452ff71` concluiu seis workflows com sucesso, inclusive regressão documental.

## Novas verificações incluídas
Em `tests/dossier-browser-smoke.mjs`, executado em Chromium com dados fictícios:
- Campos `input` e `select` dentro da cronologia devem possuir `label` associado ou nome ARIA.
- Botões da cronologia devem possuir nome textual ou `aria-label`.
- Campo de pesquisa no modo Papel deve alcançar relação de contraste de texto **igual ou superior a 4,5:1**, calculada a partir das cores CSS.
- Mantidas verificações de foco, filtros, navegação, ausência de rolagem horizontal e capturas em 320, 375, 768 e 1280 px.

## Limites explícitos
Este teste de contraste cobre o campo de pesquisa no modo Papel, **não toda a página ou todas as combinações de estados**. Nome computado acessível completo, uso de leitor de tela, voz, navegação em dispositivos reais e inspeção das novas capturas ainda precisam ser avaliados. Não declarar homologação WCAG integral.

## Liberação
Bloqueada: pendências documentais, identidade do registro no Supabase, rollback, aprovação editorial e autorização expressa antes de produção.
