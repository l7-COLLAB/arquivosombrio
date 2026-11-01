import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const root=new URL("../",import.meta.url);
const backend=fs.readFileSync(new URL("supabase/functions/editorial-participation/index.ts",root),"utf8");
const frontend=fs.readFileSync(new URL("admin-v2/js/newsletter-sender-health.js",root),"utf8");
const html=fs.readFileSync(new URL("admin-v2/newsletter.html",root),"utf8");
function setup({admin=false,token="admin-jwt",response={ok:true,available:false,activation_flag:false,api_key_present:false,sender_configured:false,provider:{state:"nao_configurado"}},status=200}={}){
 const handlers={},elements={};
 const make=(id)=>({id,textContent:"",disabled:id==="check-sender",children:[],addEventListener(type,callback){handlers[id+":"+type]=callback;},replaceChildren(){this.children=[];},appendChild(el){this.children.push(el);}});
 ["check-sender","sender-health","sender-checks"].forEach(id=>elements[id]=make(id));
 let onReady,calls=[];
 const document={readyState:"loading",getElementById(id){return elements[id]||null;},createElement(tag){return make(tag);},addEventListener(type,callback){if(type==="DOMContentLoaded")onReady=callback;}};
 const window={supabase:{createClient(){return {auth:{
  async getUser(){return {data:{user:admin?{app_metadata:{role:"admin"}}:{app_metadata:{role:"reader"}}}};},
  async getSession(){return {data:{session:{access_token:token}}};}
 }}}}};
 const fetch=async(url,opts)=>{calls.push({url,opts});return {ok:status>=200&&status<300,status,json:async()=>response};};
 vm.runInNewContext(frontend,{window,document,fetch,console});
 return {elements,calls,start:()=>onReady(),refresh:()=>handlers["check-sender:click"]()};
}
async function settle(){await new Promise(resolve=>setImmediate(resolve));await new Promise(resolve=>setImmediate(resolve));}
test("readers cannot query privileged diagnostics",async()=>{
 const x=setup({admin:false});x.start();await settle();
 assert.equal(x.calls.length,0);
 assert.match(x.elements["sender-health"].textContent,/Acesso restrito/);
});
test("admin token stays in request header; diagnostics do not send recipients",async()=>{
 const x=setup({admin:true});x.start();await settle();
 assert.equal(x.calls.length,1);
 assert.equal(x.calls[0].opts.headers.Authorization,"Bearer admin-jwt");
 assert.deepEqual(JSON.parse(x.calls[0].opts.body),{kind:"newsletter_admin_diagnostics"});
 assert.match(x.elements["sender-health"].textContent,/bloqueadas/);
 assert.match(x.elements["sender-checks"].children.map(e=>e.textContent).join(" "),/Chave do provedor/);
 assert.doesNotMatch(frontend,/RESEND_API_KEY\s*=/);
});
test("diagnostics are informational and never send emails or edit secrets",()=>{
 assert.match(backend,/kind==="newsletter_admin_diagnostics"/);
 assert.match(backend,/db\.auth\.getUser\(tokenValue\)/);
 assert.match(backend,/user\.app_metadata\?\.role!=="admin"/);
 assert.match(backend,/newsletter_admin_diagnostics.*30/);
 assert.match(backend,/https:\/\/api\.resend\.com\/domains\?limit=100/);
 assert.match(backend,/api_key_present:Boolean\(apiKey\)/);
 assert.match(backend,/provider/);
 assert.doesNotMatch(frontend,/api\.resend\.com\/emails/);
 assert.doesNotMatch(frontend,/delete.*resend|api_key.+textContent/);
 assert.match(html,/id="check-sender"/);
 assert.match(html,/noindex,nofollow/);
});
test("missing API key and insufficient-scoped Resend keys remain explicitly unverified",()=>{
 assert.match(backend,/if\(!apiKey \|\| !domainName\)return \{state:"nao_configurado"\}/);
 assert.match(backend,/response\.status===401\|\|response\.status===403/);
 assert.match(backend,/state:"sem_permissao"/);
 assert.match(backend,/senderVerified=status==="verified" && caps\.sending==="enabled"/);
});
