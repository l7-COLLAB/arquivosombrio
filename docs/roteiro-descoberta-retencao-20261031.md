# Roteiro de descoberta e retenção — Arquivo Sombrio

Preservar HTML/CSS/JavaScript, Supabase, publicação no GitHub Pages e identidade visual. Cada etapa tem implementação, validação e entrega próprias.

| Etapa | Entrega | Critério de conclusão |
| --- | --- | --- |
| 1 | Listagens HTML na home, Dossiês, Garimpo, Lendas e Creepypastas | Conteúdo e links disponíveis sem JS; contadores corretos; filtros preservados; falhas de rede não apagam o catálogo inicial |
| 2 | Sugestões de casos com confirmação real | Sucesso apenas após resposta do banco; mensagem de falha recuperável; recebimento confirmado na administração |
| 3 | Qualidade das páginas estáticas e compartilhamento | Texto com estrutura documental, referências, imagem OG e canonical coerentes; nenhuma duplicação de URLs |
| 4 | Página de atualizações e RSS | Reutilizar case_updates; diferenciar publicação de revisão; mostrar resumo editorial do que mudou |
| 5 | Índices e acompanhamento | A–Z, país e período com metadados verificados; validar user_watchlist, login e Meu Arquivo antes de criar estruturas adicionais |
| 6 | Newsletter e envio de ficção | Provedor escolhido e integrado; curadoria privada com crédito e autorização do autor; ficção separada dos casos reais |

## Etapa 1 — implementação

- `build-seo-pages.py` usa os mesmos registros públicos para artigos, índice da pesquisa, sitemap e listagens.
- `build-public-listings.py` preenche as grades existentes com as mesmas classes CSS. Dossiês mostra a coleção pública completa; o bloco Garimpo da home mostra seis registros.
- Links iniciais apontam para `/arquivo/`, permitindo abrir o texto sem JavaScript. O enriquecimento remoto mantém a leitura interativa existente.
- Metadados mínimos embutidos, sem corpo de artigos, permitem iniciar filtros de Dossiês e manter listas em caso de erro remoto.
- As páginas geradas usam a coleção publicada do banco como fonte para Dossiês, evitando reintroduzir registros demonstrativos de `data/caso.js` cujos IDs podem colidir com registros atuais.
- Garimpo exclui categorias Perícia e Especial. O conteúdo dessas editorias permanece nos seus artigos e rotas.
- Datas futuras e status diferentes de publicado não entram no conjunto gerado. O horário é comparado com fuso, inclusive Brasília.
- Não há alteração de tabelas, permissões, autenticação ou dados editoriais.

## Validação

Testes de HTML inicial, contadores, separação de editorias, publicação no limite das 20h de Brasília, escape de conteúdo, metadados mínimos e inicialização JavaScript. Executadas também as verificações existentes de sitemap, SEO e links internos.

Build local consultou a API pública real: 101 artigos (22 dossiês, 47 registros da tabela de casos diários, 16 perícias, 8 lendas e 8 creepypastas). A listagem Garimpo exclui Especiais e Perícia dessa tabela. Auditorias de SEO e links sem erros. A análise estática mobile não substitui inspeção visual nem mede Core Web Vitals.

## Limites e acompanhamento

O HTML estático reflete a última publicação bem-sucedida. O workflow existente reconstrói a cada seis horas e a cada push em main; o JavaScript consulta os registros mais recentes. Atrasos ou falhas do build podem deixar o HTML desatualizado até a próxima execução. Não prometer publicação instantânea sem JS.

A etapa 3 deve melhorar a formatação das páginas `/arquivo/`, que atualmente usam o template textual já existente. País não existe como coluna dedicada de Casos; não inferir esse dado automaticamente de local sem revisão editorial.

## Conferência manual após publicação

1. Abrir home e quatro categorias sem JavaScript: títulos, capas, resumos e links devem aparecer.
2. Abrir um card: texto estático disponível.
3. Com JavaScript, pesquisar e limpar filtros; conferir contagens.
4. Simular indisponibilidade da API: listagens permanecem disponíveis.
5. Confirmar que rascunhos, registros futuros, Perícia e Especiais não vazam para a listagem incorreta.
