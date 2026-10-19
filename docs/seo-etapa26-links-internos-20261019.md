# Etapa 26 — descoberta e links internos do acervo

## Objetivo e implementação

O GitHub Pages entrega versões HTML individuais das cinco editorias em `/arquivo/{editoria}-{id}.html`. A Etapa 26 amplia as ligações entre páginas **na etapa de build**, em vez de depender exclusivamente dos componentes carregados por JavaScript.

1. Cada página estática mostra até três **outros registros publicados da mesma coleção**. A seleção usa registros vizinhos por data de publicação/criação e um registro recente, sem duplicação, sem apontar para si e sem sugerir conexões factuais entre crimes.
2. `pesquisa.html` passa a conter um **índice HTML estático por editoria**, com `<details>` acessíveis e links descritivos para cada página canônica. Isso complementa a pesquisa interativa existente, sem substituí-la.
3. Os links provêm da **mesma consulta pública com `status_publicacao=eq.publicado`** usada para produzir o sitemap e as páginas estáticas. Títulos são escapados e rascunhos são recusados.
4. O sitemap, os endereços canônicos `/arquivo/` e os leitores interativos `?id=` permanecem inalterados.
5. Os testes validam destinos reais dentro do conjunto gerado, exclusão de rascunhos, ausência de autolinks, escape de títulos e contagem de links no índice.

## Escopo e limites

- A indexação efetiva depende do Google; links internos melhoram a possibilidade de descoberta, mas **não garantem indexação nem posicionamento**.
- Os links de leituras adicionais representam apenas a mesma **editoria**, não uma relação factual ou investigativa entre os registros.
- O índice é regenerado a cada implantação junto às páginas canônicas. A versão de `pesquisa.html` no GitHub é o template, enquanto a publicada incorpora o índice gerado.
- A navegação em JavaScript no acervo, o Admin V2, as novels e o conteúdo editorial permanecem intactos.

## Verificações

Executar `python3 -m unittest discover -s tests -p 'test_seo_internal_links.py' -v` e as verificações existentes de pré-renderização, integridade do sitemap, metadados e páginas públicas.
