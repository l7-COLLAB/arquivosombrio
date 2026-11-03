> **Atualização posterior — 03/11/2026:** a etapa de publicação foi concluída após este diagnóstico inicial. As 21 capas externas foram efetivamente substituídas no Supabase por ilustrações originais (5 Dossiês, 14 Garimpos, 2 Perícias), com 21 backups em `private.cover_replacement_audit_20261103`, gatilhos de narração preservados e legendas atualizadas. Consulte [Registro de publicação e reversão](REGISTRO_PUBLICACAO_21_CAPAS_20261103.md). As seções históricas abaixo descrevem o estado **antes da substituição**. Restam 44 capas sem comprovação documental adequada.

# Arquivo Sombrio — triagem de 21 capas externas e rastreio de 38 uploads

**Data de corte:** 03/11/2026. **Escopo:** as 59 capas de duas classes do inventário de 65 pendências de direitos autorais. **Resultado:** pesquisa documental, 21 alternativas originais e 38 objetos rastreados; não houve autorização obtida de titular, substituição de fotos publicadas nem remoção de dados.

## 1. Imagens vinculadas diretamente a sites de terceiros — 21 registros

As 21 capas foram vinculadas por ID à página publicadora e ao endereço da fotografia. A revisão do inventário `docs/triagem-21-capas-terceiros-20261103.csv` atribuiu:
- **9 prioridades críticas de documentação** (5 usos de imagens do CDN da CBS News, 2 da Netflix, 1 da ZEISS e 1 da RTVC).
- **12 prioridades altas** (ABC News, Discovery/A+E, MissingKids, outros sites independentes, CDNs sem autoria identificada). Isso não significa 9 violações comprovadas; são riscos documentais que merecem resposta primeiro.
- A mesma fotografia do domínio CBS News aparece em **duas publicações**: Garimpo `casos_diarios.id=34` (Amy Allwine) e Perícia `pericias.id=14`. Direitos de uma obra precisam ser documentados para ambas as utilizações.
- Um teste de comparação com os registros atuais no Supabase localizou os **21 casos em produção**: 16 URL strings eram idênticas ao inventário e 5 continham parâmetros adicionais de consulta. Os **21 caminhos base permaneceram coincidentes**. Não remover parâmetros de URL na alteração real sem validar funcionamento da imagem original.

### Evidências jurídicas públicas consultadas

1. [CBSNews.com Terms of Service](https://www.cbsnews.com/news/cbsnewscom-terms-of-service/) indica restrições à reprodução e publicação de suas imagens em outros sites sem consentimento escrito. O aviso geral da plataforma não identifica necessariamente o titular de cada fotografia.
2. [Netflix Media Center](https://media.netflix.com/en/apply) controla acesso a fotos e materiais de imprensa com análise de inscrição. A aprovação de credenciais, quando obtida, não deve ser presumida como licença irrestrita de uso por qualquer site.
3. [ZEISS — aviso legal](https://www.zeiss.com/microscopy/en/legal-information/legal-notice.html) exige autorização escrita prévia para a reprodução de imagens do site. A política específica de [fotos de imprensa da ZEISS](https://www.zeiss.com/corporate/en/about-zeiss/present/newsroom/press-photos.html) tem condições limitadas para uso editorial; não foi comprovado que a imagem usada em Perícia `id=3` faça parte desse pacote.
4. [RTVC — termos de uso](https://rtvc.gov.co/terminos-y-condiciones) informa proteção de materiais sob direitos autorais. A origem institucional não é, sozinha, prova de licença aberta.
5. [Creative Commons — atribuição TASL](https://creativecommons.org/reusing-cc-licensed-content/): se uma alternativa com licença CC for usada, manter título, autor, fonte, licença, e observações sobre alterações conforme exigidas.
6. Outras fontes identificadas (ABC News, A+E, NCMEC, Squarespace CDN e sites independentes) requerem investigação da autoria da foto, não somente da empresa hospedeira. A presença de uma URL publicamente acessível ou o uso de hotlink não cria licença.

### Alternativas prontas, mas **não publicadas**
- Foram criadas **21 ilustrações vetoriais autocontidas**, em `assets/capas-alternativas-direitos/`, usando formas geométricas e tipografia editorial; sem retratos, imagens externas, marcas, fotos ou figuras de pessoas.
- Resolução vetorial 900×1200, com títulos acessíveis e advertência de que o material é **ilustração, não fotografia ou evidência**.
- O mapeamento caso → capa original → proposta SVG está em `data/capas-alternativas-direitos-20261103.json`.
- [Prévia editorial](../previews/capas-alternativas-direitos-20261103.html) é intencionalmente `noindex`. É um controle de revisão visual, **não um sistema de aprovação**.
- O usuário não perdeu a imagem real: todas as 21 capas publicadas permanecem no banco, até que um responsável editorial confirme o substituto ou obtenha licença. **Uma capa ilustrativa não deve ser apresentada como fotografia ou prova do caso.**

Se a prioridade editorial é preservar fotos reais, podem ser pesquisadas obras abertas caso a caso. Ex.: [Vallejo — fotografia de contexto sob CC BY-SA 4.0](https://commons.wikimedia.org/wiki/File:Sign_-_Historic_US_Route_40_in_Vallejo,_California.jpg), [Erie — fotografia de contexto sob CC BY-SA 2.0](https://commons.wikimedia.org/wiki/File:Erie,_Pennsylvania_(8481051797).jpg). Esses exemplos não representam vítimas nem cenas de crime, e **não foram publicados**.

## 2. Uploads Supabase — rastreio de 38 objetos

Foi consultado o catálogo de `storage.objects` **somente em leitura**, cruzado com os links exatos do inventário original. **38/38 objetos foram encontrados** em dois buckets: `imagens` (**34**) e `novel-capas` (**4**).

- Todos possuem campo de responsável de upload no Storage, distribuídos entre **2 identificadores de autenticação**; foram substituídos por aliases `envio_1` e `envio_2` no inventário, sem divulgar IDs pessoais ou e-mails.
- Em **0/38** objetos foram encontrados metadados personalizados `user_metadata` que registrem proveniência. Foram localizados datas de envio/alteração, caminho de Storage, MIME e tamanho.
- O documento `docs/rastreio-storage-capas-20261103.csv` registra por ID de publicação esses dados técnicos, sem falsamente marcar objetos como licenciados.
- Os 38 abrangem Dossiês (**9**), Garimpo (**23**), Creepypastas (**1**), Novels (**4**) e Perícia (**1**).
- Nomes de arquivos como `img_...jpeg`, `image.jpg`, nomes de pessoas ou `chatgpt-image-...` **não demonstram autoria**. Uma origem possivelmente gerada por IA exige confirmação do material de criação, do conteúdo de referência e da licença para dados incorporados.
- As páginas editoriais e registros relacionados não possuem campo sistemático de titular/licença por capa no modelo examinado. Créditos de pesquisa e URLs de fontes do caso não substituem evidência da licença da imagem. A titularidade das 38 permanece <b>não demonstrada</b>.

## 3. Remediação das 65 pendências — estado após esta etapa

| Grupo | Registros | Resultado |
|---|---:|---|
| Links diretos de sites de terceiros | 21 | Mapeamento e **21 SVGs originais** preparados; licença das fotos antigas ainda não comprovada |
| Uploads Supabase | 38 | Todos presentes; 2 responsáveis de upload, nenhum metadado de fonte/licença localizado |
| Fontes institucionais | 3 | Ainda requerem exame de termos da instituição |
| Arquivos local/incorporado | 2 | Origem e direitos ainda pendentes |
| Publicação sem capa no campo principal | 1 | Barbara Mackle — verificação visual pendente |
| **Total** | **65** | **Controle documental ampliado, sem declarar regularização jurídica** |

## 4. Critérios de publicação das alternativas e próximos passos

1. Conferir a galeria em desktop/celular, legibilidade dos textos, representação responsável de casos reais e uso correto de `alt`. Aprovar cada capa de modo rastreável.
2. Escolher por caso: obter autorização comprovável que cubra publicação comercial/editorial, datas, canais e adaptações, **ou** substituir pela ilustração original já preparada. Guardar documentação de titular, licença, autorização, condições e crédito.
3. Antes de alterar o banco: capturar um backup dos 21 campos de capa, conferir que a URL atual coincide com a baseline normalizada (desconsiderando apenas os parâmetros de consulta quando apropriado) e executar uma mudança atômica, idempotente e reversível; verificar links públicos e metadados de compartilhamento após a atualização.
4. Investigar os 38 uploads individualmente com o histórico da criação, recibos/consentimentos ou fonte original; não assumir que o usuário que fez o upload detém o copyright.
5. Para novos conteúdos, exigir o preenchimento de titular, fonte, licença e revisão editorial no fluxo administrativo — sem prejudicar agendamentos ou campanhas existentes. Este portão de backend **não foi implementado nesta etapa**.
6. Dar continuidade às 6 pendências remanescentes fora do lote (3 institucionais, 2 locais e 1 capa ausente).

**Limites:** não houve alteração na tabela `Casos`, `casos_diarios`, `pericias`, Storage ou demais publicações. Este relatório não constitui parecer jurídico nem certificação de licenciamento. A existência da alternativa não remove o risco do uso da foto antiga enquanto ela permanecer publicada.
