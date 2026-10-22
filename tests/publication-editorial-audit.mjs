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
const refs = compileDossierForPublic({...base,conteudo_blocos:[{tipo:"cronologia",dados:{itens:[
 {data:"1941",descricao:"Fato fictício",fonte:"Relatório",link_fonte:"javascript:alert(1)"},
 {data:"1942",descricao:"Documento",fonte:"Relatório",link_fonte:"https://example.org/relatorio"},
 {data:"1943",descricao:"Mesmo documento",fonte:"Relatório",link_fonte:"https://example.org/relatorio"},
 {data:"1944",descricao:"Fonte física",fonte:"Arquivo presencial"},
 {data:"1945",descricao:"Link isolado",link_fonte:"https://example.org/sem-metadados"}
]}}]});
assert.equal(refs.compatible,true,"Avisos não devem bloquear a publicação");
assert(refs.warnings.some(w=>w.includes("URL da fonte inválida")));
assert(refs.warnings.some(w=>w.includes("URL de fonte repetida")));
assert(refs.warnings.some(w=>w.includes("referência sem link verificável")));
assert(refs.warnings.some(w=>w.includes("link sem identificação")));
assert.equal(refs.row.conteudo_blocos[0].dados.itens.length,5,"Auditoria não pode retirar eventos");
console.log("Auditoria editorial V2: testes aprovados.");
