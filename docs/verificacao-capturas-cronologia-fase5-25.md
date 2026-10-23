# Fase 5.25 — Conferência das novas capturas

Data: 23/10/2026. PR #79 em rascunho, sem deploy.
Regressão verificada: https://github.com/l7-COLLAB/arquivosombrio/actions/runs/40039364709 — seis workflows aprovados.

## Evidência visual
Foi baixado o artefato `capturas-dossie-documental` (ID 12538054190), contendo telas 320, 375, 768 e 1280 px nos temas Arquivo e Papel.
A inspeção das capturas confirma a melhoria do texto dos controles da cronologia. Entretanto, a captura de 375px no tema Papel mostra títulos claros de alto contraste **insuficiente** no cabeçalho e nos cartões de evidência sobre fundo bege/cinza.

## Ajuste realizado
Novas regras em `css/caso.css` impõem textos escuros nesses títulos e rótulos, restritas ao modo de leitura Papel. O teste `tests/dossier-browser-smoke.mjs` agora verifica as cores computadas do cabeçalho e do título das evidências, além do campo de pesquisa da cronologia.

## Próximas verificações
- Conferir conclusão do GitHub Actions no novo HEAD.
- Reabrir capturas novas para confirmar contraste em 320, 375, 768 e 1280 px.
- Homologar visualmente em aparelhos reais, com modos livro/scroll, antes de solicitar autorização de publicação.

Não existe aprovação editorial automática e nenhum dado Supabase foi alterado.
