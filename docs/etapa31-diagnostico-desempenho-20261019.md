# Etapa 31 — diagnóstico de desempenho a partir de medições

Dependência: workflow Lighthouse da Etapa 30 (#71). Esta PR tem como base a ramificação da Etapa 30, **não a main**, para evitar execução de código ausente.

O utilitário `scripts/diagnose-lighthouse.py` classifica relatórios JSON Lighthouse em resultados observados e prioridades para investigação. Aplica limites de laboratório para LCP (2,5 s / 4 s), CLS (0,1 / 0,25), TBT (200 / 600 ms) e FCP (1,8 s / 3 s). Uma métrica acima do valor intermediário merece atenção; acima do limite superior é ruim. As recomendações são hipóteses de investigação, não diagnósticos causais.

A auditoria **falha** se não houver um relatório válido de todas as cinco páginas. Não produz notas por adivinhação, não faz alterações de HTML, não modifica dados, leitores, novels nem Admin V2. Os testes automatizados cobrem relatório ausente, corrompido e métricas numéricas.

Para ter resultados: integrar a Etapa 30, executar o workflow no Actions, obter o artefato, aplicar o diagnóstico e inspecionar as evidências antes de fazer qualquer otimização. Não confundir medições Lighthouse com dados de campo de usuários.
