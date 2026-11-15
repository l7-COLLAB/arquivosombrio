# Macroetapa 6.13 — sites internacionais, SEO e lançamento controlado

## Entrega concluída no GitHub (PR #86)
- Criadas páginas estáticas independentes de prévia: `/preview-internacional/en/`, `/preview-internacional/es/`, `/preview-internacional/fr/`.
- Cada página possui `lang` correto, título e descrição próprios **no HTML servido**, metadados OG iniciais, navegação entre as quatro prévias, link para o site brasileiro, salto ao conteúdo e 6 categorias informativas não clicáveis.
- Estilo compartilhado responsivo com contraste, foco visível, grade adaptativa e respeito a `prefers-reduced-motion`.
- Prévia inteira contém `noindex,nofollow,noarchive`. Não há `canonical`, `hreflang` de alternates nem sitemap internacional porque não existem páginas equivalentes publicadas.
- `i18n/international-release.json` traz flags negativas, caminhos previstos e critérios de lançamento.
- Testes estáticos em `scripts/test-internacional-lancamento.mjs` verificam os idiomas e conteúdos em comparação com JSON, metadados e não-publicação.

## Importante: status REAL do projeto
**Isto não significa lançamento em produção.** As rotas `/en/`, `/es/` e `/fr/` continuam não implementadas. Nenhum dossiê foi traduzido integralmente, revisado e publicado. As páginas criadas são apenas prévias no PR.

A macroetapa 6.12 também segue dependente de testes reais do PostgreSQL com tokens anon, usuário comum e administrador. O código de gravação existe, mas o flag interno `enabled=false` mantém o salvamento bloqueado.

## Sequência necessária para publicar com segurança
1. Disponibilizar banco de desenvolvimento sem custo não aprovado e validar esquema/RPC, RLS, sessões e concorrência.
2. Revisar por falantes proficientes a tradução de cada idioma e a precisão editorial; selecionar conteúdo real completo para o piloto.
3. Criar rotas reais por idioma, páginas de categoria, páginas dos casos e tratar 404, URL e navegação.
4. Garantir HTML estático ou renderizado no servidor com SEO local, dados estruturados e canonicals próprios.
5. Gerar `hreflang` recíproco somente para versões existentes e equivalentes, nunca para previews nem páginas vazias.
6. Verificar mobile, desktop, links e acessibilidade em navegadores reais; executar testes Node com `node --test scripts/test-internacional-lancamento.mjs`.
7. Remover `noindex` apenas de rotas aprovadas e adicionar sitemap após autorização de produção.

## Gate de fechamento
Planejamento das macroetapas 6.12 e 6.13 **consolidado em código**, porém **não aprovado para implantação**. Não declarar a internacionalização publicada até testes, traduções, revisão e deploy comprovados.
