# Internacionalização — Fase 6.3: padronização de rotas e idiomas

**Estado:** implementação técnica em branch de desenvolvimento; sem publicação das versões internacionais.

## Implementado
- Cadastro estruturado em `i18n/config-internacional.json`: locale BCP 47, nome nativo, região, URL de prévia, futura URL e estado de aprovação.
- Seletor de idioma da prévia passa a consumir o cadastro, sem codificar a lista de versões em opções HTML.
- Troca de idioma atualiza idioma da página, aviso, link de retorno e URL; navegação anterior/próxima do navegador é respeitada.
- Caso uma introdução localizada esteja ausente ou inválida, a interface exibe mensagem de erro localizada em vez de misturar conteúdo em português.
- `noindex` permanece na prévia; nenhuma URL internacional proposta é disponibilizada como página definitiva.

## Arquitetura proposta
- `/` = pt-BR (site atual).
- `/en/` = en-US, `/es/` = es-ES, `/fr/` = fr-FR: **não criados**, dependendo de aprovação.
- Um único domínio, conteúdo editorial independente por idioma.
- URLs devem ser permanentes e rastreáveis; não redirecionar automaticamente por IP ou idioma do navegador.
- Usar `hreflang` bidirecional somente entre páginas efetivas e semanticamente equivalentes. Não ligar artigos inexistentes a páginas genéricas.
- Rotas internacionais não devem reutilizar metadados pt-BR.

## Revisão editorial pendente
- Conferir idiomas e regiões contra o plano inicial, que ainda não foi recuperado.
- Revisar terminologia: distinção de `true crime`, ficção de horror, lendas e ciência forense.
- Separar fatos verificados, hipóteses, controvérsias e relatos ao localizar conteúdos.
- Avaliar adequação jurídica e direitos de imagens antes de difusão em países específicos.

## QA mínimo em ambiente de prévia
1. Conferir carga de ambas as fontes JSON por HTTP e sem erro de console.
2. Conferir quatro opções; trocar idioma e navegar com Voltar/Avançar do navegador.
3. Testar `?lang=xx` (fallback pt-BR); testar falta de locale no JSON (erro localizado).
4. Validar marcação `html[lang]`, títulos, contraste, teclado, responsividade e `noindex`.

## Próxima candidata: 6.4
Preparar tradução e revisão de menus, categorias, metadados e layout internacional, ainda sem habilitar indexação.
