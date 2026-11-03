# Arquivo Sombrio — regularização documental de capas, etapa 2
Data da consulta: 03/11/2026. Escopo: capas dos 115 registros publicados inventariados na etapa anterior, sem alterar conteúdos ou imagens publicados no banco.

## Resultado observável
- 115 registros de capa no inventário inicial (6 editorias).
- 21 capas publicadas com correspondência literal ao manifesto preexistente `data/capas-documentais.json`. Esses 21 registros são documentação interna anterior, **sem revalidação individual na fonte nesta etapa**.
- 94 capas que não correspondiam ao manifesto foram separadas por origem.
- 29 das 94 usam Wikimedia Commons; **todas as 29 páginas de arquivo foram consultadas**, e sua licença declarada, autor/crédito, URL e nota de contexto foram incluídos em `data/creditos-capas-verificados-20261103.json`.
- 65 das 94 permanecem **sem prova suficiente de direitos no repositório**:
  - 38 imagens armazenadas no Supabase sem origem/licença original documentada.
  - 11 imagens vinculadas diretamente a imprensa ou streaming.
  - 10 imagens de outros sites de terceiros.
  - 3 imagens de sites governamentais/institucionais, com condições específicas ainda a consultar.
  - 2 imagens locais/incorporadas (incluindo 1 data URI embutida no banco).
  - 1 dossiê sem campo de capa definido (Barbara Mackle, `Casos.id=10`).
- Com os 29 novos registros e 21 anteriores, foram preparados **50 créditos públicos** em `creditos-imagens.html` e um link na Política de Fontes (`fontes-direitos.html`, v1.1).

**Importante:** não interpretar “50 com documentação” como 50 obras juridicamente aprovadas. Comprovar a licença declarada é diferente de demonstrar integralmente sua validade, autoria verdadeira, cumprimento de obrigações, adaptações e direitos de personalidade no Brasil. As 21 entradas anteriores não passaram por revisão externa nesta etapa. O estado de 65 "pendentes" não significa que sejam 65 infrações.

## Evidências e ressalvas específicas
As páginas de origem podem ser consultadas a partir do registro JSON e da página pública. Exemplos revisados:
- [Frederick, CO — Jared Winkler / CC BY-SA 4.0](https://commons.wikimedia.org/wiki/File:Frederick,_CO.jpg).
- [Prédio do caso Isabella — OS2Warp / CC BY 3.0, também GFDL](https://commons.wikimedia.org/wiki/File:Pr%C3%A9dio_-_Caso_Isabella_2.jpg).
- [Cecil Hotel — Jim Winstead / CC BY 2.0](https://commons.wikimedia.org/wiki/File:Cecil_Hotel,_L.A.jpg).
- [Entomologia — Walnussbäumchen / CC BY-SA 4.0](https://commons.wikimedia.org/wiki/File:Blowflies_of_medicinal_use.jpg).
- [Teclado MOD — Chief Photographer / Open Government Licence v1.0](https://commons.wikimedia.org/wiki/File:Operating_a_Computer_Keyboard_MOD_45158106.jpg).
- [Ronald O'Bryan — foto Houston Chronicle](https://commons.wikimedia.org/wiki/File:Ronald_Clark_O%27Bryan_being_escorted_from_courtroom.jpg): a página declara domínio público **nos EUA** por ausência de aviso no jornal; isso não certifica ausência de restrição no Brasil, nem autoriza ignorar direitos de personalidade. Prioridade jurídica elevada.
- [Lars Mittank — foto do BKA](https://commons.wikimedia.org/wiki/File:Lars_Joachim_Mittank_(2013).jpg): a página afirma situação de obra oficial nos termos do §5 alemão; a análise da base legal específica e da imagem do desaparecido continua pendente.
- [Hinterkaifeck — fotografia histórica de Andreas Biegleder](https://commons.wikimedia.org/wiki/File:Hinterkaifeck-Hof.jpg): página declara domínio público pelo falecimento do autor em 1954.

A legislação brasileira (Lei nº 9.610/1998) e os direitos de personalidade devem ser considerados independentemente de a fonte estar hospedada na Wikimedia Commons. Há também termos de compartilhamento pela mesma licença em obras adaptadas sob CC BY-SA.

## Próxima remediação segura das 65 pendências
1. **Prioridade crítica documental:** identificar as 21 fontes de imprensa/streaming e terceiros externos e verificar licença/autorização. Sem comprovação, selecionar substituto de domínio público ou licença adequada, com crédito e legenda de imagem ilustrativa. Não presumir exceção de uso por finalidade jornalística.
2. **38 arquivos do Supabase:** rastrear de onde vieram os uploads. Nome de arquivo e bucket público não comprovam titularidade; localizar documento/recibo de autorização, autor, história de publicação ou substituir de forma conservadora.
3. **Três arquivos institucionais:** conferir termos de reutilização específicos da entidade responsável; conteúdo do governo não é automaticamente livre de direitos.
4. **Dois locais/incorporados e uma ausência:** solicitar identificação do criador da capa local, identificar a origem da data URI e verificar apresentação da capa inexistente. Não apagar a imagem embutida antes de garantir sua preservação em Storage e revalidar leitores/SEO.
5. **As 21 entradas antigas do manifesto:** fazer verificação externa das páginas e exigências de crédito, não apenas confiar nos registros internos.
6. **Próximos escopos:** imagens dentro dos textos, áudios e músicas de divulgação, traduções, capas de novels não cobertas, imagens de perfis e cards Instagram.

## Medidas executadas sem alterar conteúdo editorial
- Publicação de catálogo **parcial** com 50 créditos, vínculos de fonte e condições de licença.
- Registro de 29 fontes Wikimedia num manifesto complementar sem alterar o original nem atribuir licenças inventadas.
- Novo CSV compacto de triagem, com os 94 casos marcados por origem, prioridade e próximo passo.
- Retenção do inventário original em CSV como fotografia documental; no novo CSV, imagens incorporadas como base64 foram **omitidas** para não replicar a mídia inteira.
- Regra de CI `tests/image-credits-integrity.test.mjs` que verifica contagem, proveniência documentada, ausência de dados de imagem embutidos no CSV compacto e créditos públicos. Esse teste é de consistência de dados, **não** auditoria jurídica automática.
- Nenhuma fotografia de vítima ou investigado foi trocada; nenhum registro do banco ou Storage foi apagado, e nenhuma permissão de usuário foi modificada.

## Critério de fechamento
Regularização exige um registro por mídia (titular e fonte, licença ou autorização, data e prova, condições de adaptação, crédito exibido, direitos de personalidade, decisão do responsável e URL pública verificada). Publicar um link para uma licença **não** resolve, sozinho, direitos patrimoniais, territoriais ou direitos de imagem.
