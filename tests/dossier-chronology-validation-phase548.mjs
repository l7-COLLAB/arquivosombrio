import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateEditorialDecision} from "../admin-v2/js/editorial-decision-validator.js";
const registry=JSON.parse(readFileSync(new URL("../docs/registro-decisoes-editoriais-fase5-47.json",import.meta.url),"utf8"));
assert.equal(registry.formularios.length,2);
for(const f of registry.formularios)assert.equal(validateEditorialDecision(f).valid,false);
const good={decisao:"aprovar",responsavel:"Revisor de teste",data_decisao:"2026-10-24",justificativa:"Validação simulada, não é aprovação real."};
assert.equal(validateEditorialDecision(good).valid,true);
for(const key of ["responsavel","data_decisao","justificativa"]){const bad={...good,[key]:null};assert.equal(validateEditorialDecision(bad).valid,false,key);}
for(const value of ["rejeitar","solicitar_revisao"])assert.equal(validateEditorialDecision({...good,decisao:value}).valid,true);
for(const value of ["pendente","liberado",""])assert.equal(validateEditorialDecision({...good,decisao:value}).valid,false);
assert.equal(validateEditorialDecision({...good,data_decisao:"2026-02-30"}).valid,false);
assert.equal(registry.exclusao.publicavel,false);
for(const val of Object.values(registry.autorizacoes))assert.equal(val,false);

const invalids=[
 null,undefined,{},[],{...good,decisao:"pendente"},
 {...good,responsavel:"   "},{...good,justificativa:"   "},
 {...good,data_decisao:"2026-02-29"},
 {...good,data_decisao:"2026-13-01"},
 {...good,data_decisao:"2026-10-24T00:00:00Z"},
 {...good,decisao:"publicar"}
];
for(const sample of invalids)assert.equal(validateEditorialDecision(sample).valid,false,"Entrada invalida aceita");
const ids=registry.formularios.map(f=>f.id_caso+":"+f.indice);
assert.equal(new Set(ids).size,2);
for(const form of registry.formularios){
 assert.equal(form.decisao,"pendente");
 for(const required of registry.validacao.campos_obrigatorios_para_decisao)assert.equal(form[required],null);
 assert.equal(form.aplicado,false);
}
assert.equal(registry.exclusao.id_caso,5);
assert.equal(registry.exclusao.indice,12);
console.log("Fase 5.48: aprovações incompletas rejeitadas; nenhuma publicação autorizada.");
