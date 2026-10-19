# Etapa 18 — auditoria da pesquisa unificada com dados reais

Data: 18/10/2026. Fonte: consultas **somente leitura** ao projeto Supabase Arquivo Sombrio e análise do código de `pesquisa.html` / `js/pesquisa-acervo.js`.

## Inventário confirmado no banco

| Editoria | Publicados | Rascunhos |
| --- | ---: | ---: |
| Dossiês (`Casos`) | 18 | 3 |
| Garimpo Sombrio (`casos_diarios`) | 29 | 5 |
| Perícia (`pericias`) | 12 | 2 |
| Lendas (`lendas`) | 6 | 0 |
| Creepypastas (`creepypastas`) | 6 | 1 |
| Total | **71** | **11** |

Sem ID/título vazio nem `created_at` nulo nas cinco tabelas na data da consulta. As cinco possuem RLS de leitura pública para itens publicados; a consulta do frontend filtra `status_publicacao=eq.publicado` e filtra o resultado novamente antes de exibir.

## Amostras públicas conferidas

- Dossiês: ID 26, Cari Farver: a vítima que foi transformada em perseguidora — destino `caso.html?id=26`
- Garimpo: ID 28, Ronald Cotton: a certeza que condenou o homem errado — `garimpo.html?id=28`
- Perícia: ID 10, Genealogia genética e a solução de crimes antigos — `pericia.html?id=10#forense`
- Lendas: ID 4, A Pisadeira — `lendas.html?id=4`
- Creepypastas: ID 4, Mr. Widemouth — `creepypastas.html?id=4`

Os destinos são derivados dos templates do código e confirmados por testes de integração simulados. **Não houve teste de abertura por navegador autenticado ou medição de rede real**, portanto não afirmar HTTP 200 para cada destino.

## Correção motivada pela auditoria

Antes, se uma editoria falhasse e as demais não retornassem correspondência, a interface indicava simplesmente "nenhum registro", o que podia levar à conclusão incorreta de que a busca estava completa. Agora:
- Resultados parciais informam explicitamente que algumas editorias estão indisponíveis.
- Resultado vazio com falha parcial explica que a pesquisa é incompleta.
- O botão de recuperação consulta novamente **apenas** as editorias com falha e preserva resultados anteriores.
- Uma falha total é diferenciada da ausência de correspondências.
- Nenhuma gravação em Supabase e nenhuma alteração de conteúdos.

## Escopo e limites

Testes de integração Node com amostras de títulos e IDs reais confirmados no banco, mais falhas simuladas via injeção de resposta de rede. Continuam necessários: teste manual em celular, leitor de telas, verificação HTTP real dos links e medição de desempenho.
