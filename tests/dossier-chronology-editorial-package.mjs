import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const load=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),"utf8"));
const pack=load("../docs/pacote-editorial-cronologias-fase5-18.json");
const source=load("../docs/previa-consolidada-cronologias-fase5-17.json");
assert.equal(pack.status,"bloqueado_para_publicacao");
assert.equal(pack.integridade.marcos_separados,29);
assert.equal(pack.integridade.notas_separadas,1);
assert.equal(pack.integridade.referencias_auxiliares,2);
assert.equal(pack.integridade.eventos_origem,327);
assert.equal(pack.itens.length,source.cronologias.length);
for(const c of source.cronologias){
 const p=pack.itens.find(x=>x.id_referencia_somente_leitura===c.id_origem);
 assert.ok(p); assert.equal(p.aprovado,false);
 assert.equal(p.marcos,c.acontecimentos.filter(x=>x.tipo_editorial==="marco_temporal").length);
 assert.equal(p.notas,c.acontecimentos.filter(x=>x.tipo_editorial==="nota_de_situacao").length);
}
assert.ok(pack.regras.some(x=>x.includes("reversão")));
for(const r of pack.referencias)assert.equal(r.aprovado,false);
console.log("Pacote 5.18 bloqueado e contagens verificadas");
