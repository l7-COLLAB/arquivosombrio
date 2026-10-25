import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const load=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),"utf8"));
const a=load("../docs/previa-segmentacao-cronologias-fase5-16.json"),b=load("../docs/previa-consolidada-cronologias-fase5-17.json");
assert.equal(b.estado,"previa_editorial_nao_publicavel");
let temporal=0,notes=0;
for(const c of b.cronologias){const original=a.cronologias.find(x=>x.id_origem===c.id_origem);assert.ok(original);assert.equal(c.acontecimentos.length,original.acontecimentos.length);
 for(const e of c.acontecimentos){const old=original.acontecimentos.find(x=>x.indice===e.indice);assert.equal(e.texto_original,old.texto_original);assert.equal(e.aprovado,false);assert.equal(e.publicavel_automaticamente,false);assert.equal(e.fonte_confirmada,null);assert.equal(e.data_confirmada,null);
 if(e.tipo_editorial==="marco_temporal"){temporal++;assert.equal(e.periodo_original+": "+e.descricao_original,e.texto_original)}else{notes++;assert.equal(e.tipo_editorial,"nota_de_situacao")}
 }}
assert.equal(temporal,29);assert.equal(notes,1);assert.deepEqual(b.referencias_auxiliares,a.referencias_auxiliares);
console.log("Prévia 5.17: 29 marcos, uma nota e duas referências preservados");
