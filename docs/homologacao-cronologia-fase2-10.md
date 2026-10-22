# Fase 2.10 — Homologação da cronologia interativa

Atualizado em 22/10/2026. Ramificação: `feat/cronologia-interativa-fase2`. PR #79, baseada na proposta documental #75.

## Resultado automatizado confirmado

- Commit analisado: `136f8860ea19abbde371b6742d38dd50f851acbe`.
- Execução: https://github.com/l7-COLLAB/arquivosombrio/actions/runs/39867480695
- Teste integrado Chromium: **success**.
- Demais verificações no mesmo commit: marcador de leitura, controles móveis, leituras relacionadas, sitemap/SEO e regressão documental: **success**.
- PR #79: aberta e em rascunho; integração possível na consulta. **Não publicada**.
- As verificações automáticas usam dados fictícios e **não substituem inspeção visual de dossiês reais, modo livro ou iOS antigo**.

## Roteiro de homologação manual

Executar em uma prévia isolada desta ramificação, nunca presumir que o site público incorpora as alterações.

| ID | Verificação | Critério | Estado |
| --- | --- | --- | --- |
| C01 | Abrir caso com cronologia antiga em texto | Todos os eventos e datas preservados | Pendente |
| C02 | Abrir caso com cronologia estruturada | Ordem e descrição dos acontecimentos fiéis aos dados | Pendente |
| C03 | Atalhos por ano | Ao clicar, ir ao primeiro evento visível daquele ano | Pendente |
| C04 | Pesquisa por nome/local | Resultados corretos, acentos indiferentes | Pendente |
| C05 | Filtrar categorias | Apenas eventos correspondentes e não classificados permanecem | Pendente |
| C06 | Combinar busca + categoria | Contador, lista e atalhos sincronizados | Pendente |
| C07 | Nenhum resultado | Mensagem visível e botão de limpeza funcional | Pendente |
| C08 | Detalhes do acontecimento | Abrem/fecham; texto principal não desaparece | Pendente |
| C09 | Fontes documentais | Referências legíveis; links válidos e seguros | Pendente |
| C10 | Visual mobile 375/768 px | Sem textos cortados, sobreposição ou rolagem lateral | Pendente |
| C11 | Desktop 1280 px | Cronologia legível, foco de teclado perceptível | Pendente |
| C12 | Tema escuro / papel antigo e modo livro / scroll | Contraste, tipografia e paginação adequados | Pendente |
| C13 | iOS antigo / modo Lite | Verificar dispositivo ou simulador compatível | Pendente |
| C14 | Nenhuma alteração destrutiva | Comparar registros originais no banco; sem edição involuntária | Pendente |

## Evidências a registrar

Para cada problema, anotar caso, URL de prévia, dispositivo/navegador, largura de tela, ações realizadas, comportamento esperado/observado e captura. Não incluir segredos ou dados de acesso.

## Critério de liberação

Somente integrar após aprovação explícita, conclusão da homologação manual, revisão de compatibilidade com a PR #75 e inspeção do resultado final. Nunca fazer merge somente pelos resultados do CI.
