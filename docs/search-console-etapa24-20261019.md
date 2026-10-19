# Etapa 24 — acompanhamento do Google Search Console

Consulta: 19/10/2026, propriedade **`sc-domain:arquivosombrio.net.br`**, via Windsor.ai com autorização de leitura. Fonte para os dados de Search Console: conector `searchconsole`; dados técnicos do site: GitHub Pages e auditorias automatizadas das etapas 21–23.

## Comparação de sitemaps

| Indicador | Valor |
| --- | --- |
| Sitemap submetido no GSC | `https://arquivosombrio.net.br/sitemap.xml` |
| URLs submetidas, como retornado pelo conector | **72** |
| Último envio registrado no Google | 21/09/2026 |
| Último download registrado pelo Google | **16/10/2026** |
| Erros do sitemap | **0** |
| Avisos do sitemap | **0** |
| Sitemap público, última auditoria independente (19/10) | **94 URLs**, 73 páginas individuais e 21 estáticas |

**Conclusão verificável:** existe defasagem entre o snapshot reportado no GSC e o sitemap público atualizado. Os números acima **não** demonstram quantas URLs foram efetivamente indexadas: o campo `indexed` da integração está obsoleto e não é confiável para isso.

## Evidência de resultados de pesquisa

Consulta de páginas no período **01/10/2026–16/10/2026**:

| Página | Cliques | Impressões |
| --- | ---: | ---: |
| `/` | 5 | 15 |
| `/diretrizes.html` | 1 | 3 |
| `/caso.html?id=10` | 0 | 3 |
| `/caso.html?id=13` | 0 | 3 |
| `/dossies.html` | 0 | 4 |
| `/garimpo.html?id=27` | 0 | 1 |
| `/garimpo.html?id=6` | 0 | 2 |
| `/privacidade.html` | 0 | 8 |

Estes registros demonstram impressões de URLs legadas **antes** da adoção das páginas pré-renderizadas. Não é correto concluir que as novas canônicas foram recusadas pelo Google: ainda não há dados suficientes após 19/10.

## Ações dependentes de Search Console (usuário proprietário)

1. Em [Sitemaps](https://search.google.com/search-console/sitemaps), selecionar `arquivosombrio.net.br` e reenviar `https://arquivosombrio.net.br/sitemap.xml`. A API acessível pela integração instalada é de **leitura**, portanto esta ação não foi executada automaticamente.
2. Em **Indexação → Páginas**, registrar o total de **indexadas** e **não indexadas**, além da distribuição de motivos.
3. Em **Inspeção de URL**, conferir as canônicas HTML:
   - `https://arquivosombrio.net.br/arquivo/caso-10.html`
   - `https://arquivosombrio.net.br/arquivo/caso-13.html`
   - `https://arquivosombrio.net.br/arquivo/garimpo-6.html`
   - `https://arquivosombrio.net.br/arquivo/garimpo-27.html`
   - `https://arquivosombrio.net.br/arquivo/pericia-10.html`
   - `https://arquivosombrio.net.br/arquivo/lendas-4.html`
   - `https://arquivosombrio.net.br/arquivo/creepypastas-4.html`
4. Comparar a **canônica declarada** e a **canônica escolhida pelo Google** para uma URL antiga e a nova rota correspondente. As duas URLs não devem ser confundidas.
5. Após o Google atualizar o processamento, repetir a coleta de sitemap e Search Analytics. Somente então classificar problemas reais de indexação e definir correções.

## Situação e limites

- Auditoria HTTP anterior das páginas públicas: 94 URLs no sitemap, 10 URLs de amostra verificadas, sem divergências técnicas encontradas na amostra.
- Nenhum envio/reenvio foi feito no Google Search Console; a integração disponível é de leitura.
- Nenhuma correção de canonical foi introduzida nesta etapa, porque o diagnóstico ainda não indica erro técnico nas canônicas publicadas.
- Preservados banco de dados, conteúdo, novels, roteamento original e Admin V2.
