# Etapa 30 — medições Lighthouse das páginas públicas

Workflow: `.github/workflows/lighthouse-public.yml`.

Executa semanalmente e sob demanda, sem alterar produção. Mede cinco páginas públicas com Lighthouse em Chrome, utilizando emulação móvel. O relatório JSON preserva os valores brutos de desempenho, acessibilidade e SEO, FCP, LCP, Speed Index, TBT e CLS. INP pode estar ausente no teste de laboratório e não deve ser interpretado como zero.

O artefato `etapa30-lighthouse-mobile` é guardado por 30 dias. Uma falha de carregamento ou execução deve ser investigada, não substituída por nota estimada. Não há mudança de banco, conteúdo, leitores, novelas ou Admin V2.

**Limitações:** métricas sintéticas não representam dados reais do público (CrUX) e o teste não cobre automaticamente um dossiê individual, imagens dos artigos nem redes 3G reais. Antes de otimizar scripts, medir uma amostra representativa dos artigos; validar impacto em produção após qualquer mudança. O workflow não é gate do deploy e não promete melhoria de pontuação por si só.
