import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const pacote=JSON.parse(readFileSync(new URL("../docs/pacote-integracao-dyatlov-somerton-fase4-5.json",import.meta.url),"utf8"));
const codigo=readFileSync(new URL("../admin-v2/js/publication.js",import.meta.url),"utf8");
const {compileDossierForPublic}=await import("data:text/javascript;base64,"+Buffer.from(codigo).toString("base64"));
const guarda=readFileSync(new URL("../admin-v2/js/editorial-identity-guard.js",import.meta.url),"utf8");
const {verificarAlvoEditorial}=await import("data:text/javascript;base64,"+Buffer.from(guarda).toString("base64"));
assert.equal(pacote.status,"rascunho_editorial_nao_publicar");
assert.equal(pacote.integracoes.length,2);
for(const proposta of pacote.integracoes){
 assert.equal(proposta.identidade_alvo.estado,"nao_resolvido");
 assert.equal(proposta.identidade_alvo.id_banco_verificado,null);
 assert.equal(proposta.identidade_alvo.slug_verificado,null);
 assert.equal(proposta.caso_id,undefined,"ID legado não pode servir como alvo do banco");
 assert(Number.isInteger(proposta.id_legado));
 assert.equal(verificarAlvoEditorial(proposta,{id:proposta.id_legado,titulo:proposta.titulo,slug:"qualquer"}).ok,false);
}
for(const proposta of pacote.integracoes){
 const original={titulo:proposta.titulo,resumo:"Resumo original preservado",slug:"teste-"+proposta.id_legado,historia:"Narrativa original preservada",evidencias:["Evidência anterior"],conteudo_blocos:[{id:"original",tipo:"paragrafo",dados:{texto:"Conteúdo original"}}]};
 const snapshot=JSON.stringify(original);
 const comBloco=structuredClone(original);
 comBloco.conteudo_blocos.push(proposta.bloco);
 const compilado=compileDossierForPublic(comBloco);
 assert.equal(compilado.compatible,true,JSON.stringify(compilado.errors));
 assert.equal(compilado.row.historia,original.historia);
 assert.deepEqual(compilado.row.evidencias,original.evidencias);
 assert.equal(compilado.row.conteudo_blocos[0].id,"original");
 assert.equal(compilado.row.conteudo_blocos[1].tipo,"cronologia");
 assert.equal(compilado.row.conteudo_blocos[1].dados.itens.length,5);
 assert.equal(JSON.stringify(original),snapshot,"Original foi modificado");
 assert(proposta.revisao_historia?.correcao_proposta,"Correção deve permanecer em revisão separada");
 for(const item of proposta.bloco.dados.itens) {
  assert(item.data && item.descricao && item.natureza_documental && item.fonte,"Evento sem metadados mínimos");
  assert(/^https:\/\//.test(item.link_fonte),"Fonte precisa usar HTTPS");
 }
 console.log("Pacote editorial validado:",proposta.id_legado);
}
\nconst exemplo={identidade_alvo:{estado:"verificado",id_banco_verificado:90001,slug_verificado:"exemplo",titulo_exato:"Exemplo"}};\nassert.equal(verificarAlvoEditorial(exemplo,{id:90001,slug:"exemplo",titulo:"Exemplo"}).ok,true);\nfor (const incorreto of [{id:90002,slug:"exemplo",titulo:"Exemplo"},{id:90001,slug:"outro",titulo:"Exemplo"},{id:90001,slug:"exemplo",titulo:"Outro"}]) assert.equal(verificarAlvoEditorial(exemplo,incorreto).ok,false);\n