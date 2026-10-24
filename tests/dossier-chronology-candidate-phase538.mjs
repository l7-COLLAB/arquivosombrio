import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),"utf8"));
const candidate=read("../docs/versao-candidata-cronologias-fase5-38.json");
const originals=read("../docs/previa-consolidada-cronologias-fase5-17.json");
const proposals=read("../docs/propostas-correcao-editorial-fase5-37.json");
assert.equal(candidate.publicacao_autorizada,false);
assert.equal(candidate.gravacao_supabase_autorizada,false);
const entries=candidate.casos.flatMap(c=>c.acontecimentos.map(e=>({id:c.id_caso,...e})));
assert.equal(entries.length,30);
assert.equal(entries.filter(e=>e.tipo==="marco_temporal").length,29);
assert.equal(entries.filter(e=>e.tipo==="nota_de_situacao").length,1);
assert.equal(entries.filter(e=>e.alteracao_proposta).length,2);
for(const e of entries){
 const original=originals.cronologias.find(c=>c.id_origem===e.id).acontecimentos.find(x=>x.indice===e.indice);
 assert.equal(e.original,original.texto_original);
 assert.equal(e.publicavel,false);
 assert.equal(e.aprovado,false);
 const p=proposals.propostas.find(x=>x.id_caso===e.id&&x.indice===e.indice);
 assert.equal(e.texto_candidato,p?.proposta||original.texto_original);
}
assert.equal(entries.find(e=>e.id===5&&e.indice===12).alteracao_proposta,false);
console.log("Versão candidata: 30 entradas preservadas e publicação bloqueada.");
