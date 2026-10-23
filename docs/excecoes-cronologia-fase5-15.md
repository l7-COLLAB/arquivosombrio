# Fase 5.15 — Exceções e critérios de revisão editorial

Data: 23/10/2026. Base: os 38 registros reais do relatório Fase 5.9, após 37 itens de mês/ano tratados na Fase 5.10.

## Resultado técnico
Todos os seis fluxos do commit `d042f5d99542ac5b992ee5373c851584dc655f2e` passaram, inclusive a regressão de prévias reais (run 40009136284). O teste garante preservação literal e bloqueio de publicação automática; **não verifica veracidade histórica**.

## Triagem das 38 exceções
- 14 intervalos ou múltiplas datas: preservar todos os marcos, não fixar um único dia.
- 10 períodos aproximados: não eliminar qualificadores de incerteza.
- 4 registros com horário: preservar qualificadores como “cerca de” e a divergência de horários registrada na descrição.
- 4 registros mês/ano com barra: permitir prévia de período, mas revisar forma editorial.
- 2 strings contendo múltiplos eventos: **exigem segmentação editorial manual**; nunca usar o primeiro evento como resumo do conjunto.
- 2 referências auxiliares: **não são eventos cronológicos**; devem ser encaminhadas à revisão de fontes, não receber data.
- 2 marcadores sem data: manter sem data até apuração documental.

## Critérios de aceite
1. Candidato sintático não é evento factual confirmado; cotejar os documentos primários ou fontes verificadas.
2. O campo `texto_original` permanece integral e imutável.
3. Os campos `fonte`, `natureza_documental` e datas de precisão superior não são inferidos.
4. Mudanças publicáveis dependem de revisão individual e autorização expressa.
5. A revisão prioriza as duas strings multi-evento e as duas referências auxiliares, que não devem ser tratadas como um evento único.

Nenhuma atualização executada no Supabase ou em produção.
