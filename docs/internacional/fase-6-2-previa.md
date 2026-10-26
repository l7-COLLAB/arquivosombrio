# Internacionalização — Fase 6.2: integração de prévias

Status: **implementada na branch de desenvolvimento; ainda não publicada em produção**.

## Entrega
- `preview-internacional/index.html`: página isolada com seleção de idioma e layout documental adaptável a celular.
- Leitura em tempo de execução de `i18n/introducoes.json`, sem duplicar as introduções no HTML.
- Seleção de locale via parâmetro `?lang=en-US` (ou `pt-BR`, `es-ES`, `fr-FR`), com retorno seguro para `pt-BR` quando inválido.
- Atualização de `html[lang]`, título do documento e conteúdo apresentado, com `textContent` para evitar injeção de HTML.
- Metatag `noindex, nofollow, noarchive` e aviso claro de que se trata de **prévia**, não de site internacional publicado.
- Link de retorno identificado explicitamente como site em português; não há navegação falsa para dossiês traduzidos.

## Limitações e validações pendentes
- Não se criaram rotas internacionais finais, `canonical` alternativo, `hreflang` ou sitemap multilíngue.
- URLs de prévia não devem ser divulgadas como páginas finais. `noindex` não é controle de acesso: usar ambiente privado se for necessária confidencialidade.
- As traduções são **pilotos** e os países/idiomas devem ser confrontados com o planejamento original antes da ativação.
- Testes manuais em navegadores mobile/desktop e QA editorial ainda pendentes.

## Validação manual após publicar em um ambiente de teste
1. Abrir `/preview-internacional/?lang=en-US`; conferir inglês e `<html lang="en-US">`.
2. Trocar para francês; verificar conteúdo, aviso e URL atualizados sem recarga.
3. Testar `?lang=desconhecido`; verificar fallback pt-BR.
4. Simular erro no JSON; verificar mensagem traduzida, sem página em branco.
5. Testar teclado e leitor de tela e inspecionar `meta[name="robots"]`.

## Próxima etapa candidata — 6.3
Confirmar variantes linguísticas definitivas, revisar textos com critério editorial e decidir estrutura de URLs e navegação internacionais em ambiente de teste.
