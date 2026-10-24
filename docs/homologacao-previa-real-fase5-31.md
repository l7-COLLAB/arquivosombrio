# Fase 5.31 — Inspeção da prévia real e matriz mobile/desktop

Data: 23/10/2026. PR #79 permanece rascunho.

## Resultados confirmados
Commit anterior `81507ac005afb9b57613ba5b2a9e165691a8698e`: seis workflows aprovados; regressão documental https://github.com/l7-COLLAB/arquivosombrio/actions/runs/40042329888.
Artefato `capturas-dossie-documental` ID 12539941871 examinado.
Captura `cronologia-dana-unabomber-real-375.png` apresenta a seleção Unabomber com 18 marcos renderizados, navegação por anos, busca, detalhe expansível e navegação anterior/próximo. Não foi observada falha visual evidente nem corte horizontal nessa imagem.

## Cobertura complementar implementada
O teste de navegador agora captura **Dana Chandler e Unabomber separadamente em 375px e 1280px**, verificando a alternância entre 11 e 18 marcos na mesma página isolada e ausência de overflow no desktop. Os novos resultados devem ser inspecionados quando a regressão do HEAD terminar.

## Limitações
A prévia usa cópias estáticas de registros do acervo; não faz validação historiográfica nem conecta ao Supabase. A nota processual de Dana permanece excluída. Testes em aparelhos físicos, leitores de tela e aprovação editorial continuam pendentes.

Nenhum merge, deploy ou escrita no banco.
