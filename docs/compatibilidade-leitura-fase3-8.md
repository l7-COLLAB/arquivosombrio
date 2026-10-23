# Fase 3.8 — Compatibilidade e regressões

Data: 22/10/2026.
Commit validado: `64296d5439f6d7328aa7d40eb3e818ec2e065870`.

## Execução confirmada
Seis verificações concluídas com `success`:
- Regressão documental: https://github.com/l7-COLLAB/arquivosombrio/actions/runs/39887430873
- Controles móveis, Admin V2, marcador, leituras relacionadas e sitemap/SEO.

Na regressão documental, os passos de sintaxe JavaScript, testes de documentação, instalação Chromium, homologação com dados fictícios e capturas foram concluídos com sucesso.

## Escopo coberto
Cenários automatizados do navegador incluem cronologia, busca, filtros, navegação e controles nos temas escuro e papel antigo. A ausência de falhas nessa execução não comprova que todos os dispositivos, navegadores, dossiês reais e modos de paginação funcionem perfeitamente.

## Pendências para homologação
- Inspeção visual manual em celular, computador e Lite antigo.
- Confrontar modo livro e scroll com cronologias reais extensas, fontes longas e diferentes dimensões.
- Validar conteúdo paginado e leitura por teclado com tecnologia assistiva.
- Aprovação explícita após PR #75 antes de mesclar/publicar PR #79.

Este documento gera um novo commit e não substitui os checks do novo HEAD.
