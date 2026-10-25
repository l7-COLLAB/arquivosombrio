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

const originals=read("../docs/previa-consolidada-cronologias-fase5-17.json");
const all=candidateEntries();
function candidateEntries(){return read("../docs/versao-candidata-cronologias-fase5-38.json").casos.flatMap(c=>c.acontecimentos.map(e=>({...e,id_caso:c.id_caso})))}
assert.equal(all.length,30);
assert.equal(all.filter(e=>e.tipo==="marco_temporal").length,29);
assert.equal(all.filter(e=>e.tipo==="nota_de_situacao").length,1);
assert.equal(new Set(all.map(e=>e.id_caso+":"+e.indice)).size,30);
for(const e of all){
 const original=originals.cronologias.find(c=>c.id_origem===e.id_caso)?.acontecimentos.find(x=>x.indice===e.indice);
 assert.ok(original,"Origem ausente: "+e.id_caso+":"+e.indice);
 assert.equal(e.original,original.texto_original);
 assert.equal(e.publicavel,false);
 assert.equal(e.aprovado,false);
}
const note=all.find(e=>e.id_caso===5&&e.indice===12);
assert.equal(note.tipo,"nota_de_situacao");
assert.equal(note.publicavel,false);
assert.equal(note.aprovado,false);
assert.equal(all.filter(e=>e.alteracao_proposta).length,2);
console.log("Fase 5.44: homologacao isolada preparada sem aprovacao ou publicacao.");
