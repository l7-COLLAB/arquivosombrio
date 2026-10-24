# Fase 5.28 — Fechamento técnico da auditoria de acessibilidade

Data: 23/10/2026; PR #79 em rascunho, dependente do PR #75.

## Resultados reais do CI
Commit `01b16d8cf1b8368e38c35c7742bc7cc9261916f3`: cinco fluxos aprovados, regressão documental falhou em `tests/dossier-browser-smoke.mjs:132`, ao medir contraste.
Análise do código identificou erro no próprio teste: a expressão regular para componentes RGB foi escrita com barra invertida extra (`/[\\d.]+/g`), produzindo valores inválidos no cálculo.
O cálculo foi corrigido no commit `dee3f6bb1a108a8acf838d91e1b449d3597ab46e`. Não foi alterado o CSS, pois as cores esperadas já eram confirmadas no navegador.

## Escopo dos testes automatizados
- Rótulos de inputs/selects e nomes dos botões no componente de cronologia.
- Relação de contraste mínima de 4,5:1 no campo de pesquisa do tema Papel.
- Foco visível e navegação temporal; filtros e estados vazios.
- Telas de 320, 375, 768 e 1280px e capturas dos temas Arquivo/Papel.

## Pendências de homologação
- Confirmar execução final do GitHub Actions com a correção da regex.
- Analisar contraste de todos os elementos, não apenas campo de pesquisa.
- Testar leitor de tela, teclado, modos livro e scroll e aparelhos físicos.
- Validar fontes e identidade dos registros, rollback e autorização explícita.

**Status:** homologação técnica parcial; homologação total NÃO aprovada. Nenhuma gravação no Supabase, merge ou deploy.
