# Etapa 25 — compatibilidade entre páginas canônicas e URLs legadas

Em 19/10/2026, a planilha de cobertura do Google Search Console identificou `caso.html?id=11` e `caso.html?id=19` como páginas duplicadas sem canônica selecionada. Os últimos rastreamentos informados (10/10 e 07/10) antecederam a criação das páginas canônicas HTML em 19/10.

Ambos os registros estão publicados no Supabase: ID 11 (Caso Watts) e ID 19 (Robert Pickton). O JS atual `js/seo-publicacao.js` aponta, quando executado, para `/arquivo/caso-11.html` e `/arquivo/caso-19.html`. O HTML inicial de `caso.html?id=...` é genérico porque GitHub Pages entrega a mesma página para todos os parâmetros; **não afirmar que Google processou a canonicalização JavaScript** sem Inspeção de URL.

## Ajuste de prevenção e auditoria

A auditoria pública diária `scripts/audit-public-crawlability.py` agora verifica, para as URLs canônicas amostradas em cinco editorias, se:

- a rota canônica retorna HTTP 200 e declara canonical correspondente, título, OG URL e ausência de noindex;
- o HTML estático contém link exato para o leitor interativo original com `?id=`;
- a versão original com `?id=` continua acessível sem redirecionamentos indevidos.

Um erro bloqueia a execução da auditoria e gera relatório JSON em GitHub Actions. Isso não muda URLs, conteúdo, novels, banco, nem altera o acesso ao Admin V2.

## Pendências no Search Console

- Inspecionar `https://arquivosombrio.net.br/arquivo/caso-11.html` e `https://arquivosombrio.net.br/arquivo/caso-19.html`.
- Comparar a canônica declarada, a escolhida pelo Google, a última data de rastreamento e a possibilidade de indexação.
- Repetir após novo processamento do sitemap em 19/10. Ausência de mudança imediata no relatório não comprova problema atual.
- Não executar redirecionamento 301 ou `noindex` nas URLs legadas sem avaliar o efeito sobre o leitor interativo e a canonicalização já existente.
