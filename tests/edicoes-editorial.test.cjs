"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname,"..");
const read = p => fs.readFileSync(path.join(root,p),"utf8");

test("Editora em desenvolvimento não possui entrada pública", () => {
  assert.equal(fs.existsSync(path.join(root,"edicoes","index.html")),false);
  const home = read("index.html");
  const studio = read("admin-v2/editorial/index.html");
  assert.doesNotMatch(home,/href=["'](?:\/)?edicoes\/["']/);
  assert.doesNotMatch(studio,/href=["']\\.\\.\/\\.\\.\/edicoes\/["']/);
  assert.match(studio,/Estúdio Editorial/);
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

