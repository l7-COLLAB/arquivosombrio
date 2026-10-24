# Fase 4.10 — Encerramento da preparação editorial

Data: 22/10/2026.

## Escopo congelado para revisão
- Dossiê inicial 101, **O Incidente do Passo Dyatlov**: 5 eventos de cronologia e correção de abertura da narrativa.
- Dossiê inicial 103, **O Homem de Somerton**: 5 eventos e complementação de contexto genético.
- Fonte editorial: `docs/propostas-cronologia-dyatlov-somerton-fase4-3.json`.
- Pacote técnico: `docs/pacote-integracao-dyatlov-somerton-fase4-5.json`.
- Ambos permanecem rascunhos, não importados para o acervo real.

## Regras de integração, quando autorizada
1. Ler a versão vigente do dossiê no banco e registrar versão/identificador antes de qualquer mutação.
2. Verificar se uma cronologia equivalente já existe. Não duplicar blocos nem substituir narrativa ou evidências existentes.
3. Aplicar correções narrativas somente após cotejo com o texto vigente; não sobrescrever descrições mais completas.
4. Vincular, a cada evento, a referência documental, a natureza e a distinção entre fatos, hipóteses e anúncio de pesquisadores.
5. Para Somerton, confirmar a situação oficial de identificação em fonte atual antes de redação conclusiva.
6. Visualizar ambos os dossiês em modo livro/scroll, escuro/papel antigo, desktop/celular.
7. Reexecutar testes automatizados na revisão final e conferir os resultados.
8. Solicitar autorização explícita antes de merge/deploy/publicação; manter a dependência #79 → #75.

## Situação dos checks na consulta
- Commit consultado: `8f78208e35a9bdbc0b3f79117663f300b84f34f6`.
- Cinco workflows concluídos com sucesso (Admin V2, marcador, leituras relacionadas, sitemap/SEO, controles móveis).
- Regressão documental em andamento (https://github.com/l7-COLLAB/arquivosombrio/actions/runs/39891441688).
- PR #75 aberta/rascunho, base `main`; PR #79 aberta/rascunho, base `feat/padronizacao-documental-etapa1`.

## Decisão
Preparação de pacotes encerrada para a presente rodada. **Não equivale a homologação histórica, integração ou publicação.** Nenhuma alteração no Supabase ou no site em produção foi feita.
