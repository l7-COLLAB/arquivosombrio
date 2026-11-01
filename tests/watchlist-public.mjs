import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import fs from "node:fs";
const script=fs.readFileSync(new URL("../js/watchlist-public.js",import.meta.url),"utf8");
function fixture({user={id:"user-1"},insertError=null}={}){
 let click,redirect="",calls=[];
 const output={textContent:""};
 const btn={
  disabled:false,textContent:"Acompanhar",dataset:{},parentElement:{querySelector(){return output;}},
  getAttribute(n){return {"data-watch-type":"dossie","data-watch-id":"42","data-watch-title":"Dossiê 42"}[n];}
 };
 const client={auth:{getUser:async()=>({data:{user},error:null})},from(name){
  assert.equal(name,"user_watchlist");
  return {insert:async payload=>{calls.push(payload);return {error:insertError};}};
 }};
 const context=vm.createContext({
  document:{addEventListener:(name,fn)=>{if(name==="click")click=fn;}},
  window:{supabase:{createClient:()=>client},location:{assign:p=>{redirect=p;}}},
  console:{warn(){}},obterClienteSupabase:undefined
 });
 vm.runInContext(script,context);
 const fire=async()=>{click({target:{closest:()=>btn}});await new Promise(resolve=>setImmediate(resolve));await new Promise(resolve=>setImmediate(resolve));};
 return {btn,output,calls,fire,get redirect(){return redirect;}};
}
test("successful follow persists owned case reference with canonical URL",async()=>{
 const f=fixture();await f.fire();
 assert.equal(f.calls.length,1);
 const p=f.calls[0];
 assert.equal(p.user_id,"user-1");
 assert.equal(p.case_id,"dossie:42");
 assert.equal(p.target_url,"/arquivo/caso-42.html");
 assert.equal(p.title,"Dossiê 42");
 assert.equal(f.btn.textContent,"Acompanhando");
 assert.equal(f.btn.disabled,true);
});
test("logged out does not write and provides login flow",async()=>{
 const f=fixture({user:null});await f.fire();
 assert.equal(f.calls.length,0);
 assert.equal(f.btn.textContent,"Entrar para acompanhar");
 assert.equal(f.btn.disabled,false);
 await f.fire();
 assert.equal(f.redirect,"/meu-arquivo.html#observacao");
});
test("duplicate is recognized, not reinserted repeatedly",async()=>{
 const f=fixture({insertError:{code:"23505"}});await f.fire();
 assert.equal(f.btn.textContent,"Acompanhando");
 assert.match(f.output.textContent,/já está/);
});
test("server error must not claim the case was followed",async()=>{
 const f=fixture({insertError:{code:"42501",message:"permission denied"}});await f.fire();
 assert.equal(f.btn.disabled,false);
 assert.notEqual(f.btn.textContent,"Acompanhando");
 assert.match(f.output.textContent,/Não foi possível confirmar/);
});
test("Meu Arquivo includes existing watchlist with explicit remove and open",()=>{
 const src=fs.readFileSync(new URL("../js/meu-arquivo.js",import.meta.url),"utf8");
 assert.match(src,/"user_watchlist"/);
 assert.match(src,/data-remove-watchlist/);
 assert.match(src,/renderizarObservacaoMeuArquivo/);
 assert.match(src,/normalizarLinkMeuArquivo\(item\.target_url\)/);
 assert.match(src,/carregarCasosObservacao\(\)/);
});
