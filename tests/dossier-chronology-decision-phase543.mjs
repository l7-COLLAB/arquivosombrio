import assert from "node:assert/strict";
import{readFileSync}from"node:fs";
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),"utf8"));
const check=read("../docs/checklist-decisao-editorial-fase5-43.json");
const pack=read("../docs/pacote-aprovacao-cronologias-fase5-42.json");
assert.equal(check.fase,"5.43");assert.equal(check.regressao_anterior.testes_aprovados,6);
assert.equal(check.criterios.length,5);assert.ok(check.criterios.every(c=>c.concluido===false));
assert.equal(check.decisoes.length,pack.itens.length);
for(const a of Object.values(check.autorizacoes))assert.equal(a,false);
assert.equal(check.rollback.testes_de_recuperacao_executados,false);
for(const d of check.decisoes){assert.ok(pack.itens.some(p=>p.id_caso===d.id_caso&&p.indice===d.indice));}
assert.equal(check.decisoes.find(x=>x.indice===12).decisao,"excluir_da_publicacao");
console.log("Fase 5.43: checklist e rollback documentados; autorizacoes bloqueadas.");
