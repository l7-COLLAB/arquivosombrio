# Consolidação da Fase 2 — Cronologia interativa

Data: 22/10/2026. Proposta: #79 (rascunho). Base: `feat/padronizacao-documental-etapa1` (PR #75). Commit verificado: `8b06e6b8dbf9490b09b248c2d10cb40e197b10a0`.

## Funcionalidades integradas
- Linha do tempo preserva eventos legados em texto e objetos estruturados.
- Detalhes adicionais por evento com expansão sem ocultar a descrição original.
- Atalhos por ano, atualizados após busca e filtro.
- Filtros por categoria editorial de andamento (investigação, perícia etc.).
- Pesquisa sem diferenciação de acentos; estado sem resultados e botão de limpeza.
- Sinalização independente de natureza documental: fato documentado, testemunho, hipótese e controvérsia quando explicitamente cadastrada.
- Metadados opcionais e links de referência por evento.
- Avisos não bloqueantes do compilador Admin V2 para URL inválida, link repetido, fonte incompleta, natureza não reconhecida e fato classificado como documentado sem fonte.

## Resultados técnicos confirmados
No commit acima, seis workflows concluíram com `success`: regressão documental, Admin V2, sitemap/SEO, controles móveis de leitura, marcador de leitura e leituras relacionadas. PR #79 permaneceu aberta, em rascunho, `mergeable=true`, `mergeable_state=clean`.

## Verificações ainda necessárias
- Executar os 14 cenários de `docs/homologacao-cronologia-fase2-10.md` em prévia da ramificação; incluir casos reais, modos livro/scroll, temas e dispositivo Lite.
- Verificar especialmente rótulos de categoria e natureza, fontes com URLs longas, navegação em cronologias com anos repetidos e contraste dos controles.
- Confirmar que a prévia usa o commit mais recente e não dados de teste misturados à produção.
- Documentar falhas com página, dispositivo, passos e captura.

## Critério de liberação
Aprovação explícita da homologação visual/funcional e da dependência PR #75 antes de mesclar #79. Nenhum merge nem alteração em `main` foi autorizado. Dados do Supabase não foram modificados nesta consolidação.
