import assert from "node:assert/strict";import{readFileSync}from"node:fs";const load=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),"utf8"));const d=load("../docs/decisoes-individuais-cronologias-fase5-46.json");const old=load("../docs/revisao-comparativa-cronologias-fase5-45.json");assert.equal(d.fase,"5.46");assert.equal(d.decisoes.length,2);for(const x of d.decisoes){const o=old.comparacoes.find(y=>y.id_caso===x.id_caso&&y.indice===x.indice);assert.ok(o);assert.equal(x.original,o.original);assert.equal(x.proposta,o.candidata);assert.equal(x.decisao,"pendente");assert.equal(x.aplicado,false);assert.equal(x.responsavel,null);assert.deepEqual(x.opcoes_permitidas,["aprovar","rejeitar","solicitar_revisao"]);}for(const v of Object.values(d.restricoes))assert.equal(v,false);assert.equal(d.nota_bloqueada.aplicado,false);
const keys=d.decisoes.map(x=>x.id_caso+":"+x.indice);
assert.equal(new Set(keys).size,2,"Decisoes duplicadas");
const forms=load("../docs/registro-decisoes-editoriais-fase5-47.json");
for(const x of d.decisoes){
 const original=old.comparacoes.find(y=>y.id_caso===x.id_caso&&y.indice===x.indice);
 const form=forms.formularios.find(y=>y.id_caso===x.id_caso&&y.indice===x.indice);
 assert.ok(form);
 assert.equal(x.fonte,original.fonte);
 assert.equal(form.fonte,x.fonte);
 for(const field of ["responsavel","data_decisao","justificativa"]){
  assert.equal(x[field],null,field);
  assert.equal(form[field],null,field);
 }
 assert.equal(form.decisao,"pendente");
 assert.equal(form.aplicado,false);
}
assert.equal(d.nota_bloqueada.id_caso,5);
assert.equal(d.nota_bloqueada.indice,12);
assert.equal(d.nota_bloqueada.decisao,"excluida_da_publicacao");
assert.equal(forms.exclusao.publicavel,false);
console.log("Fase 5.46: decisões independentes pendentes e publicação bloqueada.");
