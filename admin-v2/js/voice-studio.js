(function(){
"use strict";

function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function client(){return window.obterClienteAdminIsolado?.()||window.arquivoAdminSupabaseClient||null;}

async function render(panel){
  const c=client();
  if(!c)throw new Error("Supabase indisponível.");

  const [queue,projects]=await Promise.all([
    c.from("narration_prewarm_queue").select("content_type,content_id,status,next_chunk,total_chunks,attempts,last_error,updated_at").order("updated_at",{ascending:false}).limit(8),
    c.from("narration_projects").select("id,content_type,content_id,polly_voice_id,polly_engine,status,updated_at").order("updated_at",{ascending:false}).limit(8)
  ]);

  const jobs=queue.data||[];
  const active=jobs.filter(x=>x.status==="pending"||x.status==="running").length;
  const done=jobs.filter(x=>x.status==="done").length;
  const failed=jobs.filter(x=>x.status==="failed").length;

  panel.innerHTML=
    '<div class="voice-studio-head">'+
      '<div><span>LABORATÓRIO DE VOZ</span><h2>Arquivo Voz</h2><p>Ambiente de desenvolvimento e controle da voz própria do Arquivo Sombrio. O processamento pesado ficará fora do navegador; esta área será o painel de operação.</p></div>'+
      '<span class="voice-studio-badge">FASE 1 · ESTRUTURA</span>'+
    '</div>'+
    '<div class="voice-studio-metrics">'+
      '<article><strong>POLLY</strong><span>motor atual</span></article>'+
      '<article><strong>'+active+'</strong><span>gerações em andamento</span></article>'+
      '<article><strong>'+done+'</strong><span>recentes concluídas</span></article>'+
      '<article><strong>'+failed+'</strong><span>com falha</span></article>'+
    '</div>'+
    '<div class="voice-studio-grid">'+
      '<section class="voice-studio-card">'+
        '<header><div><span>MOTOR DE VOZ</span><h3>Arquitetura do Arquivo Voz</h3></div><i class="fa-solid fa-wave-square"></i></header>'+
        '<div class="voice-studio-flow"><span>Texto editorial</span><i class="fa-solid fa-arrow-right"></i><span>Interpretação contextual</span><i class="fa-solid fa-arrow-right"></i><span>Motor TTS</span><i class="fa-solid fa-arrow-right"></i><span>MP3</span></div>'+
        '<p>Amazon Polly permanece como motor ativo enquanto testamos modelos locais. Depois, o motor poderá ser trocado sem alterar o player público.</p>'+
      '</section>'+
      '<section class="voice-studio-card">'+
        '<header><div><span>PRÓXIMA ETAPA</span><h3>Teste de modelos locais</h3></div><i class="fa-solid fa-flask"></i></header>'+
        '<p>Vamos instalar e comparar modelos TTS no notebook usando o mesmo trecho de teste. O vencedor será integrado a esta área.</p>'+
        '<button type="button" class="voice-studio-primary" data-voice-next><i class="fa-solid fa-laptop-code"></i> Preparar laboratório local</button>'+
      '</section>'+
      '<section class="voice-studio-card voice-studio-wide">'+
        '<header><div><span>FILA</span><h3>Pré-geração recente</h3></div><i class="fa-solid fa-list-check"></i></header>'+
        (jobs.length?'<div class="voice-studio-jobs">'+jobs.map(j=>{
          const progress=j.total_chunks?Math.min(100,Math.round((Number(j.next_chunk||0)/Number(j.total_chunks))*100)):0;
          return '<article><div><strong>'+esc(j.content_type)+' #'+esc(j.content_id)+'</strong><small>'+esc(j.status)+'</small></div><div class="voice-studio-progress"><span style="width:'+progress+'%"></span></div><em>'+progress+'%</em></article>';
        }).join("")+'</div>':'<p>Nenhuma geração recente na fila.</p>')+
      '</section>'+
    '</div>';

  panel.querySelector("[data-voice-next]")?.addEventListener("click",()=>{
    alert("O próximo passo é preparar o notebook para testar os modelos TTS locais. Vamos fazer isso por esta área.");
  });
}

window.ArquivoVozStudio={render};
})();