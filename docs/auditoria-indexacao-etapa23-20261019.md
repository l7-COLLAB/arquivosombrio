# Etapa 23 — cobertura pública e indexação: situação verificável

Data: 19/10/2026.

## O que pode ser confirmado sem Search Console

A auditoria de rastreabilidade consulta o sitemap **publicado** em `https://arquivosombrio.net.br/sitemap.xml` e seleciona até dois arquivos HTML por editoria: o menor e o maior ID. Para cada URL verifica resposta HTTP, ausência de redirecionamento inesperado, título, canonical exclusivo, `og:url` correspondente e ausência de diretiva `noindex`. O relatório fica disponível nos artefatos do GitHub Actions por 30 dias. A rotina roda diariamente e pode ser executada manualmente.

Os testes cobrem erros de canonicalização, duplicatas no sitemap e falhas de rede. Não há nenhuma consulta à API privada do Google e nenhum registro do Supabase é modificado.

## O que exige autenticação no Google

Somente o Google Search Console é fonte apropriada para saber quais URLs estão **Descobertas, atualmente não indexadas**, **Rastreadas, atualmente não indexadas**, **Indexadas** ou **Duplicadas, o Google escolheu outra canônica**. A inspeção individual da URL mostra a canonical declarada pelo site e a selecionada pelo Google, rastreamento, acesso e cobertura.

A conexão da propriedade `arquivosombrio.net.br` ainda não foi autorizada aqui. Não inferir quantidades indexadas a partir do sitemap, da existência da página ou de buscas com `site:`.

## Passos de verificação no Search Console

1. Abrir a propriedade de domínio `arquivosombrio.net.br`.
2. Em **Indexação → Páginas**, registrar totais de páginas indexadas e não indexadas e seus motivos.
3. Em **Sitemaps**, enviar ou confirmar `https://arquivosombrio.net.br/sitemap.xml`.
4. Usar **Inspeção de URL** em cinco exemplos de cada editoria e comparar canonical declarada vs. selecionada pelo Google.
5. Priorizar correções por motivo e verificar novamente após o reprocessamento.

Esta etapa **não afirma** que o Google indexou qualquer quantidade de URLs. Não modifica conteúdo, novels ou Admin V2.
