# Fase 5.8 — Auditoria de cobertura da conversão

Data da consulta: 23/10/2026. Supabase `public."Casos"`, somente SELECT.

## Testes
Commit `31ba35272ce2c434e557728f61e63322eccdcc12`: seis workflows aprovados, inclusive regressão documental https://github.com/l7-COLLAB/arquivosombrio/actions/runs/39987421604.

## Inventário observado
- 327 acontecimentos: 322 strings e 5 objetos previamente estruturados.
- Uma consulta exploratória SQL marcou 71 strings com prefixo aproximado de ano/data seguido de separador, 41 strings com quebra de linha real e 34 com cabeçalho aproximado mais quebra de linha.
- Estes conjuntos **podem se sobrepor** e são aproximações SQL, não execução literal de `normalizarEvento`.
- A contagem de textos contendo sequência literal de escape não foi considerada confiável para estimativa, pois depende do comportamento de escapes no SQL e da representação serializada.
- Algumas strings trazem datas no começo sem separador; outras trazem meses, intervalos, horários ou qualificadores (como 'aproximadamente'). O código faz validação conservadora e marca cada candidato para revisão.

## Interpretação
É incorreto somar as categorias para afirmar número exato de eventos elegíveis. Antes de qualquer migração, obter relatório por item gerado com o normalizador JS sobre uma exportação de somente leitura. Ainda não houve aplicação no banco.

## Pendências
1. Medir contagem exata em um único algoritmo JavaScript e mostrar os casos rejeitados.
2. Rever grafias e datas impossíveis; preservar fontes, texto e ordem original.
3. Validar amostras por dossiê antes de elaborar procedimento de migração reversível.
4. Manter PR #79 em rascunho, sem merge nem deploy, dependendo de #75.
