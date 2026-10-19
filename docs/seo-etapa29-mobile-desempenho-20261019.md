# Etapa 29 — auditoria de preparo móvel, SEO e peso do HTML

A ferramenta `scripts/audit-mobile-seo-readiness.py` realiza uma revisão estática das sete páginas principais e de todos os artigos canônicos de `/arquivo/`, diretamente no artefato pré-renderizado do GitHub Pages.

## Verificações que bloqueiam o deploy

- URL canônica única e compatível com a página/sitemap (inclusive a raiz do site)
- Meta viewport configurada para largura do dispositivo
- Título HTML presente
- Página listada no sitemap
- Existência das páginas canônicas no artefato

## Alertas de acompanhamento

- Imagens sem atributo `alt`
- Ausência de H1 e landmark `main`
- Ausência de idioma `pt`
- HTML acima de 250 kB

Esses alertas constam do relatório JSON, mas não impedem automaticamente o deploy: alguns templates carregam partes da interface dinamicamente e precisam de avaliação específica.

## Métricas realmente medidas e limites

O tamanho em bytes do HTML estático e a quantidade de scripts/estilos/imagens **são contados no artefato**. Não há execução de navegador, emulação móvel, Lighthouse, PageSpeed Insights, análise de acessibilidade computada ou medição de LCP/INP/CLS; não se deve apresentar estas verificações como pontuação de desempenho real.

A auditoria roda na validação da PR e antes do upload do site no deploy. O relatório pode ser reproduzido com `python3 scripts/audit-mobile-seo-readiness.py _site --report /tmp/mobile-seo-report.json`. Não altera conteúdo editorial, novelas, banco ou Admin V2.

## Próximo acompanhamento

Usar PageSpeed Insights ou Chrome DevTools em uma amostra de páginas, em conexões móveis e desktop, para obter Core Web Vitals reais. Investigar alertas de peso HTML, imagens e scripts apenas após confirmação.
