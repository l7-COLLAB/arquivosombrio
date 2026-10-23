# Fase 5.4 — Prévia conservadora do acervo real

Data: 22/10/2026. Consulta ao Supabase exclusivamente com SELECT.

## Triagem preliminar de 327 acontecimentos
- 5 objetos já estruturados (Caso Isabella Nardoni).
- 322 itens em texto.
- 68 textos candidatos a extração de data por padrões restritos (ano isolado como prefixo, ou data por extenso como prefixo, seguidos de separador).
- 254 itens restantes (322 menos 68), exigem revisão dos formatos. NÃO afirmar que não têm data: há datas embutidas em outras posições e formulações como intervalos.
- A contagem usa expressões SQL aproximadas; a elegibilidade efetiva depende da passagem pelo normalizador JavaScript e da revisão manual. Não confundir seleção sintática com comprovação de um fato.

## Testes
- Regressão da fase 5.3 falhou por '\\n' literais inseridos no fim de `tests/dossier-editorial-integration-package.mjs`.
- Corrigido em `33fcb65f87adf17ca8b28d0f2c4d079dc0c0441b`; o workflow ainda executava no momento desta anotação.
- Nenhum evento foi convertido no banco.

## Próximas salvaguardas
1. Extrair uma amostra preservando o texto original, sem criar fontes/naturezas.
2. Revisão por dossiê e conferência das datas ambíguas.
3. Testar a prévia sem escrita na base.
4. Revalidar HEAD e solicitar autorização antes de publicação.
