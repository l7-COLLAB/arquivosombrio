import assert from "node:assert/strict";
import{readFileSync}from"node:fs";
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),"utf8"));
const d=read("../docs/homologacao-isolada-cronologias-fase5-44.json");
const p=read("../docs/pacote-aprovacao-cronologias-fase5-42.json");
assert.equal(d.fase,"5.44");assert.equal(d.regressao_fase543.aprovados,6);
assert.equal(d.amostra.length,2);assert.equal(d.exclusoes.length,1);
for(const v of Object.values(d.controles))assert.equal(v,false);
for(const x of d.amostra){const q=p.itens.find(i=>i.id_caso===x.id_caso&&i.indice===x.indice);assert.ok(q);assert.equal(x.redacao,q.redacao_candidata);assert.equal(x.homologado,false);assert.equal(x.aplicado,false);}
assert.equal(d.exclusoes[0].indice,12);assert.equal(d.exclusoes[0].publicavel,false);
console.log("Fase 5.44: homologacao isolada preparada sem aprovacao ou publicacao.");
