# Fase 3.9 — Consolidação dos modos de leitura

Data: 22/10/2026.

## Dependências
- PR #75: rascunho, aberta, base main, commit 9c17d8fa0e99edfdc2994d7bf51c5b18ce505b2d.
- PR #79: rascunho, aberta, base feat/padronizacao-documental-etapa1, commit consultado 982ee8494dd3830f21c418b9719b6805a897a42e.
- Não foi realizado merge nem deploy.

## Verificações no commit consultado
- Cinco workflows com sucesso: marcador, controles móveis, leituras relacionadas, sitemap/SEO, Admin V2.
- Regressão documental 39887578952 ainda em execução; etapas de sintaxe e documentação aprovadas, instalação do Chromium ainda não concluída na consulta.
- A PR #79 indicava mergeable=true e mergeable_state=unstable enquanto checks estavam em andamento.

## Itens a verificar manualmente
1. Modo scroll e modo livro com cronologias curtas e longas.
2. Tema escuro e tema papel antigo: contraste, foco, botões e separadores.
3. Celular com controles compactos e áreas de toque, sem sobreposição e sem rolagem horizontal.
4. Navegação por ano; avançar/voltar evento; pesquisa, filtragem e reset.
5. Textos compridos, títulos, links documentais e detalhes expansíveis.
6. Compatibilidade Lite em dispositivo ou simulador apropriado.
7. Revisar PR #75 e repetir checks no commit final antes de qualquer merge.

## Critério de conclusão
Os testes automatizados aprovados não equivalem à homologação visual em dispositivos reais. A aprovação de integração exige testes manuais e autorização explícita. A criação deste documento altera o HEAD; executar/verificar CI novamente para a versão candidata.
