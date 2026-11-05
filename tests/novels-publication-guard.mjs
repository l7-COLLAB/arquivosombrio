import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const guard = require("../admin-v2/js/novels-publication-guard.js");

const clean = { numero: 1, titulo: "Capítulo I", conteudo: "Texto literário integral.", status_publicacao: "publicado" };
const warned = { ...clean, conteudo: "Texto literário.\n\n[FIM DO CAPÍTULO I — REVISÃO PENDENTE. NÃO PUBLICAR.]" };
const book = { slug: "dracula", status_publicacao: "publicado" };
const chapters = () => Array.from({length:27}, (_,i) => ({...clean, numero:i+1}));

test("Rascunhos continuam editáveis, mesmo com marcador", () => {
  assert.deepEqual(guard.checkChapter({...warned, status_publicacao:"rascunho"}), []);
});
test("Publicação e agendamento de capítulo com aviso são bloqueados", () => {
  for (const status of ["publicado", "agendado"]) {
    assert.ok(guard.checkChapter({...warned,status_publicacao:status}).length);
    assert.ok(guard.checkChapter({...warned,conteudo:"Versão preliminar condensada.",status_publicacao:status}).length);
  }
});
test("Capítulo sem texto, título ou número não pode ser publicado", () => {
  for(const patch of [{conteudo:""},{titulo:""},{numero:0}]) {
    assert.ok(guard.checkChapter({...clean,...patch}).length);
  }
});
test("Drácula exige 27 capítulos completos sem avisos, todos liberados", () => {
  assert.deepEqual(guard.checkBook(book,chapters()), []);
  assert.ok(guard.checkBook(book,chapters().slice(0,26)).length);
  assert.ok(guard.checkBook(book,[...chapters().slice(0,26),chapters()[25]]).length);
  assert.ok(guard.checkBook(book,chapters().map((c,i)=>i===12?{...c,status_publicacao:"rascunho"}:c)).length);
  assert.ok(guard.checkBook(book,chapters().map((c,i)=>i===12?{...c,conteudo:warned.conteudo}:c)).length);
  assert.ok(guard.checkBook(book,null).length);
});
test("Obras em rascunho ou seriadas não sofrem bloqueio de 27 capítulos", () => {
  assert.deepEqual(guard.checkBook({...book,status_publicacao:"rascunho"},[]),[]);
  assert.deepEqual(guard.checkBook({slug:"novel-seriada",status_publicacao:"publicado"},[]),[]);
});
