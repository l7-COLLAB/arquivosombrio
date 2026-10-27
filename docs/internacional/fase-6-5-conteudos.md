# Fase 6.5 — contrato editorial para conteúdo internacional

**Status: implementada em branch de proposta, sem mudanças no Supabase e sem publicação.**

## Inventário e origem
- O site atual utiliza arquivos HTML estáticos e páginas dinâmicas, como `garimpo.html?id=...`. A relação entre esses identificadores deve ser comprovada no banco antes da migração.
- `i18n/registro-conteudos.json` é um registro-piloto **não público**. O item Ronald O'Bryan foi identificado por um caminho visível no acervo Lite, mas seu ID canônico e estado editorial ainda não foram validados.
- `sourceKey` é imutável como referência lógica, independentemente de renomear títulos ou slugs de tradução.
- `canonicalDatabaseId` começa como `null`; nunca inventar um identificador.
- A fonte portuguesa continua sendo a origem. Não sobrescrever seu conteúdo, URL, agenda, datas ou imagens ao localizar.

## Tradução editorial
- `i18n/esquema-conteudo.schema.json` estabelece contrato para título, resumo, blocos narrativos, tipologia de evidência, fontes, revisão e controles de direitos.
- Cada idioma tem um registro separado e ciclo independente: `not_started` → `draft` → `in_review` → `approved` → `published` (ou `archived`).
- Estados `not_started` ficam **somente no registro**; traduções JSON começam em `draft`.
- Blocos são classificados como `fact`, `testimony`, `hypothesis`, `controversy`, `paragraph`, `heading`, ou `quote`. Não tratar hipóteses como fatos.
- Não publicar texto vazio, sem revisão, sem fontes verificáveis, nem traduções que percam contexto.
- `sourceRevision` deve referenciar revisão verificada da fonte; se a fonte mudar, retornar a tradução para revisão antes de republicar.

## URLs e SEO
- As URLs `/en/`, `/es/`, `/fr/` ainda não existem; o registro não as cria.
- Só considerar URL publicada após aprovação, integridade do HTML em idioma correspondente, referências e verificação HTTP.
- `canonical`, `hreflang`, `og:locale`, sitemap e metadados precisam refletir rotas efetivas e conteúdo real.
- Não mostrar cards, links ou contagens de traduções que ainda não estejam publicadas.

## Requisitos para integração futura com o Admin V2/Supabase
1. Identificar tabelas reais, chaves primárias, permissões RLS e eventuais fluxos de Storage.
2. Introduzir relação `source_id` ↔ `locale` única, sem modificar a tabela original até revisão do esquema.
3. Criar status de revisão, carimbos de publicação, versão da origem e histórico de alterações.
4. Restringir publicar/aprovar a papéis administrativos autenticados no servidor. Nunca confiar somente em controle client-side.
5. As traduções devem apontar para arquivos de imagem existentes e licenciados; somente gerar áudio traduzido quando houver narração aprovada.
6. Não herdar datas da fonte para publicar automaticamente; calendário internacional independente.

## Critérios de aceite desta fase
- Arquivo de registro válido e compatível com os idiomas do `config-internacional.json`.
- Nenhuma tradução fictícia ou incompleta anunciada como publicada.
- Contrato de dados de conteúdo presente com validações mínimas explícitas.
- Nenhuma alteração no banco ou rotas públicas.

## Fase candidata 6.6
Mapear as tabelas reais e preparar migração idempotente para conteúdos localizados, com RLS e fila de revisão, sem aplicação automática em produção.
