# Capas documentais — 01/11/2026

33 capas substituídas em Dossiês, Garimpo, Perícia, Lendas, Creepypastas e uma capa ausente em Novels. As demais capas existentes foram preservadas.

Os arquivos foram obtidos de fontes identificadas no manifesto `data/capas-documentais.json`, decodificados, inspecionados visualmente e convertidos proporcionalmente para WebP (até 960 × 1280), sem geração de imagem ou recorte. Cada entrada registra a fonte, a licença selecionada, a atribuição, as dimensões, o hash e a capa anterior.

Fotografias de contexto são identificadas como tal; fotografias de parques, cidades, equipamentos ou objetos não são apresentadas como imagens de cenas de crimes ou de personagens fictícios. Obras históricas de Goya e Fuseli e a representação da Mula sem Cabeça são identificadas como arte.

A mudança no banco altera somente a imagem, seus créditos/fontes e o horário de atualização. Não antecipa publicações, não modifica a narrativa e não muda o calendário. O processamento dos agendamentos lê a imagem atual do registro.

As páginas de leitura e as páginas estáticas mostram legenda, atribuição e links para a fonte e licença das novas capas. O script de créditos só atua em imagens listadas no manifesto e em seletores de capa do artigo.

## Validação

As 33 atualizações foram confirmadas no banco; nenhum registro das seis categorias ficou com capa ausente ou com o modelo provisório `imagens/capas/*.svg`. Os 22 agendamentos ativos foram preservados. Os testes dos cards passaram. A regressão do marcador continha uma comparação com `reader-bookmark.js?v=1`, embora a página já usasse `v=inline-audio-20261022` antes desta alteração. O teste agora verifica a ordem real dos scripts sem depender da versão de cache, preservando a exigência de carregamento com `defer`.
