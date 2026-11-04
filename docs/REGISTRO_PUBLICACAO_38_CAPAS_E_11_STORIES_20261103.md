# Publicação e rollback — 38 capas e 11 Stories (03/11/2026)

## Resultado comprovado no Supabase de produção

Após a integração do [PR #145](https://github.com/l7-COLLAB/arquivosombrio/pull/145), com 4 verificações de CI aprovadas, as imagens de capa dos **38 registros publicados** que utilizavam uploads sem comprovação de direitos foram substituídas por ilustrações vetoriais próprias do projeto. Os **11 campos `story_imagem`** relacionados foram atualizados para artes verticais originais.

**Verificações SQL pós-transação:**

| Critério | Resultado |
|---|---:|
| Backups individuais em `private.cover_upload_replacement_audit_20261103` | 38/38 |
| Capas publicadas correspondentes às novas URLs | 38/38 |
| Artigos com `status_publicacao='publicado'` mantido | 38/38 |
| Campos Story atualizados conforme novas URLs | 11/11 |
| URLs antigas de Story gravadas em backup | 11/11 |
| Triggers de narração (`Casos`, Garimpo, Perícias, Creepypastas) reabilitados | 4/4 |
| RLS da tabela de backup | Habilitada |
| Permissão de leitura para `anon` ou `authenticated` | Negada |

**Distribuição:** 9 Dossiês, 23 Garimpos, 1 Creepypasta, 4 Novels e 1 Perícia. A Perícia #5 recebeu legenda e fonte adequadas à nova arte ilustrativa.

A transação foi atômica: o conjunto foi bloqueado para alterações concorrentes de imagem; URLs originais foram confrontadas com `private.cover_rights_review_20261103`; os Stories antigos foram comparados exatamente; os backups foram inseridos antes das atualizações; qualquer divergência provocaria rollback de toda a transação. A rotina de prewarm de narração foi suspensa somente dentro dessa transação e reativada antes do commit. Nenhuma narração, artigo, capítulo, usuário ou arquivo de Storage foi excluído.

## Prova das alternativas e transparência pública

- Todas as imagens novas são SVGs de composição geométrica própria, criadas para o Arquivo Sombrio por `scripts/original-covers-svg.mjs`, sem fotografias ou recursos externos.
- `data/alternativas-originais-uploads-20261103.json` registra os 38 destinos e 11 artes de Story, com identificação dos arquivos e da natureza ilustrativa.
- `js/cover-credits.js` e `js/novels.js` foram atualizados para aplicar atribuição textual e descrever as capas como ilustrações; o gerador de páginas estáticas e o SEO dinâmico já utilizam JPEG institucional como Open Graph quando a capa do artigo é SVG.
- A galeria `previews/capas-uploads-originais-20261103.html` permite revisar os 49 desenhos e está marcada `noindex`.
- `creditos-imagens.html` passa a documentar **110 entradas**: 51 créditos de imagens documentais anteriores e 59 artes originais (21 de imagens externas trocadas anteriormente + 38 do Storage). O registro não atribui licença de foto de terceiro às ilustrações.

## Tratamento de Stories e arquivos anteriores

Os 11 `story_imagem` foram substituídos sem modificar `story_ativo`, `story_publicado_em`, `story_expira_em`, texto de Story ou o título do caso. Os **14 arquivos historicamente duplicados** sob caminhos `casos-diarios/stories/` continuam no Storage, sem exclusão automática; sua existência não prova que foram publicados no Instagram ou que ainda estão em um cache externo.

Para o Garimpo #40 (Pamela Hupp/Betsy Faria), a imagem antes selecionada no Story era **diferente** da capa duplicada. A URL desse Story também foi conservada em backup e o campo foi substituído pela arte original. Para Garimpo #48 (Rachel Nickell), o Story tinha expiração programada em 04/11/2026 15:20 UTC; o prazo não foi alterado.

Caso haja postagem antiga em Instagram, a mudança no Supabase não retira cópias já publicadas naquela plataforma. A verificação e possível remoção/reedição de posts externos seguem como tarefa editorial separada.

## Reversão tecnicamente disponível

Para restaurar **somente se apropriado** (por exemplo, falha técnica), um operador privilegiado pode consultar `private.cover_upload_replacement_audit_20261103` e restaurar URLs antigas quando as atuais **ainda correspondem** ao destino salvo, sem sobrescrever alterações posteriores. São preservados os links integrais, inclusive eventuais parâmetros, e os campos anteriores da Perícia #5. Os quatro gatilhos de narração devem ser suspensos e reabilitados na **mesma transação** caso ocorra uma reversão apenas visual. Não restaurar imagens sem autorização comprovada como correção automática de problemas gráficos.

## Pendências remanescentes

Do inventário original de 44, os 38 uploads receberam ilustrações originais. Restam **6 registros especiais**, sendo 5 sem documentação/providência concluída e 1 (Perícia #12) com termos institucionais do NIST documentados, ainda sujeito à análise de aplicação territorial:

1. `Casos:7` — foto escolar de JonBenét Ramsey hospedada por Boulder, titularidade do fotógrafo não comprovada.
2. `casos_diarios:33` — esboços de D. B. Cooper publicados pelo FBI; confirmar escopo dos termos de reutilização.
3. `Casos:15` — composição local de Joseph DeAngelo com foto-base sem direitos demonstrados.
4. `casos_diarios:6` — JPEG incorporado por base64 para Relisha Rudd, sem histórico de licença.
5. `Casos:10` — Barbara Mackle sem capa principal (pendência de qualidade editorial, não necessariamente copyright).
6. `pericias:12` — infográfico NIST com termos e crédito documentados; análise territorial ainda recomendada.

Outros riscos não resolvidos por esta operação: fotografias **dentro** dos artigos, os 14 objetos históricos de Stories no Storage, postagens antigas em redes sociais e os 21 créditos documentais antigos que não passaram por cotejo independente de origem.

**Limite de homologação:** o HTTP público de `arquivosombrio.net.br` não pôde ser consultado a partir da rede de verificação (falha de DNS deste ambiente); os checks do GitHub confirmam integridade de código e o SQL confirmou produção, mas não se declara validação visual externa do domínio.
