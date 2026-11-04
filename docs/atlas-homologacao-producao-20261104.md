# Atlas Criminal — homologação real e diagnóstico de publicação

**Data:** 04/11/2026 (horário do Brasil). **Ambiente:** domínio público `https://arquivosombrio.net.br`. **Referência:** teste GitHub Actions [41919916369](https://github.com/l7-COLLAB/arquivosombrio/actions/runs/41919916369).

## Homologação HTTP real: aprovada
- Página `/atlas.html`: HTTP **200**.
- Página `/admin-v2/atlas.html`: HTTP **200**, com metatag `noindex`.
- Script público e administrativo: HTTP **200**.
- API pública anônima: HTTP **200**, com **53 registros e 49 cidades distintas**.
- Tentativa anônima de ler `review_note`: **HTTP 401 (bloqueado)**.
- Respostas e coordenadas válidas nos 53 registros consultados.

## Homologação com navegador real: aprovada
- Chromium mobile **390 × 844 px**: 53 registros visíveis na lista, Leaflet inicializado, sem rolagem horizontal, busca Bogotá retorna 1 caso, filtro Brasil funciona, sem exceções JavaScript.
- Chromium desktop **1440 × 900 px**: mesmos critérios, todos aprovados.
- Imagens e relatórios anexados à execução acima no artefato `atlas-live-diagnostic-pr`.
- Não foram testados cadastro/edição com credenciais administrativas ou todos os sistemas externos além da carga observada.

## Diferença entre o código e o domínio
- Código principal do repositório (`atlas.html`): script `js/atlas-criminal.js?v=3`.
- Domínio às **18h55 de 04/11/2026**: script **`v=2`**.
- Isso é **publicação desatualizada**, apesar de o site estar acessível e funcional.

## Diagnóstico GitHub Pages
- Último deploy de `main` da mudança v3: [run 41897485930](https://github.com/l7-COLLAB/arquivosombrio/actions/runs/41897485930), commit `3959a5e2b8ff72a99d954013fdf9fae43d22cc7f`: **falhou**. Build estático e upload do artefato (aprox. 18,75 MB) foram aprovados, mas `actions/deploy-pages@v4` permaneceu em `updating_pages` até o limite de **600.000 ms (10 minutos)** e cancelou o deploy.
- A tentativa de repetir o mesmo run também **falhou**: a execução acabou com **dois artefatos `github-pages`**, e o `deploy-pages` exige exatamente um artefato com esse nome. **Não repetir esse mesmo run outra vez**.
- Correção operacional: iniciar um **novo run completo** em `main`, produzindo um único artefato; revisar seu status e comparar o HTML publicado com `v=3`. Se a etapa `updating_pages` voltar a travar, o problema requer inspeção do serviço GitHub Pages, sem declarar a implantação concluída.

**Estado deste registro:** funcionamento da versão pública atual validado; publicação da versão v3 ainda não comprovada no momento do diagnóstico.
