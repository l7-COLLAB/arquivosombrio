import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
const path = new URL("../admin-v2/js/publication.js", import.meta.url);
const source = readFileSync(path, "utf8");
const moduleUrl = "data:text/javascript;base64," + Buffer.from(source).toString("base64");
const { compileDossierForPublic } = await import(moduleUrl);
const base = {titulo:"Dossiê",resumo:"Resumo documentado",slug:"dossie-teste",historia:"Narrativa",conteudo_blocos:[]};
const noDocs = compileDossierForPublic(base);
assert.equal(noDocs.compatible,true,"Avisos documentais não podem bloquear publicações antigas");
assert(noDocs.warnings.some(x=>x.includes("bloco de fontes")));
assert(noDocs.warnings.some(x=>x.includes("cronologia")));
assert(noDocs.warnings.some(x=>x.includes("sem documentos")));
const documented = compileDossierForPublic({...base,documentos:[{titulo:"Documento"}],evidencias:["Prova"],conteudo_blocos:[
{tipo:"fontes",dados:{texto:"Fonte"}},
{tipo:"cronologia",dados:{itens:["Evento"]}}
]});
assert.equal(documented.warnings.filter(x=>x.startsWith("Revisão documental:")).length,0);
assert.equal(documented.row.conteudo_blocos.length,2);
assert.equal(base.conteudo_blocos.length,0,"Não deve mutar o rascunho");
console.log("Auditoria editorial V2: testes aprovados.");
