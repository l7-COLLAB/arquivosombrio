# Fase 5.23 — Homologação visual da cronologia

Data: 23/10/2026. PR #79 permanece em rascunho, dependente do PR #75.

## Cobertura automatizada
O teste de navegador foi ampliado para telas de **320, 375, 768 e 1280 pixels**. Nos quatro tamanhos, executa ações de pesquisa, filtragem, navegação temporal e acessibilidade por foco. Para os modos de leitura **arquivo** e **papel** verifica contraste básico de componentes por presença de fundo e borda e ausência de rolagem horizontal, produzindo capturas `artifacts/documental/cronologia-<largura>-<tema>.png`.

Nota: presença de cor de fundo/borda **não substitui** medição formal de contraste WCAG. Os dados utilizados pelo teste são fictícios e não representam dossiês reais. A análise do arquivo de captura por uma pessoa segue pendente. O teste não equivale à aprovação visual de toda a experiência em navegadores reais e telefones físicos.

## Critérios para homologação manual
- Inspecionar todas as capturas: títulos, largura dos controles, tipografia, espaçamentos, foco visível, filtros e estado vazio.
- Testar aparelho físico em modo livro/scroll, temas escuro e papel e sistema de leitor de tela.
- Conferir no Admin V2 o comportamento da cronologia com dados completos e dados faltantes.
- Manter bloqueio editorial até revisão documental e autorização explícita.

## Estado
- CI do commit anterior: seis fluxos aprovados.
- CI da ampliação visual: verificar na execução do novo HEAD.
- Nenhuma alteração no Supabase ou produção.
