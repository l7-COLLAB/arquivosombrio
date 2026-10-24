# Fase 5.32 — Revisão das quatro capturas reais

Data de revisão: 23/10/2026. Proposta #79 segue em rascunho.

## Execução
A reexecução do job da regressão documental `40042549789`, job `120721453178`, terminou com **success**, após cancelamento da tentativa anterior durante a instalação do Chromium.

Artefato inspecionado: `capturas-dossie-documental`, id `12539664582`.

## Capturas inspecionadas
1. `cronologia-dana-real-375.png` — Dana Chandler, 11 marcos, largura 375px.
2. `cronologia-dana-real-1280.png` — Dana Chandler, 11 marcos, largura 1280px.
3. `cronologia-dana-unabomber-real-375.png` — Unabomber, 18 marcos, largura 375px.
4. `cronologia-unabomber-real-1280.png` — Unabomber, 18 marcos, largura 1280px.

## Observações
- Os eventos estão organizados verticalmente e sem sobreposição evidente nas quatro capturas.
- Controles de seleção do dossiê, pesquisa, navegação por anos e sequência de acontecimentos aparecem nas duas larguras.
- A visualização móvel é extensa, mas não foram identificados cortes laterais evidentes.
- Não se observou defeito visual que justificasse alteração arbitrária de estilos nesta etapa.
- O último teste comprova renderização automatizada da prévia estática, não precisão de datas, fontes, identidade de registros, ou experiência em dispositivos físicos.

## Estado editorial
- A nota processual sem data de Dana permanece fora da lista de 11 marcos.
- Divergências documentais permanecem sem aprovação.
- Acessibilidade completa, dispositivos físicos e autorização editorial continuam pendentes.
- Não executar merge, deploy ou gravações em Supabase sem aprovação expressa.

**Conclusão:** Fase 5.32 aprovada apenas no escopo de regressão e revisão visual de capturas; publicação segue bloqueada.
