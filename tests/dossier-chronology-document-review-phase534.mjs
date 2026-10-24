import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),"utf8"));
const audit=read("../docs/auditoria-individual-cronologias-fase5-34.json"),orig=read("../docs/previa-consolidada-cronologias-fase5-17.json");
const source=orig.cronologias.flatMap(c=>c.acontecimentos.map(e=>({id:c.id_origem,i:e.indice,text:e.texto_original,type:e.tipo_editorial})));
assert.equal(audit.itens.length,30);
assert.equal(audit.itens.filter(x=>x.tipo==="marco_temporal").length,29);
assert.equal(audit.itens.filter(x=>x.tipo==="nota_de_situacao").length,1);
assert.equal(new Set(audit.itens.map(x=>x.id_caso+":"+x.indice)).size,30);
for(const item of audit.itens){const o=source.find(x=>x.id===item.id_caso&&x.i===item.indice);assert(o);assert.equal(item.texto_original,o.text);assert.equal(item.tipo,o.type);assert.equal(item.aprovado,false);assert.equal(item.publicavel_automaticamente,false);assert(item.fonte_fase19.length+item.fonte_fase20.length>0)}
assert.equal(audit.itens.find(x=>x.id_caso===6&&x.indice===11).criticidade,"divergencia_de_data");
assert.equal(audit.itens.find(x=>x.id_caso===5&&x.indice===12).criticidade,"validar_andamento_processual");
console.log("30 linhas rastreáveis, sem aprovação automática.");
