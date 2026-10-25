import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../previews/revisao-editorial-fase5-50.html",import.meta.url),"utf8");
assert.match(html,/Somente leitura/);
assert.match(html,/Thomas Mosser/);
assert.match(html,/Dana Chandler/);
assert.match(html,/Nenhuma decisão registrada/);
assert.doesNotMatch(html,/supabase\.from\s*\(/i);
assert.doesNotMatch(html,/<button\b/i);
assert.doesNotMatch(html,/localStorage|fetch\s*\(/);

const comparison=JSON.parse(readFileSync(new URL("../docs/revisao-comparativa-cronologias-fase5-45.json",import.meta.url),"utf8"));
assert.equal(comparison.comparacoes.length,2);
for(const entry of comparison.comparacoes){
 for(const field of ["original","candidata","fonte"])assert.ok(html.includes(entry[field]),"Divergencia entre previa e expediente: "+entry.id_caso+":"+entry.indice+" "+field);
 assert.equal(entry.homologado,false);
 assert.equal(entry.aplicado,false);
}
assert.equal(comparison.pendencia.id_caso,5);
assert.equal(comparison.pendencia.indice,12);
assert.equal(comparison.pendencia.publicavel,false);
assert.match(html,/Nota processual de Dana Chandler excluída da publicação/);
assert.doesNotMatch(html,/<form\b|<input\b|<textarea\b|contenteditable|\.insert\s*\(|\.update\s*\(|\.delete\s*\(/i);
console.log("Fase 5.50: prévia estática sem botões ou persistência.");
