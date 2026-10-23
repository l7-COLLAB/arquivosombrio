# Fase 4.7 — Validação dos pacotes Dyatlov e Somerton

Data: 22/10/2026.

## Resultado comprovado
Commit validado: `674f7ff43d0add9fe07f8316d56c996a7306d8d7`.
Regressão documental: https://github.com/l7-COLLAB/arquivosombrio/actions/runs/39890032825 — sucesso.
Outros cinco workflows no mesmo commit concluíram com sucesso: Admin V2, sitemap/SEO, marcador de leitura, leituras relacionadas e controles móveis.

## Pacotes validados
- Dyatlov (ID inicial 101): cinco acontecimentos estruturados.
- Homem de Somerton (ID inicial 103): cinco acontecimentos estruturados.
- O teste `tests/dossier-editorial-integration-package.mjs` compila os blocos com o compilador público do Admin V2, assegura que narrativa e evidências originais não sejam mutadas e exige metadados básicos e URLs HTTPS.

## Limites e bloqueios editoriais
- Não confirma por si só a confiabilidade ou acessibilidade atual dos links externos.
- Necessária conferência editorial dos fatos e das versões atuais no Supabase.
- Correções narrativas estão propostas em arquivo, não foram incorporadas aos dossiês reais.
- Homologação manual da PR #79 continua pendente e há dependência da PR #75.
- Este documento gera novo commit, exigindo nova checagem de CI no HEAD final antes de mesclar.

**Decisão:** pacote tecnicamente apto à revisão editorial, não autorizado para publicação.
