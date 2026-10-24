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

const approval=read("../docs/pacote-aprovacao-cronologias-fase5-42.json");
const originals=read("../docs/previa-consolidada-cronologias-fase5-17.json");
assert.equal(approval.itens.length,3);
assert.equal(new Set(p.comparacoes.map(x=>x.id_caso+":"+x.indice)).size,2);
for(const entry of p.comparacoes){
 const approved=approval.itens.find(x=>x.id_caso===entry.id_caso&&x.indice===entry.indice);
 const source=originals.cronologias.find(x=>x.id_origem===entry.id_caso)?.acontecimentos.find(x=>x.indice===entry.indice);
 assert.ok(approved);assert.ok(source);
 assert.equal(entry.original,source.texto_original);
 assert.equal(entry.candidata,approved.redacao_candidata);
 assert.equal(entry.fonte,approved.fonte);
 assert.equal(approved.aprovacao_humana,false);
 assert.equal(approved.aplicacao,false);
}
const excluded=approval.itens.find(x=>x.id_caso===5&&x.indice===12);
assert.equal(p.pendencia.id_caso,5);
assert.equal(p.pendencia.indice,12);
assert.equal(excluded.redacao_candidata,null);
assert.equal(excluded.aprovacao_humana,false);
assert.equal(approval.auditoria_complementar_2026_10_24.cautelas.find(x=>x.id_caso===6).aprovado,false);
console.log("Fase 5.45: comparação íntegra; publicação bloqueada.");
