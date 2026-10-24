import assert from "node:assert/strict";
import{readFileSync}from"node:fs";
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),"utf8"));
const pack=read("../docs/pacote-aprovacao-cronologias-fase5-42.json");
const previous=read("../docs/revisao-documental-cronologias-fase5-41.json");
const candidate=read("../docs/versao-candidata-cronologias-fase5-38.json");
assert.equal(pack.fase,"5.42");
assert.equal(pack.regressao_fase541.aprovados,6);
assert.equal(pack.itens.length,3);
for(const v of Object.values(pack.controles))assert.equal(v,false);
for(const p of pack.itens){
 const old=previous.casos.find(x=>x.id_caso===p.id_caso&&x.indice===p.indice);
 assert.ok(old);assert.equal(p.redacao_candidata,old.redacao_sugerida);
 assert.equal(p.aprovacao_humana,false);assert.equal(p.aplicacao,false);
 const entry=candidate.casos.find(x=>x.id_caso===p.id_caso).acontecimentos.find(x=>x.indice===p.indice);
 assert.equal(entry.publicavel,false);assert.equal(entry.aprovado,false);
}
assert.equal(pack.itens.find(x=>x.indice===12).redacao_candidata,null);
console.log("Fase 5.42: pacote preservado; homologacao, merge e publicacao bloqueados.");
