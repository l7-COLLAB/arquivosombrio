import {validateEditorialDecision} from "../admin-v2/js/editorial-decision-validator.js";
import assert from "node:assert/strict";import{readFileSync}from"node:fs";const load=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),"utf8"));const d=load("../docs/registro-decisoes-editoriais-fase5-47.json");const prev=load("../docs/decisoes-individuais-cronologias-fase5-46.json");assert.equal(d.fase,"5.47");assert.equal(d.regressao_fase546.aprovados,6);assert.equal(d.formularios.length,2);for(const f of d.formularios){const p=prev.decisoes.find(x=>x.id_caso===f.id_caso&&x.indice===f.indice);assert.ok(p);assert.equal(f.fonte,p.fonte);assert.equal(f.decisao,"pendente");assert.equal(f.responsavel,null);assert.equal(f.data_decisao,null);assert.equal(f.justificativa,null);assert.equal(f.aplicado,false);}assert.deepEqual(d.validacao.campos_obrigatorios_para_decisao,["responsavel","data_decisao","justificativa"]);assert.equal(d.exclusao.publicavel,false);for(const v of Object.values(d.autorizacoes))assert.equal(v,false);console.log("Fase 5.47: registros pendentes, sem autorização de publicação.");

// Contrato entre os formulários documentais e o validador efetivo do Admin V2.
assert.equal(new Set(d.formularios.map(f=>f.id_caso+":"+f.indice)).size,2);
for(const form of d.formularios){
 assert.equal(validateEditorialDecision(form).valid,false);
 const missing=validateEditorialDecision({...form,decisao:"aprovar"});
 assert.equal(missing.valid,false);
 for(const error of ["responsavel_obrigatorio","data_invalida","justificativa_obrigatoria"])assert.ok(missing.errors.includes(error));
}
const validFixture={decisao:"aprovar",responsavel:"Revisor ficticio",data_decisao:"2026-10-24",justificativa:"Exemplo sintético para testes; não constitui autorização real"};
assert.equal(validateEditorialDecision(validFixture).valid,true);
assert.equal(validateEditorialDecision({...validFixture,data_decisao:"2026-02-30"}).valid,false);
assert.equal(d.exclusao.id_caso,5);
assert.equal(d.exclusao.indice,12);
