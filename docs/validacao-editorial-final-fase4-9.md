# Fase 4.9 — Consolidação editorial dos pacotes

Data: 22/10/2026.

## Versão validada
- PR #79 (rascunho), base `feat/padronizacao-documental-etapa1`.
- Commit `71572f9ad08f7c631e8e58f351577da61e5c6ce6`.
- Seis workflows concluídos com sucesso, inclusive regressão documental: https://github.com/l7-COLLAB/arquivosombrio/actions/runs/39891271235.

## Conteúdo
- Dyatlov, ID inicial 101: cinco eventos preparados com separação entre os fatos históricos e hipóteses científicas.
- Somerton, ID inicial 103: cinco eventos preparados, distinguindo o anúncio de identificação genética da confirmação oficial.
- Os itens estão em `docs/pacote-integracao-dyatlov-somerton-fase4-5.json`; a fonte editorial de revisão está em `docs/propostas-cronologia-dyatlov-somerton-fase4-3.json`.
- Os arquivos preservam explicitamente o estado de rascunho.

## Bloqueios antes de integrar aos dossiês
1. Confirmar integridade e atualidade dos links citados e correspondência de cada afirmação com a fonte.
2. Verificar o estado oficial mais recente do caso Somerton junto ao legista/polícia; notícia de julho de 2026 não prova o estado atual.
3. Confrontar com os dados efetivamente existentes no banco antes de introduzir blocos, para evitar duplicações.
4. Fazer homologação manual, respeitando dependência da PR #75.
5. Exigir autorização expressa antes de merge, deploy ou publicação de conteúdo.

A criação deste documento gera novo commit e exige nova conferência do HEAD antes de integração. Nenhum dado de produção alterado.
