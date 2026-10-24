import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),"utf8"));
const doc=read("../docs/revisao-documental-cronologias-fase5-41.json");
const candidate=read("../docs/versao-candidata-cronologias-fase5-38.json");
assert.equal(doc.fase,"5.41");
assert.equal(doc.checagem_workflows_fase540.aprovados,6);
assert.equal(doc.casos.length,3);
for(const [key,val] of Object.entries(doc.restricoes)) assert.equal(val,false,key);
for(const item of doc.casos){const c=candidate.casos.find(x=>x.id_caso===item.id_caso);assert.ok(c);const entry=c.acontecimentos.find(x=>x.indice===item.indice);assert.ok(entry);assert.equal(entry.aprovado,false);assert.equal(entry.publicavel,false);assert.equal(item.aplicado,false);assert.equal(item.aprovado,false);}
assert.equal(doc.casos.find(x=>x.indice===12).redacao_sugerida,null);
console.log("Fase 5.41: fontes registradas e publicacao bloqueada.");
