# Auditoria de SEO e indexação — Etapa 19
**Data:** 18/10/2026. **Escopo:** inventário no Supabase (consulta somente leitura), arquivos públicos no GitHub e recursos de SEO no frontend.

## Diagnóstico

Antes da auditoria, o sitemap continha 75 URLs, incluindo apenas 4 registros de Perícia, 2 Lendas, 3 Creepypastas e nenhum acesso à Pesquisa Unificada. A comparação com o Supabase mostrou 71 registros publicados: 18 Dossiês, 29 Garimpo, 12 Perícia, 6 Lendas e 6 Creepypastas. O sitemap anterior estava incompleto e não refletia integralmente o estado publicado.

## Ajustes efetuados

- `sitemap.xml` recomposto com **71 URLs por ID** de arquivos publicados, com `lastmod` baseado em `updated_at`, `publicado_em` ou `created_at` segundo o esquema de cada tabela.
- Mantidas **20 URLs estáticas já existentes**, incluindo antigos dossiês com rotas próprias; incorporada `pesquisa.html`. **Total atual: 92 URLs.**
- `robots.txt` mantido com o sitemap original e ampliado para desencorajar rastreamento de `/admin-v2/` e `/admin-lite/`. Isso não é medida de autenticação nem impede acesso não autorizado por si só.
- Novo teste automatizado em `tests/seo-sitemap.mjs` e workflow de CI: verifica presença das editorias, contagem dos registros, datas, duplicações, URLs estáticas existentes e ausência de caminhos administrativos.

## Observações importantes

- `js/seo-publicacao.js` fornece canonical, Open Graph, Twitter Cards e JSON-LD de Article **após a execução do JavaScript da página**. Crawlers que não processam JavaScript podem não enxergar esses metadados individuais. Esta etapa não introduz pré-renderização de conteúdo.
- A atualização do sitemap é um **retrato do banco na data da auditoria**. Quando novos casos forem publicados, o sitemap precisará ser atualizado novamente, ou substituído no futuro por processo automatizado com acesso seguro de somente leitura.
- A presença no sitemap **não garante indexação**, posicionamento nem elegibilidade para resultados enriquecidos. É necessária validação posterior no Google Search Console e inspeção de URLs representativas.
- A rota `pesquisa.html?q=...` usa canonical `pesquisa.html`, evitando variantes ilimitadas por termo. 
- Não houve alterações no Supabase, nos dossiês, nas novels nem nos painéis administrativos.

## Próxima validação sugerida

Inspecionar no Search Console as URLs representativas de cada editoria, confirmar `sitemap.xml` como lido e identificar erros de rastreamento, páginas duplicadas ou ausência de renderização JavaScript. Antes de automatizar geração de sitemap, definir origem de dados segura e cronograma de publicação.
