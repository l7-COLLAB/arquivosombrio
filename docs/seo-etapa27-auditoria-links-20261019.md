# Etapa 27 — auditoria automática de links internos e páginas órfãs

## Escopo

O script `scripts/audit-internal-links.py` verifica, **no artefato preparado para o GitHub Pages**, a conectividade das páginas HTML canônicas geradas a partir das cinco editorias públicas.

A auditoria:

- extrai as páginas `/arquivo/{categoria}-{id}.html` do artefato e cruza os endereços com o `sitemap.xml`;
- verifica se cada página está ligada **exatamente uma vez** a partir do índice HTML público em `pesquisa.html`;
- examina os links internos entre páginas de artigos e rejeita destinos sem página HTML ou ausentes do sitemap;
- identifica páginas sem nenhum link de entrada da pesquisa ou das páginas de artigos (páginas órfãs);
- produz um relatório JSON com número de páginas, links de índice, links cruzados, páginas órfãs, links inválidos e erros.

Os testes abrangem um catálogo fictício **somente na memória de testes**, incluindo cenários de links quebrados, páginas órfãs e repetições. Esses registros não são publicados nem gravados no banco.

## Automação

A etapa é executada após a pré-renderização de arquivos e depois da auditoria de metadados, **antes** do upload do artefato GitHub Pages. Erros de integridade provocam falha do deploy, impedindo a publicação de um índice incompleto.

O workflow `seo-dynamic-qa.yml` repete a validação em uma construção temporária com dados públicos do Supabase e executa `tests/test_audit_internal_links.py`.

## Limitações

O auditor verifica links **HTML estáticos do índice e dos artigos pré-renderizados**. Não cobre todos os links gerados dinamicamente por JavaScript, links externos, imagens, links internos no texto original da novel, nem garante indexação pelo Google. A checagem não substitui inspeção de URLs pelo Search Console.

Nenhuma alteração de texto editorial, novelas, URLs canônicas, banco ou Admin V2 foi necessária.
