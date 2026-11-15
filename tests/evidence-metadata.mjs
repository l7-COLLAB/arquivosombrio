import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const js=readFileSync(new URL("../js/caso.js", import.meta.url),"utf8");
const css=readFileSync(new URL("../css/caso.css", import.meta.url),"utf8");
assert.match(js,/className = "case-evidence-metadata"/);
for (const key of ["procedencia", "classificacao", "situacao_documental", "data_documento"]) {
  assert(js.includes(key), "Metadado ausente: " + key);
}
assert.match(js,/criarElementoTextoDossie\("dd", valor\)/);
assert.match(css,/\.case-evidence-metadata/);
assert.match(css,/@media \(max-width: 440px\)/);
console.log("Verificações estruturais de evidências concluídas");
