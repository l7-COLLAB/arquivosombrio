(function(){
"use strict";

const LOCAL_URL="http://localhost:8890";

function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function client(){return window.obterClienteAdminIsolado?.()||window.arquivoAdminSupabaseClient||null;}

async function localFetch(path,options={}){
  const url=LOCAL_URL+path;
  try{
    const req=new Request(url,{...options,mode:"cors",targetAddressSpace:"loopback"});
    return await fetch(req);
  }catch(firstError){
    return await fetch(url,{...options,mode:"cors"});
  }
}

function extractVoiceIds(data){
  const raw=Array.isArray(data)?data:Array.isArray(data?.voices)?data.voices:[];
  return raw.map(v=>typeof v==="string"?v:(v?.id||v?.name||"")).filter(Boolean)
    .filter(v=>/^p[fm]_/.test(v));
}

async function render(panel){
  const c=client();
  if(!c)throw new Error("Supabase indisponível.");

  const queue=await c.from("narration_prewarm_queue")
    .select("content_type,content_id,status,next_chunk,total_chunks,attempts,last_error,updated_at")
    .order("updated_at",{ascending:false}).limit(8);

  const jobs=queue.data||[];
  const active=jobs.filter(x=>x.status==="pending"||x.status==="running").length;
  const done=jobs.filter(x=>x.status==="done").length;
  const failed=jobs.filter(x=>x.status==="failed").length;

  const testText="Em Washington, D.C., investigadores analisaram os registros do D.C. General. O arquivo reúne datas, depoimentos e evidências que precisam ser narrados com clareza, sem dramatização excessiva.";

  panel.innerHTML=
    '<div class="voice-studio-head">'+
      '<div><span>LABORATÓRIO DE VOZ</span><h2>Arquivo Voz</h2><p>O painel permanece dentro da V2. O modelo roda no notebook e a V2 envia apenas o texto para o serviço local.</p></div>'+
      '<span class="voice-studio-badge">FASE 2 · KOKORO LOCAL</span>'+
    '</div>'+
    '<div class="voice-studio-metrics">'+
      '<article><strong data-local-engine>OFFLINE</strong><span>Kokoro local</span></article>'+
      '<article><strong>'+active+'</strong><span>gerações em andamento</span></article>'+
      '<article><strong>'+done+'</strong><span>recentes concluídas</span></article>'+
      '<article><strong>'+failed+'</strong><span>com falha</span></article>'+
    '</div>'+
    '<div class="voice-studio-grid">'+
      '<section class="voice-studio-card">'+
        '<header><div><span>SERVIDOR LOCAL</span><h3>Conexão com o notebook</h3></div><i class="fa-solid fa-laptop"></i></header>'+
        '<p>A V2 procura o Arquivo Voz em <code>'+LOCAL_URL+'</code>. O processamento fica no seu notebook, não no navegador.</p>'+
        '<div class="voice-local-status" data-local-status><i class="fa-solid fa-circle"></i><span>Não testado</span></div>'+
        '<div class="voice-studio-actions"><button type="button" class="voice-studio-primary" data-local-test><i class="fa-solid fa-plug"></i> Testar conexão</button><button type="button" data-copy-command><i class="fa-regular fa-copy"></i> Copiar comando de início</button></div>'+
        '<small class="voice-studio-help">Com Docker Desktop instalado, execute <code>docker compose up -d</code> dentro da pasta <code>arquivo-voz-local</code>.</small>'+
      '</section>'+
      '<section class="voice-studio-card">'+
        '<header><div><span>MOTOR DE TESTE</span><h3>Kokoro 82M · pt-BR</h3></div><i class="fa-solid fa-wave-square"></i></header>'+
        '<label class="voice-field">Voz<select data-local-voice><option value="pf_dora">pf_dora · feminina</option><option value="pm_alex">pm_alex · masculina</option><option value="pm_santa">pm_santa · masculina</option></select></label>'+
        '<label class="voice-field">Velocidade<input type="range" min="0.75" max="1.15" step="0.05" value="0.95" data-local-speed><output data-local-speed-value>0.95×</output></label>'+
        '<p>Primeiro vamos comparar naturalidade, pronúncia e ritmo. O Polly continua sendo o motor público enquanto este laboratório estiver em teste.</p>'+
      '</section>'+
      '<section class="voice-studio-card voice-studio-wide">'+
        '<header><div><span>TESTE DE VOZ</span><h3>Ouvir no próprio painel</h3></div><i class="fa-solid fa-headphones"></i></header>'+
        '<textarea class="voice-test-text" rows="7" data-local-text>'+esc(testText)+'</textarea>'+
        '<div class="voice-studio-actions"><button type="button" class="voice-studio-primary" data-local-generate><i class="fa-solid fa-play"></i> Gerar teste local</button><span data-local-generation-state>Servidor ainda não testado.</span></div>'+
        '<audio controls class="voice-test-audio" data-local-audio hidden></audio>'+
      '</section>'+
      '<section class="voice-studio-card voice-studio-wide">'+
        '<header><div><span>ARQUITETURA</span><h3>Como o Arquivo Voz ficará</h3></div><i class="fa-solid fa-diagram-project"></i></header>'+
        '<div class="voice-studio-flow"><span>Texto editorial</span><i class="fa-solid fa-arrow-right"></i><span>Interpretação contextual</span><i class="fa-solid fa-arrow-right"></i><span>Kokoro / futuro motor</span><i class="fa-solid fa-arrow-right"></i><span>MP3</span><i class="fa-solid fa-arrow-right"></i><span>Supabase</span></div>'+
      '</section>'+
      '<section class="voice-studio-card voice-studio-wide">'+
        '<header><div><span>FILA PÚBLICA</span><h3>Pré-geração recente</h3></div><i class="fa-solid fa-list-check"></i></header>'+
        (jobs.length?'<div class="voice-studio-jobs">'+jobs.map(j=>{
          const progress=j.total_chunks?Math.min(100,Math.round((Number(j.next_chunk||0)/Number(j.total_chunks))*100)):0;
          return '<article><div><strong>'+esc(j.content_type)+' #'+esc(j.content_id)+'</strong><small>'+esc(j.status)+'</small></div><div class="voice-studio-progress"><span style="width:'+progress+'%"></span></div><em>'+progress+'%</em></article>';
        }).join("")+'</div>':'<p>Nenhuma geração recente na fila.</p>')+
      '</section>'+
    '</div>';

  const status=panel.querySelector("[data-local-status]");
  const engine=panel.querySelector("[data-local-engine]");
  const generation=panel.querySelector("[data-local-generation-state]");
  const voice=panel.querySelector("[data-local-voice]");
  const speed=panel.querySelector("[data-local-speed]");
  const speedValue=panel.querySelector("[data-local-speed-value]");
  const textBox=panel.querySelector("[data-local-text]");
  const audio=panel.querySelector("[data-local-audio]");

  speed.oninput=()=>speedValue.textContent=Number(speed.value).toFixed(2)+"×";

  async function testConnection(){
    status.className="voice-local-status is-testing";
    status.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i><span>Testando conexão local...</span>';
    try{
      const r=await localFetch("/health",{method:"GET"});
      if(!r.ok)throw new Error("HTTP "+r.status);
      const data=await r.json();
      status.className="voice-local-status is-online";
      status.innerHTML='<i class="fa-solid fa-circle-check"></i><span>Kokoro conectado no notebook</span>';
      engine.textContent="ONLINE";
      generation.textContent="Servidor local pronto.";
      try{
        const vr=await localFetch("/voices",{method:"GET"});
        if(vr.ok){
          const ids=extractVoiceIds(await vr.json());
          if(ids.length)voice.innerHTML=ids.map(id=>'<option value="'+esc(id)+'">'+esc(id)+'</option>').join("");
        }
      }catch(_){}
      return data;
    }catch(e){
      status.className="voice-local-status is-offline";
      status.innerHTML='<i class="fa-solid fa-circle-xmark"></i><span>Servidor local não encontrado</span>';
      engine.textContent="OFFLINE";
      generation.textContent="Inicie o laboratório local no notebook.";
      throw e;
    }
  }

  panel.querySelector("[data-local-test]").onclick=async()=>{
    try{await testConnection();}catch(e){
      alert("Não consegui acessar o Arquivo Voz em localhost:8890. Confirme se o Docker Desktop está aberto e se o laboratório foi iniciado.");
    }
  };

  panel.querySelector("[data-copy-command]").onclick=async()=>{
    const cmd="cd arquivo-voz-local\ndocker compose up -d";
    try{
      await navigator.clipboard.writeText(cmd);
      panel.querySelector("[data-copy-command]").innerHTML='<i class="fa-solid fa-check"></i> Comando copiado';
      setTimeout(()=>panel.querySelector("[data-copy-command]").innerHTML='<i class="fa-regular fa-copy"></i> Copiar comando de início',1500);
    }catch(_){alert(cmd);}
  };

  panel.querySelector("[data-local-generate]").onclick=async function(){
    const btn=this;
    const text=textBox.value.trim();
    if(!text)return alert("Escreva um texto para testar.");
    btn.disabled=true;
    generation.textContent="Gerando no notebook...";
    try{
      const r=await localFetch("/synthesize",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({text,voice:voice.value,speed:Number(speed.value)})
      });
      if(!r.ok){
        let msg="HTTP "+r.status;
        try{const d=await r.json();msg=d?.detail||msg;}catch(_){}
        throw new Error(msg);
      }
      const blob=await r.blob();
      if(audio.dataset.objectUrl)URL.revokeObjectURL(audio.dataset.objectUrl);
      const url=URL.createObjectURL(blob);
      audio.dataset.objectUrl=url;
      audio.src=url;
      audio.hidden=false;
      generation.textContent="Teste pronto · "+voice.value+" · "+Number(speed.value).toFixed(2)+"×";
      await audio.play().catch(()=>{});
    }catch(e){
      generation.textContent="Falha no teste local.";
      alert("Não foi possível gerar o áudio local. "+(e?.message||""));
    }finally{btn.disabled=false;}
  };
}

window.ArquivoVozStudio={render};
})();