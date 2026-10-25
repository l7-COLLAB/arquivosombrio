import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),"utf8"));
const a=read("../docs/revisao-focalizada-cronologias-fase5-35.json");
const base=read("../docs/auditoria-individual-cronologias-fase5-34.json");
assert.equal(a.checagens.length,9);
assert.equal(new Set(a.checagens.map(x=>x.id+":"+x.i)).size,9);
for(const e of a.checagens){assert(base.itens.some(x=>x.id_caso===e.id&&x.indice===e.i));assert(e.sources.length>0);assert.equal(e.aprovado,false);assert.equal(e.altera_texto_original,false)}
assert(a.checagens.some(e=>e.id===6&&e.i===11&&e.status.includes("divergencia")));
assert(a.checagens.some(e=>e.id===5&&e.i===12&&e.status.includes("pendente")));
console.log("Nove exceções documentais rastreáveis; aprovação bloqueada.");
