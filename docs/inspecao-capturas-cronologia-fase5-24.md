# Fase 5.24 — Inspeção visual das capturas de homologação

Data: 23/10/2026.
Workflow inspecionado: https://github.com/l7-COLLAB/arquivosombrio/actions/runs/40038979799
Artefato: `capturas-dossie-documental` (13 imagens + relatório JSON).
Cobertura observada: 320, 375, 768, 1280 px; modos de leitura `arquivo` e `papel`, com dados fictícios.

## Achados
- Os seis workflows do commit anterior passaram.
- As capturas exibem estrutura responsiva sem corte horizontal evidente.
- O modo `papel` apresentou rótulos e controles da cronologia com contraste visual fraco em comparação ao modo escuro, problema não alcançado pelas verificações de fundo/borda existentes.
- O teste anterior afirmava apenas que havia fundo/borda, sem avaliar legibilidade das cores.

## Correção
Foi introduzido um conjunto restrito de regras em `css/caso.css` para cores de títulos auxiliares, rótulos, navegação e campos de entrada no modo papel da cronologia.
O teste de navegador verifica as cores computadas do campo de pesquisa nesse modo, além de conservar as capturas e as verificações de overflow.

## Limites
Isto não constitui auditoria de contraste WCAG completa nem homologação em aparelhos físicos. A revisão final precisa examinar novas capturas do HEAD atualizado e avaliar os textos internos das entradas, links e estados de foco. PR #79 permanece rascunho, sem deploy ou mutação de dados.
