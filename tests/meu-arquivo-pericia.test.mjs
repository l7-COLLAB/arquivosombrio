import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {JSDOM} from "jsdom";

const source = fs.readFileSync("js/pericia-progresso.js","utf8");
const quizSource=fs.readFileSync("js/pericia-trilha.js","utf8");
const panelSource=fs.readFileSync("js/meu-arquivo-pericia.js","utf8");
const normalize = (value)=>JSON.parse(JSON.stringify(value));

function domFor(html,url="https://arquivosombrio.net.br/meu-arquivo.html") {
  const dom = new JSDOM(html,{url,runScripts:"outside-only",pretendToBeVisual:true});
  dom.window.confirm=()=>true;
  dom.window.supabase={createClient:()=>mock.client};
  return dom;
}
let mock;
function mockSupabase(userId,rows=[]) {
  const saved=[];
  const subscribers=[];
  const client={
    auth:{
      getSession:async()=>({data:{session:userId?{user:{id:userId}}:null},error:null}),
      getUser:async()=>({data:{user:userId?{id:userId}:null},error:null}),
      onAuthStateChange:(fn)=>{subscribers.push(fn);return {data:{subscription:{unsubscribe(){}}}}}
    },
    from: (name)=>{
      assert.equal(name,"forensic_activity_progress");
      return {
        select:()=>({
          eq:async(field,value)=>{
            assert.equal(field,"user_id");assert.equal(value,userId);
            return {data:rows.map(x=>({...x})),error:null};
          }
        }),
        upsert:async(row,opts)=>{
          assert.equal(opts.onConflict,"user_id,activity_code");
          assert.equal(row.user_id,userId);
          saved.push(normalize(row));
          const n=rows.findIndex(x=>x.activity_code===row.activity_code);
          if(n>=0)rows[n]=normaliseRow(row);else rows.push(normaliseRow(row));
          return {data:null,error:null};
        }
      };
    }
  };
  const normaliseRow=row=>normalize(row);
  mock={client,saved,rows,subscribers};
  return mock;
}
const tick=()=>new Promise(resolve=>setTimeout(resolve,35));

test("validação de três estados rejeita estrutura adulterada e pontuação não cria certificado",()=>{
  const dom=domFor("<main></main>");
  dom.window.eval(source);
  const api=dom.window.ArquivoPericiaProgresso;
  assert.equal(api.normalise("trilha",{index:0,answers:[8]}),null);
  assert.equal(api.normalise("trilha",{index:4,answers:[0]}),null);
  assert.equal(api.normalise("custodia",{order:[1,1,2,3,4],sorted:true}),null);
  assert.equal(api.normalise("papiloscopia",{reference:"r24",compared:true}).compared,false);
  assert.deepEqual(normalize(api.metrics("trilha",{index:9,answers:[0,2,1,3,0,2,1,3,0]})),
    {steps:9,score:90,completed:true});
  assert.equal(api.metrics("custodia",{sorted:true,order:[0,1,2,3,4]}).steps,1);
  assert.equal(api.metrics("papiloscopia",{reference:"r17",compared:true,complete:true}).completed,true);
  dom.window.close();
});

test("visitante sem login mantém respostas locais e não grava na nuvem",async()=>{
  mockSupabase(null);
  const dom=domFor(fs.readFileSync("laboratorio-forense.html","utf8"),
    "https://arquivosombrio.net.br/laboratorio-forense.html");
  dom.window.localStorage.setItem("arquivo-sombrio-pericia-trilha-v1",JSON.stringify({index:2,answers:[0,2]}));
  dom.window.eval(source);dom.window.eval(quizSource);
  dom.window.document.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
  await tick();
  const bridge=dom.window.ArquivoPericiaProgresso;
  assert.equal(bridge.isAccountActive(),false);
  assert.match(dom.window.document.getElementById("quest-counter").textContent,/2 \/ 9/);
  assert.equal(mock.saved.length,0);
  assert.deepEqual(normalize(JSON.parse(dom.window.localStorage.getItem("arquivo-sombrio-pericia-trilha-v1"))),
    {index:2,answers:[0,2]});
  dom.window.close();
});

test("conta autenticada retoma atividade do banco, sem importar a cópia do visitante",async()=>{
  const uid="11111111-1111-4111-8111-111111111111";
  mockSupabase(uid,[{activity_code:"trilha",state:{index:3,answers:[0,2,1]},
    best_steps:3,best_score:30,ever_completed:false}]);
  const dom=domFor(fs.readFileSync("laboratorio-forense.html","utf8"),
    "https://arquivosombrio.net.br/laboratorio-forense.html");
  dom.window.localStorage.setItem("arquivo-sombrio-pericia-trilha-v1",JSON.stringify({index:9,answers:Array(9).fill(1)}));
  dom.window.eval(source);dom.window.eval(quizSource);
  dom.window.document.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
  await tick();
  assert.equal(dom.window.ArquivoPericiaProgresso.isAccountActive(),true);
  assert.match(dom.window.document.getElementById("quest-counter").textContent,/3 \/ 9/);
  assert.equal(mock.saved.length,0,"Não importar conteúdo do visitante silenciosamente");
  assert.equal(JSON.parse(dom.window.localStorage.getItem("arquivo-sombrio-pericia-trilha-v1")).index,9);
  dom.window.close();
});

test("Meu Arquivo apresenta selos e importa a cópia local apenas após escolha do usuário",async()=>{
  const uid="22222222-2222-4222-8222-222222222222";
  mockSupabase(uid,[]);
  const dom=domFor(fs.readFileSync("meu-arquivo.html","utf8"));
  dom.window.localStorage.setItem("arquivo-sombrio-pericia-trilha-v1",JSON.stringify({index:3,answers:[0,2,1]}));
  dom.window.localStorage.setItem("arquivo-sombrio-custodia-v1",JSON.stringify({order:[0,1,2,3,4],sorted:true,complete:true}));
  dom.window.eval(source);dom.window.eval(panelSource);
  dom.window.document.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
  await tick();
  const btn=dom.window.document.getElementById("forensic-import-local");
  assert.equal(btn.hidden,false);
  assert.equal(mock.saved.length,0);
  btn.click();
  await tick();
  assert.equal(mock.saved.length,2);
  assert.equal(dom.window.document.getElementById("forensic-awards").textContent,"2");
  assert.equal(dom.window.localStorage.getItem("arquivo-sombrio-custodia-v1"),null);
  assert.equal(dom.window.localStorage.getItem("arquivo-sombrio-pericia-trilha-v1"),null);
  assert.match(dom.window.document.getElementById("forensic-personal-status").textContent,/importada/);
  dom.window.close();
});

test("arquivos públicos utilizam cliente publicável e o Meu Arquivo não publica selos de terceiros",()=>{
  const member=fs.readFileSync("meu-arquivo.html","utf8");
  const quiz=fs.readFileSync("laboratorio-forense.html","utf8");
  const print=fs.readFileSync("pericia-papiloscopia.html","utf8");
  const custody=fs.readFileSync("pericia-custodia.html","utf8");
  for(const html of [quiz,print,custody]) {
    assert.ok(html.indexOf("js/pericia-progresso.js")<html.indexOf("js/pericia-trilha.js") || html.indexOf("js/pericia-progresso.js")<html.indexOf("js/pericia-novos-modulos.js"));
    assert.ok(html.includes("data-forensic-sync-status"));
  }
  assert.ok(member.includes('id="conquistas-pericia"'));
  assert.ok(member.includes('href="#conquistas-pericia"'));
  assert.ok(member.includes('js/meu-arquivo-pericia.js'));
  assert.ok(source.includes("sb_publishable_"));
  assert.ok(!source.includes("service_role"));
  assert.ok(!source.includes("sb_secret_"));
  const migration=fs.readFileSync("supabase/migrations/20261104190000_forensic_activity_progress_private_rls.sql","utf8");
  assert.match(migration,/enable row level security/i);
  assert.match(migration,/user_id = \(select auth.uid\(\)\)/i);
  assert.match(migration,/revoke all.*anon/i);
  const tighten=fs.readFileSync("supabase/migrations/20261104190100_forensic_progress_restrict_extra_grants.sql","utf8");
  assert.match(tighten,/revoke all.*authenticated/i);
});
