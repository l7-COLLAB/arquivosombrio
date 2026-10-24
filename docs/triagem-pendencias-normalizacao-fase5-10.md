# Fase 5.10 — Triagem dos 75 acontecimentos pendentes

Dados de origem: `docs/relatorio-normalizacao-acervo-fase5-9.json` (somente leitura do Supabase na fase anterior).

- Pendentes no começo da etapa: 75.
- Desses, **37** possuem prefixo inequívoco `mês de ano:` e passam a ser candidatos à separação sintática após a mudança no normalizador.
- Restam **38** itens fora desse novo padrão. Não significam falta de data: existem períodos, datas com qualificadores, intervalos, cabeçalhos sem data, referências independentes e múltiplos eventos em uma string.
- A cobertura estimada pelo relatório estático, considerando exclusivamente esse novo padrão, cresce de 247 para **284** candidatos de 322 textos. Essa é uma projeção baseada nos dados congelados do relatório, não uma execução nova da base.
- Nenhum item foi convertido ou escrito no Supabase. Sem dedução automática de fontes, tipos editoriais ou datas aproximadas.
- Próxima etapa: distinguir strings com múltiplos acontecimentos, fontes auxiliares e intervalos antes de definir tratamentos manuais.

Validação: testes de normalização atualizados; checar o CI no HEAD antes de considerar a alteração aprovada.
