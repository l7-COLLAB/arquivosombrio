# Direitos de capas — pesquisa de origem e conciliação do lote de 44

**Data de corte:** 03/11/2026. **Projeto:** Arquivo Sombrio. **Modalidade:** auditoria de origem, licenças, cópias de Stories e preservação dos conteúdos publicados.

## 1. Reconciliação com a produção

- Partida: 115 capas do inventário histórico. As 21 capas externas substituídas por SVG no ciclo anterior permanecem separadas (PRs #136–#138); 29 Wikimedia têm páginas de origem/declarações de licença registradas; 21 capas já possuíam vínculo no manifesto histórico.
- Foram confrontados com o banco real os **44 registros do lote pendente**, todos com `status_publicacao='publicado'` e **44/44 URLs atuais correspondentes à linha de base**.
- Distribuição atual: **38 uploads Supabase**, **3 imagens institucionais**, **1 WEBP local**, **1 JPEG incorporado como data URI** e **1 publicação com campo de capa vazio**.
- Criado inventário rastreável em `private.cover_rights_review_20261103` com 44 linhas, RLS ativo e privilégios removidos dos papéis `anon`, `authenticated` e `service_role`. A auditoria privada preserva a referência original sem publicar o JPEG incorporado como base64. O CSV público de situação é `docs/inventario-direitos-44-pendencias-20261103.csv`.
- **43 registros ainda exigem comprovação de direitos, decisão editorial ou preenchimento do campo de capa**. Um material do NIST possui termos institucionais documentados e crédito já presente no artigo, sem atribuição de domínio público irrestrito no Brasil.

## 2. Arquivos enviados ao Supabase — 38

- Os 38 uploads estavam presentes no Storage e foram rastreados anteriormente: **34 arquivos no bucket `imagens`**, **4 no bucket `novel-capas`**.
- As informações de Storage identificam o momento e o responsável técnico pelo upload, mas **não incluem prova da origem autoral, licença de reprodução ou direito à imagem**; `user_metadata` não continha dados de proveniência em nenhum dos 38. O proprietário técnico de um arquivo não é necessariamente o detentor de seus direitos autorais.
- Quantitativo: **9 Dossiês, 23 Garimpos, 1 Creepypasta, 4 Novels, 1 Perícia**.
- **11 dessas capas possuem 14 cópias de bytes idênticos em caminhos de `casos-diarios/stories/`** (identificadas pelo mesmo `eTag` no Storage): Garimpo IDs 11 (2), 15 (2), 18, 19, 21, 23, 36, 38, 39 (2), 40 e 48. Isso **não comprova publicação no Instagram**. Quando houver substituição da capa, verificar também os arquivos usados em Stories; uma autorização para uso no site pode não abranger redes sociais.
- Um arquivo do bucket `novel-capas` de **O Cão dos Baskervilles** tem bytes iguais aos de uma versão armazenada em pasta de **Os Assassinatos da Rua Morgue**. Contudo, consulta das **8 novels publicadas** encontrou **zero capas atualmente selecionadas com bytes duplicados entre si**. A duplicação é no acervo de Storage e não foi comprovada como erro entre capas ativas.
- Os quatro livros com capas nesse bucket são **A Casa dos Pinheiros Sussurrantes**, **A Marca do Polegar Vermelho**, **O Cão dos Baskervilles** e **Os Assassinatos da Rua Morgue**. A antiguidade do texto de uma obra não comprova domínio público da arte gráfica específica. Deve-se localizar a origem do layout/capa, o artista e os termos de uso.
- `pericias.id=5` possui nome de arquivo iniciado por `chatgpt-image`. Essa nomenclatura é **um indício de geração digital a investigar**, e não uma garantia de autoria, ausência de elementos protegidos, nem prova de direitos de exploração.

## 3. Fontes institucionais — três situações diferentes

**Perícia #12 — NIST (documentação encontrada):** página original [Using 'Minutiae' to Match Fingerprints Can Be Accurate](https://www.nist.gov/image/using-minutiae-match-fingerprints-can-be-accurate) identifica o material como infográfico, crédito **NIST**, data **22/03/2006**, referência **06ITL001**. O [aviso institucional NIST](https://www.nist.gov/copyrights-disclaimers) permite distribuir ou copiar o material de suas páginas salvo conteúdos especificamente marcados como protegidos e solicita atribuição. O registro `pericias.id=12` já exibe `fonte_imagem` com nome e URL da fonte, e legenda esclarecendo que a imagem não pertence ao caso. A fonte e as condições foram acrescentadas ao registro público de créditos (`creditos-imagens.html`). **Estado:** termos e créditos documentados; não emitir certificação irrestrita de uso internacional ou propriedade de eventuais elementos de terceiros.

**Garimpo #33 — FBI (pendência de escopo):** [ficha original de esboços de D. B. Cooper](https://www.fbi.gov/image-repository/cooper-sketches.jpeg/view), associada à [ficha multimídia do FBI](https://multimedia.fbi.gov/item?id=6790&type=image). O portal [multimedia.fbi.gov](https://multimedia.fbi.gov/) permite uso de imagens para divulgar o FBI, mediante crédito. Não foi demonstrado, neste trabalho, que a aplicação específica na capa de um artigo criminal publicado por terceiro esteja coberta pelos termos sem outras ressalvas. **Estado:** direitos a confirmar ou obter substituto seguro.

**Dossiê #7 — Boulder/JonBenét Ramsey (pendência de titularidade):** a fotografia escolar hospedada pela prefeitura de Boulder não traz prova de que o município seja o titular da fotografia ou tenha autorização para sublicenciá-la a outros sites. Além dos direitos patrimoniais, a representação de uma criança falecida exige avaliação editorial cuidadosa. **Estado:** autorização ou substituição editorial recomendada; nenhum uso autorizado foi presumido.

Fontes institucionais e ressalvas estão reunidas em `data/termos-institucionais-capas-20261103.json`.

## 4. Dois arquivos locais/incorporados e um campo vazio

- **Dossiê #15, Joseph DeAngelo:** `img/dossies/joseph-deangelo-capa.webp` existe no GitHub. A inspeção visual identificou **uma composição com retrato fotográfico e sobreposições editoriais**. É necessário localizar direitos da foto original e de sua adaptação, mesmo que a colagem tenha sido realizada pelo Arquivo Sombrio. Prioridade elevada.
- **Garimpo #6, Relisha Rudd:** o campo contém uma imagem `data:image/jpeg;base64,...` de aproximadamente **83.759 caracteres**, sem nome original nem registro de licença. O CSV não replica os bytes; antes de substituir, é necessário preservar a imagem atual em backup e localizar sua procedência.
- **Dossiê #10, Barbara Mackle:** o campo principal de capa está vazio. Isso **não é indício de violação de direitos**, mas de ausência de imagem principal; pode-se acrescentar arte própria com documentação de criação.

## 5. Fundamento e limites

O Ministério da Cultura esclarece que fotografias e ilustrações podem ser obras protegidas, sem que sua mera presença na internet constitua autorização de reutilização: [perguntas frequentes sobre direitos autorais](https://www.gov.br/cultura/pt-br/assuntos/direitos-autorais/perguntas-frequentes/perguntas-frequentes). A [Lei nº 9.610/1998](https://www.planalto.gov.br/ccivil_03/leis/l9610.htm), especialmente os arts. 44 e 79, estabelece proteção de fotografias e requisitos de menção de autoria, sujeitos às exceções aplicáveis. **Ausência de comprovante não equivale automaticamente a infração demonstrada.**

O critério de conclusão de cada registro é: titular/autor identificado, prova de origem, licença ou autorização específica (site, redes sociais, adaptações e eventuais campanhas), documentação de atribuição e direitos de imagem, aprovação editorial, aplicação e verificação na produção.

## 6. Próximas ações práticas

1. Priorizar as imagens atuais de crianças/vítimas e retratos com titularidade incerta (Boulder, Relisha Rudd, imagens de crimes recentes), sem republicar fotos suspeitas em novas peças.
2. Identificar os arquivos-fonte e autorizações das 38 imagens; para os 11 Garimpos com duplicação, investigar também os **14 arquivos idênticos de Stories**.
3. Tratar as quatro capas de novels como **obra gráfica separada do texto**; procurar a origem da criação e os direitos da edição.
4. Resolver os casos especiais: licença do retrato de Joseph DeAngelo, imagem incorporada de Relisha Rudd, publicação sem capa de Barbara Mackle.
5. Conferir o alcance da autorização do FBI e a aplicação territorial das condições do NIST.
6. Se a origem não puder ser comprovada, selecionar ou produzir alternativa editorial apropriada **antes de modificar o banco**, com backup reversível, testes de SEO, texto alternativo e verificação de Story.
7. Auditoria separada ainda necessária para **21 entradas antigas do manifesto Wikimedia**, imagens internas de artigos, música/áudios, materiais do Instagram e traduções.

**Alterações aplicadas nesta etapa:** documentação e tabela privada de controle; atualização dos créditos NIST; nenhum campo de capa, texto publicado, objeto de Storage, conta ou arquivo de áudio foi substituído ou excluído. O domínio `arquivosombrio.net.br` não pôde ser acessado da rede de verificação (falha de resolução DNS nesse ambiente); por isso não há declaração de homologação HTTP da publicação.
