> **Atualização verificada — 03/11/2026:** as 38 capas e os 11 campos `story_imagem` foram efetivamente substituídos no banco por SVGs criados para o projeto, após o PR #145 (4 verificações verdes). A consulta de confirmação retornou 38/38 registros publicados com capa correta, 11/11 Stories com referência correta, 38 backups individuais em `private.cover_upload_replacement_audit_20261103` e quatro gatilhos de narração reabilitados. O documento abaixo descreve **o planejamento prévio**; para o estado final, consulte [Registro de publicação 38 capas e 11 Stories](REGISTRO_PUBLICACAO_38_CAPAS_E_11_STORIES_20261103.md). Permanecem seis situações especiais a resolver, incluindo uma com termos NIST documentados, e 14 objetos antigos de Stories no Storage não apagados.

# Substituição das 38 capas do Storage — relatório de origem e execução controlada

**Data do ciclo:** 03/11/2026. **Status inicial:** alternativas originais preparadas em branch para homologação técnica antes de alterar o banco.

## Origem: o que foi localizado

O cruzamento de `private.cover_rights_review_20261103`, `storage.objects`, arquivos do GitHub, Central de Gestão/Notion e histórico editorial encontrou 38 URLs de capas armazenadas no Supabase, mas **não apresentou contratos, licenças específicas, autorização de fotógrafo ou arquivos de produção que comprovem titularidade para o conjunto**.

Há menções antigas a capas de Sylvia Likens e Família Turpin descritas como ilustrações próprias, assim como uma capa original criada para um piloto de novel. Essas declarações são **indícios históricos**, não documento suficiente para atribuir propriedade ou assegurar inexistência de material de terceiros; não servem como certificado para os arquivos atuais. O nome de um arquivo (inclusive `chatgpt-image`) também não prova a origem.

Todas as imagens foram preservadas no Storage, inclusive 4 capas de novels, 1 de creepypasta, 1 de perícia, 9 dossiês e 23 garimpos. Não substituir a categoria jurídica de “origem sem comprovação” por “violação confirmada”.

## Resultado artístico

Produzidas `38` capas SVG vetoriais independentes, com texto e formas geométricas próprias, sem fotografia ou representação de pessoas; `11` artes adicionais em formato vertical 1080×1920 para o campo de Story.

Arte gerada de modo **reproduzível** por `scripts/original-covers-svg.mjs`, conforme manifesto `data/alternativas-originais-uploads-20261103.json`. Capas em `assets/capas-alternativas-direitos/upload-...`; Stories em `assets/capas-alternativas-direitos/story-...`. A [galeria de revisão](../previews/capas-uploads-originais-20261103.html) está marcada como `noindex`.

Não identificar qualquer elemento da arte como retrato, prova, objeto verdadeiro ou fotografia do acontecimento. As capas de novels são obras gráficas originais, diferentes do texto literário e de capas comerciais de editoras.

## Dependências de Stories

Verificação dos `11` registros com cópias idênticas no bucket `imagens`:

- Nos IDs `11, 15, 18, 19, 21, 23, 36, 38, 39, 48`, o campo `story_imagem` continha imagem com `eTag` idêntico ao da capa antiga.
- No ID `40` (Pamela Hupp/Betsy Faria), o campo `story_imagem` apontava para **outro arquivo**, também sem prova documental específica de licença.
- Os **14 objetos antigos de Stories** são cópias históricas armazenadas, não 14 publicações demonstradas no Instagram.
- Os Stories antigos expiraram pela data; o #48 (Rachel Nickell) tem expiração em **04/11/2026 15:20 UTC**. Não alterar `story_ativo`, `story_publicado_em` ou `story_expira_em` apenas pela revisão de direitos.
- A decisão de substituição dos campos de imagem deve conservar backup das **11 URLs anteriores**, sem eliminar objetos do Storage. Alterar 11 campos `story_imagem` somente se ainda coincidirem com a linha de base consultada. A publicação em plataformas externas não é reversível por alteração no Supabase; qualquer postagem antiga permanece tarefa editorial separada.

## Publicação e rollback (a executar somente com arquivos no main e checks aprovados)

1. Comprovar que as 49 SVGs do manifesto existem, são autocontidas, correspondem às versões de código e passam testes de legibilidade, `alt`, SEO e responsividade.
2. Realizar backup privado transacional por `editoria:content_id` das **38 URLs de capa anteriores** e das **11 imagens de Story anteriores**, incluindo legenda/fonte anteriores em Perícia. Novels usam UUID; por isso as chaves de rollback devem ser texto.
3. Conferir pré-condições: 38 registros com `status_publicacao='publicado'`; capa atual igual à URL antiga inteira; Story atual igual à URL observada; 38 IDs únicos, 11 Stories identificados.
4. Trocar apenas `imagem` (Casos/Perícias), `imagem_capa` (Garimpos/Novels/Creepypastas) e `story_imagem` (11 Garimpos). Em Perícia, atualizar `legenda_imagem` e `fonte_imagem` para crédito de arte original.
5. Desativar **temporariamente e apenas na mesma transação** os triggers `trg_prewarm_casos`, `trg_prewarm_garimpo`, `trg_prewarm_pericias` e reativá-los antes do commit para não reiniciar narrações. Rejeitar toda a transação se qualquer comparação divergir.
6. Confirmar após o commit: 38/38 capa, 11/11 Story, 38/38 backup; registrar status no inventário privado e reposicionar metadados de SEO pelo workflow de Pages. Não alterar conteúdo dos dossiês ou versões de texto. Nunca excluir arquivos antigos automaticamente.
7. Verificar SSR SEO em `arquivo/` e compartilhamento social com JPEG institucional já existente, que é fallback para SVG.
8. Após confirmação, registrar a substituição no manifesto `publicado_no_banco`; manter o histórico e as ressalvas legais sem declarar outras imagens do site regularizadas.

## Pendências paralelas fora do escopo

Ainda restam **6 casos especiais** no inventário de 44: 3 fontes institucionais (NIST possui termos públicos documentados, FBI e Boulder exigem revisão adicional), 1 arquivo WEBP local com foto-base, 1 base64 incorporado e 1 artigo sem capa. A revisão de imagens internas do texto e da publicação do Instagram continua necessária.

**Não há certificado jurídico global nem afirmação de que todos os antigos uploads eram ilegais.** O repositório e os dados publicados possuem históricos e backups; as condições de reutilização de imagens dependem de cada obra e de seu autor.
