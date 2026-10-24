# Fase 5.12 — Validação dos 38 acontecimentos pendentes

Data: 23/10/2026. Origem: relatório congelado da Fase 5.9, com exclusão dos 37 candidatos mês/ano identificados na Fase 5.10.

## Resultado da classificação revisada
- 14 intervalos ou múltiplas datas (incluindo “Fevereiro e março de 2016”).
- 10 períodos aproximados.
- 4 mês/ano escritos com barra.
- 4 datas com horário.
- 2 strings com múltiplos acontecimentos.
- 2 referências auxiliares, não eventos cronológicos.
- 2 marcadores editoriais sem data.
- Total: 38.

O classificador registra apenas o formato e não converte automaticamente qualquer um desses 38 itens. Referências e marcadores sem data não devem receber datas inventadas. Períodos e intervalos preservam sua imprecisão original.

## Testes
Seis workflows do commit `cb9539faa5e11e1cd8da9761a2dff4a2bb903673` concluíram com sucesso, incluindo a regressão documental: https://github.com/l7-COLLAB/arquivosombrio/actions/runs/40003875754.
Um teste adicional para intervalo de meses foi criado na presente fase; sua aprovação exige novo resultado do CI.

## Próxima etapa
Preparar prévias não destrutivas específicas por tipo, com verificação humana e cotejo documental antes de qualquer publicação. Nenhuma operação de escrita no Supabase realizada.
