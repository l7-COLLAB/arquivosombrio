# Etapa 20 — sitemap automático e metadados seguros

Data da implementação: 18/10/2026.

## Mudanças

O workflow de publicação GitHub Pages gera `_site/sitemap.xml` usando `scripts/build-public-sitemap.py` em **cada deploy** e também em uma execução programada a cada seis horas. O script usa somente a chave pública anon já presente no frontend e consulta as cinco coleções com `status_publicacao=eq.publicado`. Todas as consultas precisam ter sucesso antes de substituir o sitemap do artefato. Em caso de falha de rede ou resultado inconsistente, o deploy falha e não publica um mapa incompleto.

As URLs estáticas e antigas preservadas no sitemap versionado permanecem no arquivo gerado. URLs por ID são reconstruídas dinamicamente a partir do banco. O `sitemap.xml` do repositório permanece como *snapshot base*; a versão do **site publicado** é dinâmica a cada implantação.

Dossiês abertos como rascunho, visíveis apenas em contexto administrativo autorizado, agora solicitam `noindex,nofollow` e não emitem JSON-LD Article pelo gerador JS. Dossiês publicados mantêm os metadados originais. **`robots.txt` não é proteção de acesso.** RLS/autenticação continuam essenciais.

## Limites relevantes

- O agendamento a cada seis horas não significa indexação imediata nem uma atualização instantânea após publicar. Um novo push à branch principal também aciona a atualização.
- Sem publicação de HTML pré-renderizado individual, títulos, descrições e JSON-LD dinâmicos continuam dependendo da execução de JavaScript. Em GitHub Pages, URLs do formato `caso.html?id=...` compartilham o mesmo HTML inicial, o que limita o controle de SEO para crawlers sem JS.
- O script admite até 999 registros publicados por tabela. Quando o catálogo superar esse limite, é obrigatório adicionar paginação antes de prosseguir. O script falha explicitamente nesse caso.
- As verificações de CI incluem testes offline e consulta ao Supabase público na preparação de um sitemap temporário. Os dados de acesso utilizados são apenas de leitura pública, sem service-role.
- O snapshot base deve continuar sendo auditado; a versão pública poderá apresentar um número diferente de URLs conforme novas publicações.
- Search Console continua necessário para avaliar indexação real, problemas de cobertura e canonicalização.

## Validação técnica

`python3 -m unittest discover -s tests -p 'test_build_public_sitemap.py' -v`

`node --test tests/seo-dynamic.mjs`

Em CI: uma terceira etapa gera um sitemap temporário a partir das cinco tabelas públicas e confirma a presença de itens publicados.
