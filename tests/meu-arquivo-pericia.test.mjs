import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {JSDOM} from "jsdom";

const source = fs.readFileSync("js/pericia-progresso.js","utf8");
const quizSource=fs.readFileSync("js/pericia-trilha.js","utf8");
const panelSource=fs.readFileSync("js/meu-arquivo-pericia.js","utf8");
const resumeSource=fs.readFileSync("js/pericia-retomada.js","utf8");
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

test("uma gravação pendente da própria conta é retomada ao abrir Meu Arquivo",async()=>{
  const uid="33333333-3333-4333-8333-333333333333";
  mockSupabase(uid,[]);
  const dom=domFor(fs.readFileSync("meu-arquivo.html","utf8"));
  const key="as-forensic-member-"+uid+"-papiloscopia";
  const state={compared:true,complete:true,reference:"r17",marks:true};
  dom.window.localStorage.setItem(key,JSON.stringify({pending:true,state}));
  dom.window.eval(source);
  dom.window.eval(panelSource);
  await tick();
  assert.equal(mock.saved.length,1);
  assert.equal(mock.saved[0].activity_code,"papiloscopia");
  assert.equal(mock.saved[0].ever_completed,true);
  assert.equal(dom.window.localStorage.getItem(key),null);
  assert.equal(dom.window.document.getElementById("forensic-awards").textContent,"1");
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


test("erro de autenticação não mantém conquistas da conta anterior visíveis",async()=>{
  const uid="44444444-4444-4444-8444-444444444444";
  mockSupabase(uid,[{
    activity_code:"papiloscopia",state:{compared:true,complete:true,reference:"r17",marks:true},
    best_steps:2,best_score:0,ever_completed:true
  }]);
  const dom=domFor("<main></main>");
  dom.window.eval(source);
  const api=dom.window.ArquivoPericiaProgresso;
  await api.connect();
  assert.equal(api.isAccountActive(),true);
  assert.equal(api.listRecords()[2].ever_completed,true);
  mock.client.auth.getSession=async()=>({data:null,error:new Error("Sessão não verificável")});
  await api.connect(true);
  assert.equal(api.isAccountActive(),false);
  assert.ok(api.listRecords().every(row=>row===null));
  dom.window.close();
});

test("troca de usuário limpa imediatamente a conta antiga",async()=>{
  const uidA="55555555-5555-4555-8555-555555555555";
  const uidB="66666666-6666-4666-8666-666666666666";
  mockSupabase(uidA,[{
    activity_code:"custodia",state:{order:[0,1,2,3,4],sorted:true,complete:true},
    best_steps:2,best_score:0,ever_completed:true
  }]);
  const dom=domFor("<main></main>");
  dom.window.eval(source);
  const api=dom.window.ArquivoPericiaProgresso;
  await api.connect();
  assert.equal(api.listRecords()[1].ever_completed,true);
  mock.client.auth.getSession=async()=>({data:{session:{user:{id:uidB}}},error:null});
  mock.client.auth.getUser=async()=>({data:{user:null},error:new Error("Sessão inválida")});
  const [handler]=mock.subscribers;
  handler("SIGNED_IN",{user:{id:uidB}});
  assert.equal(api.isAccountActive(),false);
  assert.ok(api.listRecords().every(row=>row===null));
  await tick();
  assert.equal(api.isAccountActive(),false);
  dom.window.close();
});

test("gravação antiga não apaga resposta posterior ainda não sincronizada",async()=>{
  const uid="77777777-7777-4777-8777-777777777777";
  mockSupabase(uid,[]);
  const dom=domFor("<main></main>");
  dom.window.eval(source);
  const api=dom.window.ArquivoPericiaProgresso;
  await api.connect();
  const originalFrom=mock.client.from;
  const delayed=[];
  mock.client.from=(name)=>{
    const service=originalFrom(name);
    service.upsert=(row)=>new Promise(resolve=>{delayed.push({row,resolve});});
    return service;
  };
  const partial={order:[0,1,2,3,4],sorted:true,complete:false};
  const finished={order:[0,1,2,3,4],sorted:true,complete:true};
  const first=api.save("custodia",partial);
  const second=api.save("custodia",finished);
  await tick();
  assert.equal(delayed.length,1);
  assert.equal(api.pendingCount(),1);
  const pendingKey="as-forensic-member-"+uid+"-custodia";
  assert.equal(JSON.parse(dom.window.localStorage.getItem(pendingKey)).state.complete,true);
  delayed[0].resolve({data:null,error:null});
  await tick();
  assert.equal(delayed.length,2);
  assert.equal(api.pendingCount(),1,"A gravação anterior não pode limpar a nova");
  assert.equal(JSON.parse(dom.window.localStorage.getItem(pendingKey)).state.complete,true);
  delayed[1].resolve({data:null,error:null});
  await Promise.all([first,second]);
  assert.equal(api.pendingCount(),0);
  assert.equal(dom.window.localStorage.getItem(pendingKey),null);
  dom.window.close();
});


test("retomada e leitura da Trilha usam a questão realmente em andamento",async()=>{
  const uid="88888888-8888-4888-8888-888888888888";
  mockSupabase(uid,[{
    activity_code:"trilha",state:{index:2,answers:[0,2]},
    best_steps:9,best_score:90,ever_completed:true,updated_at:"2026-11-04T14:00:00Z"
  },{
    activity_code:"custodia",state:{order:[0,1,2,3,4],sorted:true,complete:true},
    best_steps:2,best_score:0,ever_completed:true,updated_at:"2026-11-04T13:00:00Z"
  }]);
  const dom=domFor(fs.readFileSync("meu-arquivo.html","utf8"));
  dom.window.eval(source);dom.window.eval(panelSource);dom.window.eval(resumeSource);
  await tick();
  const panel=dom.window.document.getElementById("forensic-resume-panel");
  assert.equal(panel.hidden,false);
  assert.equal(dom.window.document.getElementById("forensic-resume-title").textContent,"Trilha de Perícia");
  assert.match(dom.window.document.getElementById("forensic-resume-progress").textContent,/Questão 3 de 9/);
  assert.equal(dom.window.document.getElementById("forensic-resume-action").getAttribute("href"),"laboratorio-forense.html#trilha");
  assert.equal(dom.window.document.getElementById("forensic-resume-reading").getAttribute("href"),"guia-pericia.html#manchas");
  assert.equal(dom.window.document.getElementById("forensic-awards").textContent,"4");
  dom.window.close();
});

test("cadeia de custódia concluída pela metade retorna diretamente à ficha",async()=>{
  mockSupabase("99999999-9999-4999-8999-999999999999",[
    {activity_code:"custodia",state:{order:[0,1,2,3,4],sorted:true,complete:false},
     best_steps:1,best_score:0,ever_completed:false,updated_at:"2026-11-04T13:00:00Z"}
  ]);
  const dom=domFor(fs.readFileSync("meu-arquivo.html","utf8"));
  dom.window.eval(source);dom.window.eval(panelSource);dom.window.eval(resumeSource);
  await tick();
  assert.equal(dom.window.document.getElementById("forensic-resume-action").getAttribute("href"),"pericia-custodia.html#custodia-ficha");
  assert.equal(dom.window.document.getElementById("forensic-resume-reading").getAttribute("href"),"guia-pericia-custodia.html#cap-4");
  dom.window.close();
});

test("papiloscopia retoma a interpretação, não reinicia a comparação",async()=>{
  mockSupabase("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",[
    {activity_code:"papiloscopia",state:{compared:true,complete:false,reference:"r17",marks:true},
     best_steps:1,best_score:0,ever_completed:false,updated_at:"2026-11-04T13:00:00Z"}
  ]);
  const dom=domFor(fs.readFileSync("meu-arquivo.html","utf8"));
  dom.window.eval(source);dom.window.eval(panelSource);dom.window.eval(resumeSource);
  await tick();
  assert.equal(dom.window.document.getElementById("forensic-resume-action").getAttribute("href"),"pericia-papiloscopia.html#finger-limit-title");
  assert.equal(dom.window.document.getElementById("forensic-resume-reading").getAttribute("href"),"guia-pericia-papiloscopia.html#cap-3");
  dom.window.close();
});

test("uma conta sem atividades recebe a rota inicial, sem inventar materiais já estudados",async()=>{
  mockSupabase("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",[]);
  const dom=domFor(fs.readFileSync("meu-arquivo.html","utf8"));
  dom.window.eval(source);dom.window.eval(panelSource);dom.window.eval(resumeSource);
  await tick();
  assert.equal(dom.window.document.getElementById("forensic-resume-title").textContent,"Trilha de Perícia");
  assert.equal(dom.window.document.getElementById("forensic-resume-reading").getAttribute("href"),"guia-pericia.html#metodo");
  assert.equal(dom.window.document.getElementById("forensic-resume-action").textContent,"Começar atividade");
  assert.match(dom.window.document.querySelector(".forensic-resume-footnote").textContent,/não é registrada automaticamente/);
  dom.window.close();
});

test("ao sair, cartões e botão de retomada da conta anterior desaparecem",async()=>{
  const uid="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
  mockSupabase(uid,[{
    activity_code:"trilha",state:{index:3,answers:[0,2,1]},
    best_steps:3,best_score:30,ever_completed:false
  }]);
  const dom=domFor(fs.readFileSync("meu-arquivo.html","utf8"));
  dom.window.eval(source);dom.window.eval(panelSource);dom.window.eval(resumeSource);
  await tick();
  assert.ok(dom.window.document.querySelectorAll(".forensic-personal-card").length===3);
  assert.equal(dom.window.document.getElementById("forensic-resume-panel").hidden,false);
  mock.client.auth.getSession=async()=>({data:{session:null},error:null});
  mock.subscribers[0]("SIGNED_OUT",null);
  assert.equal(dom.window.document.getElementById("forensic-resume-panel").hidden,true);
  assert.equal(dom.window.document.getElementById("forensic-study-materials").hidden,true);
  assert.equal(dom.window.document.querySelectorAll(".forensic-personal-card").length,0);
  await tick();
  assert.equal(dom.window.document.getElementById("forensic-awards").textContent,"0");
  dom.window.close();
});

test("links da retomada e dos guias existem, sem novas tabelas ou rastreamento de leitura",()=>{
  const page=fs.readFileSync("meu-arquivo.html","utf8");
  assert.ok(page.includes('id="forensic-resume-panel"'));
  assert.ok(page.includes('id="forensic-study-materials"'));
  assert.ok(page.includes('js/pericia-retomada.js'));
  const files=["guia-pericia.html","guia-pericia-custodia.html","guia-pericia-papiloscopia.html"];
  for(const file of files)assert.ok(fs.existsSync(file));
  for(const id of ["custodia-ficha","custodia-ordem"]){
    assert.ok(fs.readFileSync("pericia-custodia.html","utf8").includes('id="'+id+'"'));
  }
  for(const id of ["finger-limit-title","finger-compare-title"]){
    assert.ok(fs.readFileSync("pericia-papiloscopia.html","utf8").includes('id="'+id+'"'));
  }
  assert.doesNotMatch(resumeSource,/fetch\(|sendBeacon|XMLHttpRequest|service_role|sb_secret_/);
});
