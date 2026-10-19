# Etapa 21 — HTML SEO pré-renderizado dos arquivos publicados

Implementação: 19/10/2026. Implantação: GitHub Pages.

## Arquitetura

O Pages não consegue entregar HTML distinto de acordo com `?id=`. Assim, cada registro publicado ganha uma rota **adicional** `/arquivo/{categoria}-{id}.html` com HTML gerado no momento do deploy. As URLs interativas originais `caso.html?id=...`, `garimpo.html?id=...` etc. permanecem válidas. Em visitas com JavaScript, o gerador de metadados do leitor original aponta o canonical para a rota estática. O sitemap publicado também lista essas rotas como URLs canônicas.

Cada página estática inclui, no HTML inicial, título, description, canonical, Open Graph, JSON-LD Article, resumo e texto narrativo público disponível, além de links para continuar na versão interativa com anexos, evidências e controles de leitura. A apresentação textual estática é uma alternativa de leitura e indexação, **não** substitui o leitor interativo integral nem todos os componentes documentais.

## Fonte e privacidade

O gerador `scripts/build-seo-pages.py` usa a chave pública anon e as políticas RLS para consultar as cinco tabelas com o filtro adicional `status_publicacao=eq.publicado`. Todas as consultas precisam concluir sem erro. Antes de gerar páginas, valida status, ID numérico, título e data. Dados editoriais são escapados como texto HTML; não injeta HTML de usuários diretamente nas páginas. Dados estruturados usam JSON seguro.

O sitemap é gerado da **mesma fotografia de dados** utilizada pelo pré-renderizador, reduzindo divergências entre URLs do mapa e arquivos criados. Se houver falha, o processo não chega a publicar o artefato Pages. O script mantém somente as páginas no artefato do deploy, sem inserir publicações no repositório.

## Validação

- Testes de geração, escape HTML, exclusão de rascunhos e URLs originais.
- Testes de sitemap, metadados e sintaxe JavaScript.
- Consulta pública real no GitHub Actions concluída em 19/10/2026: **73 registros publicados**, **73 páginas estáticas**, **21 URLs estáticas anteriores**, **94 URLs no sitemap**.
- Os totais variam com novas publicações; o deploy é disparado em pushes e no agendamento de seis em seis horas.

## Limites e próximas verificações

- Indexação, posicionamento e rich results **não são garantidos**. Usar o Search Console para inspecionar URLs canônicas individuais.
- As páginas pré-renderizadas mostram resumo e texto narrativo disponível; cronologias, galerias, áudio, fontes e evidências podem exigir a versão interativa.
- URLs antigas continuam acessíveis, mas seus meta canonical são inseridos via JavaScript, que nem todo crawler executa.
- Não modifica conteúdo, tabelas, novels, autenticação ou Admin V2.
