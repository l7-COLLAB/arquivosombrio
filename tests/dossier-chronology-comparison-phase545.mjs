import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),"utf8"));
const p=read("../docs/revisao-comparativa-cronologias-fase5-45.json");
const iso=read("../docs/homologacao-isolada-cronologias-fase5-44.json");
const candidate=read("../docs/versao-candidata-cronologias-fase5-38.json");
assert.equal(p.fase,"5.45");
assert.equal(p.regressao_fase544.aprovados,6);
assert.equal(p.comparacoes.length,2);
for(const v of Object.values(p.autorizacoes))assert.equal(v,false);
for(const entry of p.comparacoes){
const original=candidate.casos.find(c=>c.id_caso===entry.id_caso).acontecimentos.find(e=>e.indice===entry.indice);
const sample=iso.amostra.find(e=>e.id_caso===entry.id_caso&&e.indice===entry.indice);
assert.equal(entry.original,original.original);
assert.equal(entry.candidata,sample.redacao);
assert.equal(entry.aplicado,false);
assert.equal(entry.homologado,false);
}
assert.equal(p.pendencia.candidata,null);
assert.equal(p.pendencia.publicavel,false);
console.log("Fase 5.45: comparação íntegra; publicação bloqueada.");
