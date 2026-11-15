# Internacionalização — Fase 6.4: interface e metadados localizados

**Status:** implementada em proposta de código, não integrada à produção.

## Alterações
- `i18n/interface-internacional.json`: textos de interface para pt-BR, en-US, es-ES e fr-FR (rótulos piloto, revisão editorial pendente).
- `preview-internacional/index.html`: tradução de nome das seções, nomes das categorias, aviso de prévia, retorno ao site brasileiro, seletor, mensagem de erro e metadados de título e descrição.
- As categorias são **rótulos não clicáveis**: não levam a arquivos ainda não traduzidos.
- O título do documento e a metadescrição refletem o idioma selecionado, em **prévia apenas**. `robots=noindex,nofollow,noarchive` permanece.
- Troca de idioma por `?lang=` e histórico de navegação mantidos.

## Atenções de SEO e publicação
A metadescrição alterada via JavaScript é somente um teste visual. Páginas publicadas precisam de título, descrição, canonical, `html[lang]` e dados estruturados corretos **no HTML inicial servido para cada rota**. Alterar o DOM por JavaScript não substitui indexação técnica completa. Não introduzir `hreflang` até existirem páginas equivalentes efetivamente disponíveis.

## Critérios editoriais
- Manter `Arquivo Sombrio` como marca em todos os idiomas.
- `Garimpo Sombrio` e `Dossiês` requerem decisão terminológica conforme posicionamento da marca; opções atuais são traduções piloto.
- Diferenciar relatos de casos reais e ficção nas seções.
- Traduções das seis categorias não representam publicação dos acervos correspondentes.
- Validar países/idiomas originais antes de promover esta proposta.

## Verificações técnicas realizadas
- Inspeção no GitHub da presença das três fontes JSON e da página de prévia.
- Validada a estrutura dos arquivos de tradução e paridade das categorias.
- Não foi executado teste visual em navegador nem integração de produção.

## Próxima etapa candidata — Fase 6.5
Definir arquitetura das páginas internacionais reais, contratos de conteúdo por idioma e critérios para tradução integral de dossiês, sem gerar páginas vazias ou conteúdo traduzido automaticamente sem revisão.
