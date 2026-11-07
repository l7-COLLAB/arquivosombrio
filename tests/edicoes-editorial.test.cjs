"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname,"..");
const read = p => fs.readFileSync(path.join(root,p),"utf8");

test("MIANI possui vitrine pública e protege os manuscritos", () => {
  const page = read("edicoes/index.html");
  const css = read("edicoes/miani-public.css");
  const home = read("index.html");
  const novels = read("novels.html");
  const studio = read("admin-v2/editorial/index.html");
  assert.ok(home.includes('href="edicoes/"'));
  assert.ok(novels.includes('href="edicoes/"'));
  assert.ok(page.includes("Os Dias de Outubro"));
  assert.ok(page.includes("L.R. Muller"));
  assert.ok(page.includes("https://loja.uiclap.com/titulo/ua220883/"));
  assert.ok(page.includes('content="index,follow'));
  assert.ok(!page.includes("editorial_chapters"));
  assert.ok(!page.includes("supabase-js"));
  assert.ok(css.includes("miani-identidade.webp"));
  assert.ok(css.includes("miani-moldura.webp"));
  assert.ok(studio.includes("noindex,nofollow"));
  assert.ok(!studio.includes('href="../../edicoes/"'));
  assert.ok(read("sitemap.xml").includes("https://arquivosombrio.net.br/edicoes/"));
});

test("Estúdio exige administrador e não contém publicação automática", () => {
  const html = read("admin-v2/editorial/index.html");
  const js = read("admin-v2/editorial/editorial.js");
  assert.match(html,/noindex,nofollow/);
  assert.match(js,/auth\.getUser\(\)/);
  assert.match(js,/app_metadata\?\.role !== "admin"/);
  assert.match(js,/rpc\("is_arquivo_sombrio_admin"\)/);
  assert.match(js,/\.eq\("book_id",book\.id\)/);
  assert.match(js,/\.eq\("updated_at",current\.updated_at\)/);
  assert.match(js,/document\.createElement\("p"\)/);
  assert.match(js,/\.textContent = paragraph\.trim\(\)/);
  assert.doesNotMatch(js,/\.insert\(\{[^}]*status_publicacao/);
});

test("Esquema de livros protege todos os rascunhos por RLS", () => {
  const sql = read("supabase/migrations/20261104143636_arquivo_sombrio_edicoes_estudio_mvp.sql");
  for(const table of ["editorial_books","editorial_chapters"]){
    assert.match(sql,new RegExp("alter table public\\."+table+" enable row level security"));
    assert.match(sql,new RegExp("revoke all on public\\."+table+" from public,anon,authenticated"));
  }
  assert.match(sql,/public\.is_arquivo_sombrio_admin\(\)/);
  assert.match(sql,/on conflict\(book_id,chapter_number\) do nothing/);
});


test("V2 esconde cadastros arquivados e mostra versões no capítulo", () => {
  const html = read("admin-v2/editorial/index.html");
  const js = read("admin-v2/editorial/editorial.js");
  assert.match(js,/\.is\("archived_at",null\)/);
  assert.match(js,/const legacyAlternative = requestedSlug === "miani-nora-versoes-alternativas"/);
  assert.match(js,/history\.replaceState\(null,"",redirected\.href\)/);
  assert.match(html,/id="version-panel"/);
  assert.match(html,/id="version-compare"/);
  assert.match(html,/id="save-alternative"/);
  assert.match(html,/id="restore-version"/);
  assert.match(js,/from\("editorial_chapter_versions"\)/);
  assert.match(js,/\.eq\("chapter_id",current\.id\)/);
  assert.match(js,/\.eq\("updated_at",current\.updated_at\)/);
  assert.match(js,/window\.confirm\("Tornar esta versão/);
  assert.match(js,/\.textContent = data\.version_label/);
});

test("Histórico preserva versões por trigger e RLS administrativa", () => {
  const sql = read("supabase/migrations/20261105153000_miani_editorial_chapter_versions.sql");
  assert.match(sql,/CREATE TABLE IF NOT EXISTS public\.editorial_chapter_versions/);
  assert.match(sql,/ALTER TABLE public\.editorial_chapter_versions ENABLE ROW LEVEL SECURITY/);
  assert.match(sql,/REVOKE ALL ON public\.editorial_chapter_versions FROM public, anon, authenticated/);
  assert.match(sql,/CREATE POLICY editorial_chapter_versions_admin_select/);
  assert.match(sql,/public\.is_arquivo_sombrio_admin\(\)/);
  assert.match(sql,/SECURITY INVOKER/);
  assert.match(sql,/BEFORE UPDATE OF title,body,status/);
  assert.match(sql,/ON CONFLICT \(source_chapter_id\) DO NOTHING/);
  assert.match(sql,/archived_at=COALESCE\(archived_at,now\(\)\)/);
});
