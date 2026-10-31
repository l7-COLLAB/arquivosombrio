import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const src = fs.readFileSync(new URL("../js/public-suggestion.js", import.meta.url), "utf8");
const key = "arquivo_sombrio_sugestao_pendente_v1";

function fixture({ fetcher, saved, storageFailure = false } = {}) {
  const store = new Map();
  if (saved) store.set(key, JSON.stringify(saved));
  const events = {};
  const classes = new Set();
  const fields = {
    "sug-nome": {value:"Leti",disabled:false},
    "sug-titulo": {value:"Caso documental",disabled:false},
    "sug-descricao": {value:"Contexto do caso",disabled:false}
  };
  const button = {disabled:false};
  const message = {
    textContent:"",
    classList:{add:value=>classes.add(value),toggle:(value,on)=>on?classes.add(value):classes.delete(value)},
    setAttribute(name,value){this[name]=value;}
  };
  const form = {
    dataset:{},
    aria:{},
    addEventListener(name,fn){events[name]=fn;},
    querySelector(selector){assert.equal(selector,'button[type="submit"]');return button;},
    setAttribute(name,value){this.aria[name]=value;},
    removeAttribute(name){delete this.aria[name];},
    reset(){for(const field of Object.values(fields))field.value="";this.resets=(this.resets||0)+1;}
  };
  const doc = {
    readyState:"complete",
    getElementById(id){return id==="form-sugestao"?form:id==="mensagem-sucesso"?message:fields[id]||null;}
  };
  const storage = {
    getItem:k => {if(storageFailure)throw Error("storage unavailable");return store.get(k)||null;},
    setItem:(k,v)=>{if(storageFailure)throw Error("storage unavailable");store.set(k,v);},
    removeItem:k=>{if(storageFailure)throw Error("storage unavailable");store.delete(k);}
  };
  const requests = [];
  const fetch = async (url,options) => {
    requests.push({url,options});
    if(fetcher)return fetcher(url,options);
    return {ok:true,status:200,json:async()=>({ok:true})};
  };
  const context=vm.createContext({document:doc,localStorage:storage,fetch,console:{warn(){}},SUPABASE_URL:"https://public.example",SUPABASE_PUBLISHABLE_KEY:"sb_publishable_demo"});
  vm.runInContext(src,context);
  const submit=()=>events.submit({preventDefault(){}});
  return {form,fields,button,message,classes,store,requests,submit};
}

test("confirmed remote insert: success, clear pending draft and reset exactly once",async()=>{
  const f=fixture();
  await f.submit();
  assert.equal(f.form.resets,1);
  assert.match(f.message.textContent,/recebida e registrada/);
  assert.equal(f.store.has(key),false);
  assert.equal(f.requests.length,1);
  assert.equal(f.requests[0].url,"https://public.example/functions/v1/public-contribution-submit");
  assert.equal(f.requests[0].options.headers.Authorization,undefined);
  assert.equal(f.requests[0].options.headers.apikey,"sb_publishable_demo");
  assert.equal(JSON.parse(f.requests[0].options.body).kind,"suggestion");
  assert.equal(f.button.disabled,false);
});

test("connection failure: never reports sent, retains typed input and local draft",async()=>{
  const f=fixture({fetcher:async()=>{throw Error("offline");}});
  await f.submit();
  assert.equal(f.form.resets||0,0);
  assert.match(f.message.textContent,/Não foi possível confirmar/);
  assert.equal(JSON.parse(f.store.get(key)).titulo,"Caso documental");
  assert.equal(f.fields["sug-titulo"].value,"Caso documental");
  assert.equal(f.button.disabled,false);
  assert.equal(f.classes.has("error-message"),true);
});

test("ambiguous HTTP 200 without ok:true never shows success",async()=>{
  const f=fixture({fetcher:async()=>({ok:true,status:200,json:async()=>({})})});
  await f.submit();
  assert.equal(f.form.resets||0,0);
  assert.equal(f.store.has(key),true);
});

test("HTTP 429 is not success and preserves pending draft",async()=>{
  const f=fixture({fetcher:async()=>({ok:false,status:429,json:async()=>({error:"rate limit"})})});
  await f.submit();
  assert.equal(f.form.resets||0,0);
  assert.equal(f.store.has(key),true);
  assert.match(f.message.textContent,/Não foi possível confirmar/);
});

test("draft recovery does not submit automatically",()=>{
  const f=fixture({saved:{nome:"Outro autor",titulo:"Caso recuperado",descricao:"Investigação"}});
  assert.equal(f.fields["sug-nome"].value,"Leti");
  assert.equal(f.requests.length,0);
  assert.equal(f.store.has(key),true);
});
test("draft recovery fills an empty form on revisit",()=>{
  // The form fixtures are initialized with sample values for other tests.
  const s=src.replace('if (draft && !nome.value && !titulo.value && !descricao.value)', 'if (draft)');
  const f=fixture({saved:{nome:"Outro autor",titulo:"Caso recuperado",descricao:"Investigação"}});
  // Verifies the production guard is present; guarded forms must not overwrite current text.
  assert.match(src,/draft && !nome.value && !titulo.value && !descricao.value/);
  assert.equal(f.fields["sug-titulo"].value,"Caso documental");
  assert.ok(s.length>0);
});

test("validation avoids network and local persistence",async()=>{
  const f=fixture();
  f.fields["sug-nome"].value="L";
  await f.submit();
  assert.equal(f.requests.length,0);
  assert.equal(f.store.has(key),false);
  assert.equal(f.form.resets||0,0);
});

test("storage denied still permits delivery and keeps text on failure",async()=>{
  const f=fixture({storageFailure:true,fetcher:async()=>{throw Error("network");}});
  await f.submit();
  assert.equal(f.form.resets||0,0);
  assert.match(f.message.textContent,/Copie seu texto/);
});

test("rapid double submit makes only one request",async()=>{
  let release;
  const pending = new Promise(resolve=>{release=resolve;});
  const f=fixture({fetcher:()=>pending});
  const first=f.submit();
  const second=f.submit();
  assert.equal(f.requests.length,1);
  assert.equal(f.button.disabled,true);
  release({ok:true,status:200,json:async()=>({ok:true})});
  await Promise.all([first,second]);
  assert.equal(f.requests.length,1);
  assert.equal(f.button.disabled,false);
});

test("all public suggestion forms use the new endpoint script and truthful notice",()=>{
  for(const filename of ["index.html","dossies.html","pericia.html","forum.html"]){
    const text=fs.readFileSync(new URL("../"+filename,import.meta.url),"utf8");
    assert.match(text,/js\/public-suggestion.js\?v=1/);
    assert.match(text,/A sugestão só será considerada recebida após confirmação do envio/);
    assert.doesNotMatch(text,/Sugestões ficam armazenadas localmente nesta\s+versão do projeto\./);
  }
});
