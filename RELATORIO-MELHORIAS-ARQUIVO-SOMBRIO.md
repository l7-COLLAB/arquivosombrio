# Relatório — Melhorias controladas do Arquivo Sombrio

Data: 2026-10-20  
Branch de trabalho: `melhorias-controladas-arquivo-sombrio`  
Base original: `44a3d9961c4bc8fc890fed4d6ecfaac03ab0a4cb`  
Base atual (fast-forward): `origin/main` (`e23cf753` — “Atualizar previa estatica isolada do Arquivo Sombrio Lite”)  
Envio ao GitHub: branch isolada + Pull Request para `main`, **sem merge**.

## 1. Estado inicial

### Branch e commit

- Branch isolada criada a partir de `origin/main` em `44a3d99`.
- `origin/main` avançou 1 commit (`e23cf75`, só Lite preview + `lastmod` de `garimpo.html?id=27`). Fast-forward sem conflito; nenhum arquivo desta rodada sobrepôs o novo commit.
- A auditoria anterior em `AUDITORIA-ARQUIVO-SOMBRIO-ADMIN-V2.md` descreve a branch `admin-v2` e não foi usada como fonte de código.

### Arquitetura encontrada

- Site estático HTML/CSS/JS + GitHub Pages.
- Supabase `iuhotznurbyujzbyhizf.supabase.co` com chave publishable no frontend. Sem `service_role`.
- Admin V2 em `admin-v2/`, com login isolado, Turnstile e `app_metadata.role===admin`.
- Pesquisa unificada em `pesquisa.html` + `js/pesquisa-acervo.js` (cinco editorias).
- Estúdio Visual em `admin-v2/js/visual-studio.js`, publicado em `visual_site_versions` e lido em runtime por `js/public-visual-settings.js`.
- Narração Kokoro em `admin-v2/js/narration.js` e `admin-v2/js/voice-studio.js`.
- SEO: `sitemap.xml`, `robots.txt`, testes em `tests/seo-*.mjs`.

### Funcionalidades preservadas

Dossiês, Garimpo, Perícia, Lendas, Creepypastas, Biblioteca, fórum, Admin V2, Estúdio Visual, pesquisa unificada, Kokoro, sitemap, PWA, Lite, leitor (tema, papel, modo livro, sumário, marcador) e testes existentes. Nenhuma URL pública foi alterada. Nenhum áudio foi gerado, substituído ou excluído. Nenhuma política RLS, credencial ou dado de produção foi modificado.

## 2. Problemas confirmados

| # | Descrição | Arquivo | Evidência | Gravidade | Status |
|---|---|---|---|---|---|
| 1 | Aviso do editor de dossiê dizia que tudo salvava só em `admin_drafts`, mas Salvar alterações / Publicar chamam `essentialCommit` | `admin-v2/js/editor-dossie.js` | Texto antigo vs `btn-save-live` / `btn-publish` | Média | Corrigido |
| 2 | Autosave do editor essencial gravava conteúdo já publicado após 1,2 s | `admin-v2/js/editor-essential.js` | `setTimeout(()=>save(false)...)` sem filtro de status | Alta | Corrigido |
| 3 | Upload de imagem aceitava SVG (`image/svg+xml`) | `admin-v2/js/media.js` | Só exigia `image/` | Média | Corrigido |
| 4 | `getAdminDraft` não filtrava `user_id`; Garimpo já filtrava | `admin-v2/js/data.js` | Contraste com `getGarimpoDraft` | Média | Corrigido |
| 5 | Documentos aceitavam `image/*` e qualquer MIME não-SVG | `admin-v2/js/media.js`, `editor-dossie.js` | `accept=...image/*` e ausência de allowlist | Média | Corrigido |
| 6 | Agendamento de dossiê/garimpo sem `confirm()` | `editor-dossie.js`, `editor-garimpo.js` | Publish/save/delete confirmam; schedule não | Baixa | Corrigido |
| 7 | Status nulo no essencial: UI “Publicado”, `save(false)` gravava `rascunho` sem confirmação | `admin-v2/js/editor-essential.js` | Fallbacks `publicado` vs `rascunho` | Média | Corrigido |
| 8 | Lock do Garimpo dizia que o registro público não mudava; botões atualizam `casos_diarios` | `admin-v2/js/editor-garimpo.js` | Copy vs `saveGarimpoEssential` | Média | Corrigido |
| 9 | Evidências/hipóteses do Garimpo usavam a sequência literal `\n` em vez de quebra de linha | `admin-v2/js/editor-garimpo.js` | `join("\\n")` / `split(/\\n\\s*\\n/)` | Média | Corrigido |
| 10 | Estúdio Visual dizia que a publicação exigia deploy de código | `admin-v2/js/visual-studio.js` | `js/public-visual-settings.js` lê `visual_site_versions` em runtime | Baixa | Corrigido |
| 11 | Roteiro Kokoro “texto original” preferia `historia`/`conteudo` e omitia `conteudo_blocos` | `admin-v2/js/narration.js` | `fullNarrationSource` retornava cedo se houvesse body legado | Média | Corrigido |
| 12 | Teste de sitemap esperava 92 URLs / aspas duplas; o XML da `main` tem 94 URLs e declaração com aspas simples | `tests/seo-sitemap.mjs`, `sitemap.xml` | `caso.html?id=27` e `garimpo.html?id=34` | Baixa (CI) | Corrigido (teste) |
| 13 | README do Admin V2 ainda afirmava escrita/publicação bloqueadas | `admin-v2/README.md` | Contradiz os editores atuais | Baixa | Corrigido |

### Já corretos — não alterados

- Login admin: Turnstile + `app_metadata.role===admin` + `signOut` se não for admin.
- `robots.txt` já `Disallow: /admin-v2/` e `/admin-lite/`.
- `admin-v2/index.html` já `noindex,nofollow`.
- Pesquisa unificada: cinco editorias, só `status_publicacao=publicado`, links `*.html?id=`, empty-state, retry, `aria-pressed`, sem `innerHTML`.
- Padrão visual por categoria: `scope==='cards'` + `allowedSelector` no público.
- Leitor móvel, marcador e acessibilidade já cobertos por testes.
- Motor de publicação em fila permanece bloqueado (prepare/simulate, sem UPDATE público).

## 3. Alterações realizadas

Arquivos incluídos neste PR:

- `admin-v2/js/editor-dossie.js`
- `admin-v2/js/editor-essential.js`
- `admin-v2/js/editor-garimpo.js`
- `admin-v2/js/media.js`
- `admin-v2/js/data.js`
- `admin-v2/js/visual-studio.js`
- `admin-v2/js/narration.js`
- `admin-v2/README.md`
- `tests/admin-v2-regressions.mjs`
- `tests/pesquisa-acervo.mjs`
- `tests/seo-sitemap.mjs`

Arquivo novo incluído no PR: `RELATORIO-MELHORIAS-ARQUIVO-SOMBRIO.md`.  
Untracked pré-existente, **não** commitado: `AUDITORIA-ARQUIVO-SOMBRIO-ADMIN-V2.md`.

### Correções

1. Aviso do dossiê distingue rascunho (`admin_drafts`) de Salvar alterações / Publicar.
2. Autosave essencial não dispara se o status atual for `publicado`; Salvar em publicado pede confirmação e preserva o status da tela.
3. SVG bloqueado por MIME e extensão.
4. Rascunho de dossiê lido com `user_id` da sessão, como o Garimpo.
5. Documentos: allowlist PDF/DOC/DOCX/TXT/RTF; o picker deixou de oferecer `image/*`.
6. Agendar dossiê e Garimpo exige confirmação; copy deixa claro que o site público não muda agora.
7. Lock do Garimpo alinhado ao comportamento real dos botões essenciais.
8. Evidências/hipóteses do Garimpo passam a usar quebras de linha reais.
9. Publicação do Estúdio Visual informa recarga das páginas públicas, não deploy de código.
10. Consulta Kokoro do texto original prefere blocos publicados quando existem.
11. README descreve o fluxo atual, sem afirmar que a escrita pública está bloqueada.
12. Teste de sitemap alinhado às 94 URLs e à declaração XML da `main`.

Benefícios esperados: menos publicação acidental, uploads mais restritos, rascunhos isolados por admin, copy fiel ao código, roteiro Kokoro alinhado aos blocos, CI de sitemap deixando de falhar por drift.

## 4. Validação

Comando:

```
node --test tests/admin-v2-regressions.mjs tests/seo-sitemap.mjs tests/pesquisa-acervo.mjs tests/pesquisa-avancada.mjs tests/pesquisa-auditoria-real.mjs tests/seo-dynamic.mjs tests/seo-jonbenet-legacy.mjs tests/public-accessibility.mjs tests/reader-mobile-controls.mjs tests/reader-bookmark.mjs
```

Resultado: **55/55 passaram**.  
`node --check` nos JS alterados: OK.

Não executado (ambiente / risco):

- Login real no Admin V2.
- Upload real, publicação real, agendamento real.
- Geração ou exclusão de áudio Kokoro.
- Lighthouse / CrUX (sem artefato novo nesta sessão).
- Search Console.

## 5. Segurança

Alterações sensíveis desta rodada: só validação de upload, filtro de rascunho por `user_id`, confirmações e copy. Nenhuma chave, RLS, RPC ou Storage policy foi mudada.

Riscos restantes (exigem aprovação; não implementados):

- `ADMIN_V2.publicWritesEnabled=false` não é lido por nenhum módulo. Salvar/Publicar essencial já escrevem `Casos`, `casos_diarios`, `pericias`, `lendas`, `creepypastas` e `livros`.
- Role admin é checada no login/boot; escritas posteriores dependem de RLS.
- Checagens de upload são só no cliente; o JWT ainda pode chamar Storage direto.
- Chave publishable continua no frontend (esperado; não é `service_role`).
- `htmlEscape` em `visual-studio.js` é sanitizador de slug morto, não XSS ativo.

## 6. Próximos passos

### Concluído

Etapa 1 (código de segurança de baixo risco), parte da Etapa 2 (copy, autosave, agendamento, documentos, rascunhos), copy do Estúdio Visual, auditoria da pesquisa, ajuste Kokoro de roteiro, alinhamento do teste de sitemap, testes de regressão.

### Parcial

- Etapa 3: padrão por categoria já existe e não foi redesenhado; só a mensagem de publicação.
- Etapa 5: só a fonte do roteiro; sem inventário live de MP3.
- Etapa 6: teste alinhado; sitemap do repositório continua sendo snapshot (`caso.html?id=`), enquanto o deploy gera `/arquivo/...`.
- Etapa 7–8: auditoria; sem otimização nova (sem evidência Lighthouse desta sessão).
- Etapa 10: PR aberto para `main`, sem merge.

### Pendente / bloqueado

1. Revisar e autorizar o merge deste PR (não mesclado automaticamente).
2. Decidir se `publicWritesEnabled` deve voltar a bloquear escrita pública.
3. Inventário live de áudios (precisa Supabase/R2).
4. Player em páginas prerender `/arquivo/{page}-{id}.html` e dossiês legado além de Lizzie Borden.
5. `CHUNK_BUSY` após 6 tentativas ainda falha no player público.
6. Search Console / duplicatas `caso.html?id=` vs `/arquivo/caso-N.html`.
7. Medição Lighthouse nova antes de qualquer otimização de desempenho.
8. Não alterar RLS, credenciais, Storage policies ou dados reais sem autorização.

### Ordem sugerida

1. Revisar este PR e autorizar o merge.
2. Produto: escrita pública do V2 ligada ou isolada de novo.
3. Audio: inventário + player nas URLs canônicas de SEO.
4. Só então desempenho, com medição antes/depois.

## Estado das etapas

| Etapa | Estado |
|---|---|
| 1 Segurança | Concluída no código de baixo risco; RLS/credenciais bloqueadas |
| 2 Admin V2 | Parcialmente concluída (bugs comprovados) |
| 3 Estúdio Visual | Parcial (copy); padrão por categoria preservado |
| 4 Pesquisa | Auditada e coberta por testes; sem recodificar |
| 5 Kokoro | Parcial (roteiro); sem gerar/apagar áudio |
| 6 SEO | Parcial (teste de sitemap); URLs públicas intocadas |
| 7 Desempenho | Não iniciada em código (sem evidência nova) |
| 8 Leitura | Auditada; testes existentes passam |
| 9 Qualidade | 55 testes locais passando |
| 10 PR | Aberto para `main`, sem merge |
