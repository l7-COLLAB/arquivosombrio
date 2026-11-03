# Publicação controlada das 21 capas alternativas — 03/11/2026

## Escopo e decisão
Após a criação de 21 ilustrações vetoriais originais para substituir as fotografias de terceiros sem licença específica documentada, foi feita a revisão técnica/editorial de adequação: texto visível identifica a imagem como ilustrativa, sem retrato de vítima, foto de cena ou alegação de evidência; descrição `alt` e legenda para leitores; fallback de compartilhamento social em JPEG existente. As capas SVG originais e os metadados encontram-se em `assets/capas-alternativas-direitos/` e `data/capas-alternativas-direitos-20261103.json`.

A substituição foi autorizada pelo responsável editorial para esta execução. **Não foi possível comprovar a licença das 21 fotografias anteriores**, razão pela qual não foram mantidas como capas publicadas. O trabalho não cobre imagens inseridas dentro dos textos, reproduções em redes sociais ou caches mantidos por terceiros.

## Confirmação de execução no banco
- Substituídas **21/21** URLs de capa em uma única operação transacional: **5 Dossiês**, **14 Garimpos** e **2 Perícias**.
- Conferência anterior: 21 registros existentes, com status `publicado` e caminhos das imagens antigas coincidentes com a linha de base.
- O armazenamento privado `private.cover_replacement_audit_20261103` preserva as **21 URLs integrais originais**, inclusive parâmetros, e os campos de fonte e legenda de Perícia para eventual reversão.
- A tabela privada tem RLS habilitada; permissões de leitura de `anon` e `authenticated` foram negadas. Não disponibilizar essas URLs por API pública.
- A operação desabilitou **temporariamente apenas** os três triggers `trg_prewarm_casos`, `trg_prewarm_garimpo` e `trg_prewarm_pericias` **durante uma única transação** e os reabilitou antes do commit. Evita resetar a fila de narração para alterações apenas de capa. Depois, os três apresentaram `tgenabled = 'O'`.
- **Verificação posterior via SELECT:** backup **21/21**; destino de imagem **21/21** correto; status publicado **21/21**; distribuição **5+14+2**. As legendas de `pericias.id IN (3,14)` identificam a nova arte e não atribuem créditos fotográficos às imagens substitutas.
- Nenhum artigo foi excluído. Nenhuma palavra do texto narrativo, título, slug, URL canônica, perfil de leitor, arquivo de áudio ou imagem de Storage foi removida. Datas de modificação de registros podem ter mudado conforme atualização de capa.

## Compatibilidade com leitores e SEO
- PR [#137](https://github.com/l7-COLLAB/arquivosombrio/pull/137) mesclada em `a6de9bc5360e338ec505740a97642cd87f321839`, com 11 checks de regressão verdes antes da alteração no banco.
- Leitores e páginas estáticas identificam as imagens como **ilustrações**, sem as apresentar como fotografia.
- As páginas estáticas colocam a arte SVG como capa de leitura/JSON-LD; `og:image` e `twitter:image` usam `https://arquivosombrio.net.br/imagem-compartilhamento.jpg` porque SVG não é suportado de forma confiável por algumas redes de compartilhamento. As capas antigas deixam de ser apontadas como metadados de publicação na próxima geração de SEO do GitHub Pages.
- A atualização do manifesto e este registro em `main` provocam novo build do GitHub Pages (workflow de push). **Não confundir aprovação do CI do PR com prova de que o build de produção e DNS já servem a nova versão**. Validar GET/HTTP 200 das 21 SVGs, HTML das três editorias, miniaturas OG, sitemap, mobile, acessibilidade de `alt` e eventuais caches de redes.

## Reversão controlada
Caso haja falha de renderização, usar a tabela `private.cover_replacement_audit_20261103` para obter, de modo autenticado e privilegiado, as URLs integrais anteriores e campos de legenda/fonte. A reversão deve:
1. Checar que a imagem atual ainda é exatamente `replacement_image_url` e que o artigo continua publicado. Não sobrescrever edições posteriores.
2. Fazer alterações de `imagem` (Casos e pericias) ou `imagem_capa` (casos_diarios) em uma transação, restaurando `original_image_caption` e `original_image_credit` nas duas Perícias.
3. Não disparar novamente a narração em alteração apenas de capa: suspender somente os três triggers de prewarm na mesma transação, restaurando-os antes de commit, com bloqueio de tempo curto e erro que aborta a transação.
4. Registrar `restored_at` por ID restaurado; confirmar após a operação e acionar novo deploy SEO.
5. Se houver contestação de direitos, não restaurar imagens não licenciadas como decisão automática. Preferir corrigir a nova capa sem reinserir foto de terceiro.

O registro não copia URLs integrais anteriores para documentos públicos. Os IDs e seus caminhos SVG estão no manifesto `data/capas-alternativas-direitos-20261103.json`.

## Pendências restantes do lote de 65
Das **65 capas sem prova suficiente** inicialmente identificadas, **21 agora foram substituídas por ilustrações originais**; ficam **44 casos a resolver**:
- **38** uploads em Supabase (`imagens`: 34; `novel-capas`: 4), sem documentos de autoria/licença originais.
- **3** imagens institucionais.
- **2** arquivos locais ou imagens incorporadas.
- **1** dossiê sem imagem principal no campo de capa (Barbara Mackle).

As **21 licenças anteriores do manifesto histórico** ainda demandam cotejo externo independente; a presente execução não certifica direitos autorais de todo o site.
