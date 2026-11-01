import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import fs from "node:fs";
const src=fs.readFileSync(new URL("../js/editorial-participation.js",import.meta.url),"utf8");
const confirmSource=fs.readFileSync(new URL("../js/confirmar-inscricao.js",import.meta.url),"utf8");
const edge=fs.readFileSync(new URL("../supabase/functions/editorial-participation/index.ts",import.meta.url),"utf8");
const sql=fs.readFileSync(new URL("../supabase/migrations/20261031_editorial_participation.sql",import.meta.url),"utf8");
function setupForm({ok=true,code=200,reply={ok:true},kind="fiction"}={}){
 const listeners={},states={};
 const field=(value,checked=false)=>({value,checked});
 const values={
  pen_name:field("Autor Teste"),contact_email:field("autor@exemplo.org"),
  title:field("Título original"),genre:field("terror"),
  synopsis:field("Uma sinopse suficientemente longa para a curadoria. ".repeat(4)),
  manuscript_excerpt:field("Trabalho literário original com conteúdo fictício. ".repeat(15)),
  rights_declaration:field("",true),adult_declaration:field("",true),consent_review:field("",true),
  website:field(""),email:field("leitor@exemplo.org"),consent:field("",true)
 };
 const button={disabled:false},status={textContent:"",classList:{toggle:()=>{}}};
 const form={dataset:{},reportValidity(){return true},querySelector:()=>button,
  elements:{namedItem:k=>values[k]},reset(){states.reset=true},
  addEventListener(name,cb){listeners[name]=cb;}};
 const document={
  readyState:"loading",
  getElementById(id){return id==="fiction-form"||id==="newsletter-form"?form:status},
  addEventListener(name,cb){if(name==="DOMContentLoaded")states.init=cb;}
 };
 let calls=[];
 const context=vm.createContext({document,fetch:async(_url,opts)=>{
  calls.push(JSON.parse(opts.body));
  return {ok,status:code,json:async()=>reply};
 },console});
 vm.runInContext(src,context);
 states.init();
 return {submit:()=>listeners.submit({preventDefault(){}}),values,calls,form,button,status,states};
}
test("does not claim fiction delivery before verified JSON success",async()=>{
 const a=setupForm({ok:true,reply:{ok:true}});
 await a.submit();
 assert.equal(a.calls.length,1);
 assert.equal(a.calls[0].kind,"fiction");
 assert.equal(a.calls[0].rights_declaration,true);
 assert.equal(a.states.reset,true);
 assert.match(a.status.textContent,/recebido para avaliação/);
 const b=setupForm({ok:true,reply:{error:"not saved"}});
 await b.submit();
 assert.equal(b.states.reset,undefined);
 assert.match(b.status.textContent,/Não foi possível/);
});
test("server errors preserve manuscript contents",async()=>{
 const f=setupForm({ok:false,code:503,reply:{error:"Serviço indisponível"}});
 await f.submit();
 assert.equal(f.values.manuscript_excerpt.value.length>500,true);
 assert.equal(f.states.reset,undefined);
 assert.match(f.status.textContent,/indisponível/);
 assert.equal(f.button.disabled,false);
});
test("validates excerpt and synopsis lengths before transmission",async()=>{
 const f=setupForm();
 f.values.manuscript_excerpt.value="Curto";
 await f.submit();
 assert.equal(f.calls.length,0);
 assert.match(f.status.textContent,/500 a 18.000/);
});
test("newsletter needs checked consent and only succeeds after server confirmation",async()=>{
 const f=setupForm({reply:{ok:true,email_sent:true}});
 await f.submit();
 assert.equal(f.calls[0].kind,"fiction"); // the first handler bound to the fixture is shared
 assert.match(src,/consent:inputs\.namedItem\("consent"\)\.checked/);
 assert.match(src,/data\.ok!==true/);
 assert.match(confirmSource,/newsletter_confirm/);
 assert.match(confirmSource,/newsletter_cancel/);
 assert.match(confirmSource,/addEventListener\("click"/);
});
test("private tables use RLS and keep anonymous/regular users out",()=>{
 assert.match(sql,/editorial_fiction_submissions enable row level security/i);
 assert.match(sql,/editorial_newsletter_subscribers enable row level security/i);
 assert.match(sql,/revoke all on public\.editorial_fiction_submissions from anon, authenticated/i);
 assert.match(sql,/is_arquivo_sombrio_admin\(\)/);
 assert.doesNotMatch(sql,/grant insert .* to anon/i);
 assert.match(sql,/rights_declaration.*true/);
 assert.match(sql,/status.*'recebido'/);
});
test("Edge function rejects unintended publication and unconfirmed campaigns",()=>{
 assert.match(edge,/status:"pendente"/);
 assert.match(edge,/status:"confirmado"/);
 assert.match(edge,/RESEND_API_KEY/);
 assert.match(edge,/NEWSLETTER_FROM_EMAIL/);
 assert.match(edge,/security_consume_rate_limit/);
 assert.match(edge,/case_id|fingerprint/);
 assert.doesNotMatch(edge,/\.from\("(?:novels|Casos|casos_diarios|novel_biblioteca)"\)/);
});
test("admin review cannot automatically publish manuscripts into the public library",()=>{
 const admin=fs.readFileSync(new URL("../admin-v2/js/curadoria-ficcao.js",import.meta.url),"utf8");
 assert.match(admin,/app_metadata\?\.role!=="admin"/);
 assert.match(admin,/editorial_fiction_submissions/);
 assert.doesNotMatch(admin,/from\("(?:novels|novel_capitulos|Casos)"\)/);
 assert.match(admin,/textContent=String\(text\|\|""\)/);
});
