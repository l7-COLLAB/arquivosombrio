
(function () {
"use strict";
var state = { client:null, session:null, mounted:false, view:"overview" };
var labels = {
  overview:"Visão geral", content:"Conteúdos e edição", schedule:"Agendamentos", feature:"Destaque da Home", narration:"Narração do Arquivo", voiceStudio:"Arquivo Voz", community:"Comunidade",
  users:"Usuários", requests:"Solicitações", activity:"Histórico administrativo"
};
var icons = {
  overview:"fa-chart-line", content:"fa-folder-tree", schedule:"fa-calendar-check", feature:"fa-star", narration:"fa-microphone-lines", voiceStudio:"fa-wave-square", community:"fa-comments",
  users:"fa-users", requests:"fa-inbox", activity:"fa-clock-rotate-left"
};
function esc(v){return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");}
function short(v,n){var s=String(v||"").trim();n=n||180;return s.length>n?s.slice(0,n-3)+"...":s;}
function date(v){if(!v)return"Sem registro";var d=new Date(v);return isNaN(d.getTime())?"Sem registro":d.toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"});}
function badge(v){var s=String(v||"sem_status").toLowerCase();var m={pending:"Pendente",pendente:"Pendente",reviewing:"Em análise",under_review:"Em análise",approved:"Aprovado",aprovado:"Aprovado",publicado:"Publicado",resolved:"Resolvido",completed:"Concluído",dismissed:"Arquivado",cancelled:"Cancelado",nova:"Nova",active:"Ativo",oculto:"Oculto",bloqueado:"Bloqueado"};return '<span class="admin-hub-badge admin-hub-badge--'+esc(s)+'">'+esc(m[s]||v||"Sem status")+"</span>";}
function empty(v){return '<div class="admin-hub-empty"><i class="fa-regular fa-folder-open"></i><p>'+esc(v)+"</p></div>";}
function panel(v){return document.querySelector('[data-admin-hub-panel="'+v+'"]');}
function loading(v){var p=panel(v);if(p)p.innerHTML='<div class="admin-hub-loading"><i class="fa-solid fa-spinner fa-spin"></i><span>Consultando dados...</span></div>';}
async function query(t,order,limit){var q=state.client.from(t).select("*");if(order)q=q.order(order,{ascending:false});if(limit)q=q.limit(limit);var r=await q;if(r.error)throw r.error;return Array.isArray(r.data)?r.data:[];}
async function count(t,col,val){var q=state.client.from(t).select("*",{count:"exact",head:true});if(col)q=q.eq(col,val);var r=await q;return r.error?0:Number(r.count||0);}
async function audit(action,type,id,details){var r=await state.client.from("admin_audit_log").insert({admin_user_id:state.session.user.id,action:action,target_type:type,target_id:id==null?null:String(id),details:details||{}});if(r.error)console.warn(r.error);}
function invalidate(list){list.forEach(function(v){var p=panel(v);if(p)p.dataset.loaded="";});}
function setCount(v,n){var e=document.querySelector('[data-admin-hub-count="'+v+'"]');if(e)e.textContent=n?String(n):"";}
function shell(manager){
  var close=manager.querySelector("#admin-manager-close");
  var legacy=document.createElement("section");legacy.className="admin-hub-panel admin-hub-panel--legacy";legacy.dataset.adminHubPanel="content";legacy.hidden=true;
  Array.from(manager.children).forEach(function(c){if(c!==close)legacy.appendChild(c);});
  var root=document.createElement("div");root.className="admin-hub-shell";
  var nav=Object.keys(labels).map(function(v){return '<button type="button" data-admin-hub-view="'+v+'"><i class="fa-solid '+icons[v]+'"></i><span>'+labels[v]+'</span><small data-admin-hub-count="'+v+'"></small></button>';}).join("");
  root.innerHTML='<aside class="admin-hub-sidebar"><div class="admin-hub-brand"><span>ÁREA RESTRITA</span><strong>Central Administrativa</strong><small>Arquivo Sombrio</small></div><nav aria-label="Menu administrativo">'+nav+'</nav><div class="admin-hub-sidebar-footer"><p><i class="fa-solid fa-shield-halved"></i> Acesso protegido</p><button type="button" data-admin-hub-logout><i class="fa-solid fa-right-from-bracket"></i> Sair</button></div></aside><div class="admin-hub-main"><header class="admin-hub-topbar"><button type="button" class="admin-hub-menu-toggle" aria-label="Abrir menu"><i class="fa-solid fa-bars"></i></button><div><span>PAINEL ADMINISTRATIVO</span><h1 data-admin-hub-title>Visão geral</h1></div><button type="button" class="admin-hub-refresh" aria-label="Atualizar"><i class="fa-solid fa-rotate"></i></button></header><div class="admin-hub-panels"><section class="admin-hub-panel" data-admin-hub-panel="overview"></section><section class="admin-hub-panel" data-admin-hub-panel="schedule" hidden></section><section class="admin-hub-panel" data-admin-hub-panel="feature" hidden></section><section class="admin-hub-panel" data-admin-hub-panel="narration" hidden></section><section class="admin-hub-panel" data-admin-hub-panel="voiceStudio" hidden></section><section class="admin-hub-panel" data-admin-hub-panel="community" hidden></section><section class="admin-hub-panel" data-admin-hub-panel="users" hidden></section><section class="admin-hub-panel" data-admin-hub-panel="requests" hidden></section><section class="admin-hub-panel" data-admin-hub-panel="activity" hidden></section></div></div>';
  root.querySelector(".admin-hub-panels").appendChild(legacy);manager.appendChild(root);
  if(close){close.classList.add("admin-hub-native-close");root.querySelector(".admin-hub-topbar").appendChild(close);}
  root.querySelectorAll("[data-admin-hub-view]").forEach(function(b){b.onclick=function(){open(b.dataset.adminHubView);};});
  root.querySelector("[data-admin-hub-logout]").onclick=function(){document.getElementById("admin-logout")?.click();};
  root.querySelector(".admin-hub-menu-toggle").onclick=function(){root.classList.toggle("admin-hub-menu-open");};
  root.querySelector(".admin-hub-refresh").onclick=function(){load(state.view,true);};
}
function open(v){
  state.view=v;var root=document.querySelector(".admin-hub-shell");if(!root)return;
  root.querySelectorAll("[data-admin-hub-view]").forEach(function(b){var a=b.dataset.adminHubView===v;b.classList.toggle("active",a);b.setAttribute("aria-current",a?"page":"false");});
  root.querySelectorAll("[data-admin-hub-panel]").forEach(function(p){p.hidden=p.dataset.adminHubPanel!==v;});
  root.querySelector("[data-admin-hub-title]").textContent=labels[v];root.classList.remove("admin-hub-menu-open");load(v,false);
}
async function load(v,force){
  if(v==="content")return;var p=panel(v);if(!p||(p.dataset.loaded&&!force))return;loading(v);
  try{if(v==="overview")await overview(p);if(v==="schedule")await scheduleCenter(p);if(v==="feature")await homeFeature(p);if(v==="narration"){if(!window.ArquivoNarracao?.render)throw new Error("O módulo de narração não carregou.");await window.ArquivoNarracao.render(p);}if(v==="voiceStudio"){if(!window.ArquivoVozStudio?.render)throw new Error("O Arquivo Voz não carregou.");await window.ArquivoVozStudio.render(p);}if(v==="community")await community(p);if(v==="users")await users(p);if(v==="requests")await requests(p);if(v==="activity")await activity(p);p.dataset.loaded="1";}
  catch(e){console.error(e);p.innerHTML='<div class="admin-hub-error"><i class="fa-solid fa-triangle-exclamation"></i><p>'+esc(e.message||"Não foi possível carregar esta área.")+"</p></div>";}
}

function scheduleDate(v){
  if(!v)return"Sem horário";
  var d=new Date(v);
  return isNaN(d.getTime())?"Sem horário":new Intl.DateTimeFormat("pt-BR",{timeZone:"America/Sao_Paulo",day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(d);
}
var scheduleTypeLabels={dossie:"Dossiê",caso_diario:"Garimpo",pericia:"Perícia",livro:"Livro",lenda:"Lenda",creepypasta:"Creepypasta"};
var scheduleTables={dossie:"Casos",caso_diario:"casos_diarios",pericia:"pericias",livro:"livros",lenda:"lendas",creepypasta:"creepypastas"};

async function hydrateScheduleTitles(rows){
  var grouped={};
  rows.forEach(function(x){(grouped[x.content_type]||(grouped[x.content_type]=[])).push(String(x.record_id));});
  var maps={};
  await Promise.all(Object.keys(grouped).map(async function(type){
    var table=scheduleTables[type]; if(!table)return;
    var q=await state.client.from(table).select("id,titulo,status_publicacao").in("id",grouped[type]);
    if(q.error){console.warn(q.error);return;}
    maps[type]=new Map((q.data||[]).map(function(x){return[String(x.id),x];}));
  }));
  return rows.map(function(x){
    var source=maps[x.content_type]?.get(String(x.record_id));
    return Object.assign({},x,{_title:source?.titulo||"Conteúdo sem título",_source_status:source?.status_publicacao||x.editorial_status});
  });
}

function scheduleStatusLabel(v){
  var m={scheduled:"AGENDADO",failed:"FALHOU",executed:"PUBLICADO",cancelled:"CANCELADO",none:"SEM AGENDAMENTO"};
  return m[v]||String(v||"SEM STATUS").toUpperCase();
}

async function scheduleCenter(p){
  var r=await state.client.from("admin_v2_content_state")
    .select("content_type,record_id,editorial_status,scheduled_for,schedule_timezone,schedule_status,schedule_note,updated_at")
    .neq("schedule_status","none")
    .order("scheduled_for",{ascending:true,nullsFirst:false});
  if(r.error)throw r.error;
  var rows=await hydrateScheduleTitles(r.data||[]);
  p.innerHTML=heading("PUBLICAÇÃO","Central de Agendamentos","Controle todas as publicações programadas em um único lugar.")+
  '<div class="admin-schedule-center-toolbar">'+
    '<label>Tipo<select data-schedule-filter-type><option value="all">Todos</option><option value="dossie">Dossiês</option><option value="caso_diario">Garimpo</option><option value="pericia">Perícias</option><option value="livro">Livros</option><option value="lenda">Lendas</option><option value="creepypasta">Creepypastas</option></select></label>'+
    '<label>Status<select data-schedule-filter-status><option value="all">Todos</option><option value="scheduled">Agendados</option><option value="failed">Falharam</option><option value="executed">Publicados</option><option value="cancelled">Cancelados</option></select></label>'+
    '<label>Período<select data-schedule-filter-date><option value="all">Todas as datas</option><option value="today">Hoje</option><option value="7d">Próximos 7 dias</option><option value="future">Futuros</option></select></label>'+
  '</div><div data-schedule-list></div>';

  var box=p.querySelector("[data-schedule-list]");
  function render(){
    var type=p.querySelector("[data-schedule-filter-type]").value;
    var status=p.querySelector("[data-schedule-filter-status]").value;
    var period=p.querySelector("[data-schedule-filter-date]").value;
    var now=new Date(),todayKey=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo"}).format(now);
    var end7=new Date(now.getTime()+7*86400000);
    var list=rows.filter(function(x){
      if(type!=="all"&&x.content_type!==type)return false;
      if(status!=="all"&&x.schedule_status!==status)return false;
      if(period==="all")return true;
      if(!x.scheduled_for)return false;
      var d=new Date(x.scheduled_for);
      if(period==="today")return new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo"}).format(d)===todayKey;
      if(period==="7d")return d>=now&&d<=end7;
      if(period==="future")return d>=now;
      return true;
    });
    var waiting=list.filter(function(x){return x.schedule_status==="scheduled";}).length;
    var failed=list.filter(function(x){return x.schedule_status==="failed";}).length;
    box.innerHTML='<div class="admin-schedule-summary"><div><strong>'+waiting+'</strong><span>aguardando publicação</span></div><div><strong>'+failed+'</strong><span>com falha</span></div><div><strong>'+list.length+'</strong><span>itens exibidos</span></div></div>'+
      (list.length?'<div class="admin-schedule-center-list">'+list.map(function(x){
        var overdue=x.schedule_status==="scheduled"&&x.scheduled_for&&new Date(x.scheduled_for)<new Date();
        return '<article class="admin-schedule-center-item '+(overdue?"is-overdue ":"")+'is-'+esc(x.schedule_status)+'">'+
          '<div class="admin-schedule-center-time"><i class="fa-regular fa-calendar"></i><strong>'+esc(scheduleDate(x.scheduled_for))+'</strong><small>Horário de Brasília</small></div>'+
          '<div class="admin-schedule-center-content"><span>'+esc(scheduleTypeLabels[x.content_type]||x.content_type)+'</span><h3>'+esc(x._title)+'</h3><p>'+esc(x.schedule_note||"Publicação programada")+'</p></div>'+
          '<div class="admin-schedule-center-state"><span>'+esc(scheduleStatusLabel(x.schedule_status))+'</span>'+(overdue?'<small>HORÁRIO ULTRAPASSADO</small>':"")+'</div>'+
          '<div class="admin-schedule-center-actions">'+
            '<button data-schedule-action="edit" data-type="'+esc(x.content_type)+'" data-id="'+esc(x.record_id)+'">Editar</button>'+
            (x.schedule_status==="scheduled"||x.schedule_status==="failed"?'<button data-schedule-action="publish" data-type="'+esc(x.content_type)+'" data-id="'+esc(x.record_id)+'">Publicar agora</button><button class="danger" data-schedule-action="cancel" data-type="'+esc(x.content_type)+'" data-id="'+esc(x.record_id)+'">Cancelar</button>':"")+
          '</div></article>';
      }).join("")+'</div>':empty("Nenhum agendamento encontrado com estes filtros."));
    box.querySelectorAll("[data-schedule-action]").forEach(function(b){b.onclick=function(){scheduleAction(b,p);};});
  }
  p.querySelectorAll(".admin-schedule-center-toolbar select").forEach(function(s){s.onchange=render;});
  render();
  setCount("schedule",rows.filter(function(x){return x.schedule_status==="scheduled";}).length);
}

async function scheduleAction(b,p){
  var a=b.dataset.scheduleAction,type=b.dataset.type,id=b.dataset.id;
  if(a==="edit"){
    try{
      if(type==="dossie"&&typeof window.editarCaso==="function")return window.editarCaso(id);
      if(type==="pericia"&&typeof window.editarPericia==="function")return window.editarPericia(id);
      if(type==="livro"&&typeof window.editarLivro==="function")return window.editarLivro(id);
      if(type==="caso_diario"){
        var q=await state.client.from("casos_diarios").select("*").eq("id",id).single();
        if(q.error)throw q.error;
        var s=await state.client.from("admin_v2_content_state").select("scheduled_for").eq("content_type","caso_diario").eq("record_id",String(id)).maybeSingle();
        return window.abrirFormularioCasoDiario?.(Object.assign({},q.data,{_scheduled_for:s.data?.scheduled_for||null}));
      }
      if((type==="lenda"||type==="creepypasta")&&typeof window.arquivoAbrirEditorLiterario==="function"){
        var table=type==="lenda"?"lendas":"creepypastas";
        var l=await state.client.from(table).select("*").eq("id",id).single();
        if(l.error)throw l.error;
        return window.arquivoAbrirEditorLiterario(table,l.data);
      }
      open("content");
    }catch(e){alert(e.message||"Não foi possível abrir o editor.");}
    return;
  }
  if(a==="cancel"&&!confirm("Cancelar este agendamento e devolver o conteúdo para Rascunho?"))return;
  if(a==="publish"&&!confirm("Publicar este conteúdo agora? O horário agendado será encerrado."))return;
  b.disabled=true;
  try{
    var fn=a==="cancel"?"admin_cancel_scheduled_publication":"admin_publish_scheduled_now";
    var r=await state.client.rpc(fn,{p_content_type:type,p_record_id:String(id)});
    if(r.error)throw r.error;
    await audit(a==="cancel"?"cancel_schedule":"publish_schedule_now",type,id);
    p.dataset.loaded="";
    invalidate(["overview","activity"]);
    await scheduleCenter(p);
  }catch(e){alert(e.message||"Não foi possível executar esta ação.");}
  finally{b.disabled=false;}
}


async function homeFeature(p){
  var cfg=await state.client.from("home_featured_config")
    .select("id,dossier_id,selected_at,selected_by,updated_at")
    .eq("id",1)
    .maybeSingle();
  if(cfg.error)throw cfg.error;

  var dossiers=await state.client.from("Casos")
    .select("id,titulo,categoria,status_publicacao,updated_at")
    .eq("status_publicacao","publicado")
    .order("updated_at",{ascending:false});
  if(dossiers.error)throw dossiers.error;

  var current=cfg.data||{id:1,dossier_id:null,selected_at:null};
  var selected=current.dossier_id?(dossiers.data||[]).find(function(x){return String(x.id)===String(current.dossier_id);}):null;
  var selectedAt=current.selected_at?new Date(current.selected_at):null;
  var expiresAt=selectedAt?new Date(selectedAt.getTime()+48*60*60*1000):null;
  var manualActive=Boolean(selected&&expiresAt&&expiresAt>new Date());
  var automatic=(dossiers.data||[])[0]||null;
  var effective=manualActive?selected:automatic;

  function expiryText(){
    if(!selectedAt||!expiresAt)return"Sem destaque manual ativo";
    if(expiresAt<=new Date())return"Prazo manual encerrado · modo automático ativo";
    return"Manual até "+expiresAt.toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"})+"";
  }

  p.innerHTML=heading("HOME","Destaque editorial","Escolha qual dossiê ocupa o destaque principal da home. A seleção manual vale por 48 horas; depois disso, o dossiê publicado mais recente assume automaticamente.")+
    '<div class="admin-home-feature-grid">'+
      '<article class="admin-hub-card admin-home-feature-current"><header><i class="fa-solid fa-star"></i><h3>Destaque atual</h3></header>'+
        '<span class="admin-home-feature-mode '+(manualActive?"is-manual":"is-auto")+'">'+(manualActive?"MANUAL · 48H":"AUTOMÁTICO")+'</span>'+
        '<strong class="admin-home-feature-title">'+esc(effective?.titulo||"Nenhum dossiê publicado")+'</strong>'+
        '<p>'+(manualActive?"Este dossiê foi escolhido manualmente.":"A home está usando o dossiê publicado mais recente.")+'</p>'+
        '<small>'+esc(expiryText())+'</small>'+
      '</article>'+
      '<article class="admin-hub-card admin-home-feature-control"><header><i class="fa-solid fa-thumbtack"></i><h3>Escolher destaque</h3></header>'+
        '<label>Dossiê publicado<select data-home-feature-select><option value="">Selecione um dossiê</option>'+
          (dossiers.data||[]).map(function(d){return '<option value="'+esc(d.id)+'" '+(manualActive&&String(d.id)===String(current.dossier_id)?"selected":"")+'>'+esc(d.titulo)+'</option>';}).join("")+
        '</select></label>'+
        '<div class="admin-home-feature-actions">'+
          '<button type="button" data-home-feature-save><i class="fa-solid fa-star"></i> Fixar por 48 horas</button>'+
          '<button type="button" class="danger" data-home-feature-auto '+(!current.dossier_id?"disabled":"")+'><i class="fa-solid fa-rotate"></i> Usar automático agora</button>'+
        '</div>'+
        '<p class="admin-home-feature-note">Sempre que você escolher um dossiê, o prazo de 48 horas começa novamente a partir daquele momento.</p>'+
      '</article>'+
    '</div>';

  var select=p.querySelector("[data-home-feature-select]");
  var save=p.querySelector("[data-home-feature-save]");
  var auto=p.querySelector("[data-home-feature-auto]");

  save.onclick=async function(){
    if(!select.value)return alert("Escolha um dossiê para destacar.");
    save.disabled=true;
    try{
      var now=new Date().toISOString();
      var r=await state.client.from("home_featured_config").update({
        dossier_id:Number(select.value),
        selected_at:now,
        selected_by:state.session.user.id,
        updated_at:now
      }).eq("id",1);
      if(r.error)throw r.error;
      await audit("set_home_feature","dossie",select.value,{expires_in_hours:48});
      p.dataset.loaded="";
      invalidate(["overview","activity"]);
      await homeFeature(p);
    }catch(e){alert(e.message||"Não foi possível atualizar o destaque da home.");}
    finally{save.disabled=false;}
  };

  auto.onclick=async function(){
    if(!confirm("Voltar agora para o destaque automático pelo dossiê mais recente?"))return;
    auto.disabled=true;
    try{
      var now=new Date().toISOString();
      var r=await state.client.from("home_featured_config").update({
        dossier_id:null,
        selected_at:null,
        selected_by:null,
        updated_at:now
      }).eq("id",1);
      if(r.error)throw r.error;
      await audit("reset_home_feature","dossie",null,{mode:"automatic"});
      p.dataset.loaded="";
      invalidate(["overview","activity"]);
      await homeFeature(p);
    }catch(e){alert(e.message||"Não foi possível restaurar o destaque automático.");}
    finally{auto.disabled=false;}
  };
}

async function overview(p){
  var all=await Promise.all([state.client.rpc("admin_list_users"),count("Comentarios"),count("forum_posts"),count("content_reports","status","pending"),count("Sugestoes","status","nova"),count("account_deletion_requests","status","pending"),count("admin_notifications","is_read",false)]);
  if(all[0].error)throw all[0].error;var u=(all[0].data||[]).length,c=all[1]+all[2],pending=all[3]+all[4]+all[5]+all[6],scheduled=await count("admin_v2_content_state","schedule_status","scheduled"),narrations=await count("narration_projects");
  p.innerHTML='<div class="admin-hub-intro"><div><span>CONTROLE CENTRAL</span><h2>Visão geral do Arquivo</h2><p>Acompanhe conteúdos, comunidade, usuários e solicitações sem acessar diretamente o painel técnico do banco.</p></div><time>'+esc(new Date().toLocaleDateString("pt-BR",{dateStyle:"long"}))+'</time></div><div class="admin-hub-metrics"><button data-go="users"><i class="fa-solid fa-users"></i><span>'+u+'</span><small>usuários cadastrados</small></button><button data-go="community"><i class="fa-solid fa-comment-dots"></i><span>'+c+'</span><small>publicações e comentários</small></button><button data-go="requests"><i class="fa-solid fa-shield-halved"></i><span>'+pending+'</span><small>itens aguardando atenção</small></button><button data-go="content"><i class="fa-solid fa-file-pen"></i><span>ABRIR</span><small>conteúdos e edição</small></button><button data-go="schedule"><i class="fa-solid fa-calendar-check"></i><span>'+scheduled+'</span><small>publicações agendadas</small></button><button data-go="narration"><i class="fa-solid fa-microphone-lines"></i><span>'+narrations+'</span><small>projetos de narração</small></button></div><div class="admin-hub-grid"><article class="admin-hub-card"><header><i class="fa-solid fa-list-check"></i><h3>Fila de trabalho</h3></header><ul class="admin-hub-checklist"><li><span>Denúncias pendentes</span><strong>'+all[3]+'</strong></li><li><span>Sugestões novas</span><strong>'+all[4]+'</strong></li><li><span>Exclusões de conta</span><strong>'+all[5]+'</strong></li><li><span>Notificações não lidas</span><strong>'+all[6]+'</strong></li></ul></article><article class="admin-hub-card admin-hub-privacy-card"><header><i class="fa-solid fa-user-lock"></i><h3>Limite de privacidade</h3></header><p>O painel mostra somente dados necessários à administração, conteúdo enviado, aceites legais e solicitações.</p><p>Anotações pessoais, favoritos, histórico de leitura, murais privados e evidências salvas permanecem privados.</p></article></div>';
  p.querySelectorAll("[data-go]").forEach(function(b){b.onclick=function(){open(b.dataset.go);};});setCount("users",u);setCount("community",c);setCount("requests",pending);setCount("schedule",scheduled);setCount("narration",narrations);
}
function heading(k,t,d){return '<div class="admin-hub-section-heading"><div><span>'+k+'</span><h2>'+t+'</h2><p>'+d+"</p></div></div>";}
async function community(p){
  p.innerHTML=heading("MODERAÇÃO","Comunidade","Consulte e modere apenas o conteúdo enviado à parte pública do site.")+'<div class="admin-hub-subtabs"><button data-ct="Comentarios" class="active">Comentários dos casos</button><button data-ct="forum_posts">Tópicos do fórum</button><button data-ct="forum_comments">Respostas do fórum</button><button data-ct="content_reports">Denúncias</button></div><div data-community-list></div>';
  p.querySelectorAll("[data-ct]").forEach(function(b){b.onclick=function(){communityList(p,b.dataset.ct);};});await communityList(p,"Comentarios");
}
async function communityList(p,t){
  p.querySelectorAll("[data-ct]").forEach(function(b){b.classList.toggle("active",b.dataset.ct===t);});var box=p.querySelector("[data-community-list]");box.innerHTML='<div class="admin-hub-loading"><i class="fa-solid fa-spinner fa-spin"></i></div>';
  var rows=await query(t,"created_at",100);if(!rows.length){box.innerHTML=empty("Nenhum registro nesta área.");return;}
  box.innerHTML='<div class="admin-hub-record-list">'+rows.map(function(x){
    var title=x.mensagem||x.title||x.content||x.details||"Registro sem texto",author=x.nome||x.author_name||x.reason||"Usuário",acts="";
    if(t==="Comentarios")acts='<button data-a="approve">Aprovar</button><button data-a="hide-comment">Ocultar</button>';
    if(t==="forum_posts")acts='<button data-a="pin">'+(x.is_pinned?"Desafixar":"Fixar")+'</button><button data-a="hide-post">Ocultar</button>';
    if(t==="forum_comments")acts='<button class="danger" data-a="delete-reply">Remover</button>';
    if(t==="content_reports")acts='<button data-a="review-report">Analisar</button><button data-a="resolve-report">Resolver</button><button data-a="dismiss-report">Arquivar</button>';
    return '<article class="admin-hub-record"><div class="admin-hub-record-main"><div class="admin-hub-record-meta"><span>'+esc(author)+'</span><time>'+date(x.created_at)+'</time>'+badge(x.status||x.account_content_state||"active")+'</div><h3>'+esc(short(title,220))+'</h3>'+(x.target_type?'<p>Alvo: '+esc(x.target_type)+" · "+esc(x.target_id)+"</p>":"")+'</div><div class="admin-hub-record-actions">'+acts.replace(/data-a=/g,'data-id="'+esc(x.id)+'" data-table="'+t+'" data-pin="'+String(!!x.is_pinned)+'" data-a=')+"</div></article>";
  }).join("")+"</div>";
  box.querySelectorAll("[data-a]").forEach(function(b){b.onclick=function(){moderate(b,p,t);};});
}
async function moderate(b,p,t){
  var a=b.dataset.a,id=b.dataset.id,r;b.disabled=true;
  try{
    if(a==="approve")r=await state.client.from("Comentarios").update({status:"aprovado",aprovado_em:new Date().toISOString()}).eq("id",id);
    if(a==="hide-comment")r=await state.client.from("Comentarios").update({status:"oculto"}).eq("id",id);
    if(a==="pin")r=await state.client.from("forum_posts").update({is_pinned:b.dataset.pin!=="true"}).eq("id",id);
    if(a==="hide-post")r=await state.client.from("forum_posts").update({status:"oculto"}).eq("id",id);
    if(a==="delete-reply"){if(!confirm("Remover este comentário? A ação será registrada."))return;r=await state.client.from("forum_comments").delete().eq("id",id);}
    var rs={"review-report":"reviewing","resolve-report":"resolved","dismiss-report":"dismissed"};
    if(rs[a])r=await state.client.from("content_reports").update({status:rs[a],reviewed_at:new Date().toISOString(),reviewed_by:state.session.user.id}).eq("id",id);
    if(r&&r.error)throw r.error;await audit(a,t,id);await communityList(p,t);invalidate(["overview","activity"]);
  }catch(e){alert(e.message||"Não foi possível concluir a ação.");}finally{b.disabled=false;}
}
async function users(p){
  var r=await state.client.rpc("admin_list_users");if(r.error)throw r.error;var rows=r.data||[];
  p.innerHTML=heading("CONTAS","Usuários cadastrados","Dados mínimos para gestão de conta, segurança e comprovação dos aceites legais.")+'<label class="admin-hub-search"><i class="fa-solid fa-magnifying-glass"></i><input type="search" placeholder="Buscar nome ou e-mail" data-user-search></label><div class="admin-hub-table-wrap"><table class="admin-hub-table"><thead><tr><th>Usuário</th><th>Cadastro</th><th>Último acesso</th><th>Aceites legais</th><th>Situação</th></tr></thead><tbody>'+rows.map(function(u){var blocked=u.banned_until&&new Date(u.banned_until)>new Date();return '<tr data-user-row data-search="'+esc(((u.display_name||"")+" "+(u.email||"")).toLowerCase())+'"><td><strong>'+esc(u.display_name||"Sem nome")+'</strong><small>'+esc(u.email||"E-mail indisponível")+'</small></td><td>'+date(u.created_at)+'</td><td>'+date(u.last_sign_in_at)+'</td><td><small>Termos '+esc(u.terms_version||"—")+'</small><small>Privacidade '+esc(u.privacy_version||"—")+'</small><small>Diretrizes '+esc(u.guidelines_version||"—")+'</small></td><td>'+badge(blocked?"bloqueado":"active")+"</td></tr>";}).join("")+'</tbody></table></div><div class="admin-hub-privacy-note"><i class="fa-solid fa-lock"></i><p>Senhas, anotações pessoais, favoritos, histórico de leitura, murais privados e arquivos particulares não são exibidos.</p></div>';
  p.querySelector("[data-user-search]").oninput=function(e){var s=e.target.value.trim().toLowerCase();p.querySelectorAll("[data-user-row]").forEach(function(row){row.hidden=!!s&&!row.dataset.search.includes(s);});};setCount("users",rows.length);
}
async function requests(p){
  var a=await Promise.all([query("Sugestoes","created_at",100),query("account_deletion_requests","requested_at",100),query("account_content_review","created_at",100),query("admin_notifications","created_at",100)]);
  var groups=[["Sugestões de casos",a[0],"titulo","descricao","suggestion"],["Exclusão de conta",a[1],"user_email","content_choice","deletion"],["Revisão de contribuições",a[2],"content_type","content_id","review"],["Notificações administrativas",a[3],"title","message","notification"]];
  p.innerHTML=heading("ENTRADAS","Solicitações e contribuições","Organize pedidos que exigem análise ou decisão administrativa.")+'<div class="admin-hub-request-columns">'+groups.map(function(g){return '<section class="admin-hub-card admin-hub-request-card"><header><h3>'+g[0]+'</h3><span>'+g[1].length+'</span></header>'+(g[1].length?g[1].map(function(x){var acts="";if(g[4]==="suggestion")acts='<button data-ra="progress-suggestion">Em análise</button><button data-ra="archive-suggestion">Arquivar</button>';if(g[4]==="deletion"&&x.status!=="completed")acts='<button data-ra="review-deletion">Iniciar análise</button><button data-ra="complete-deletion">Concluir</button>';if(g[4]==="review"&&x.status==="pending")acts='<button data-ra="keep-anonymous">Manter anônimo</button><button data-ra="delete-reviewed">Excluir</button>';if(g[4]==="notification"&&!x.is_read)acts='<button data-ra="read-notification">Marcar como lida</button>';acts=acts.replace(/data-ra=/g,'data-id="'+esc(x.id)+'" data-ra=');return '<article><div>'+badge(x.status||(x.is_read?"lida":"pendente"))+'<time>'+date(x.created_at||x.requested_at)+'</time></div><strong>'+esc(short(x[g[2]]||"Sem identificação",100))+'</strong><p>'+esc(short(x[g[3]]||"",180))+'</p><div class="admin-hub-inline-actions">'+acts+"</div></article>";}).join(""):empty("Nenhum item."))+"</section>";}).join("")+"</div>";
  p.querySelectorAll("[data-ra]").forEach(function(b){b.onclick=function(){requestAction(b,p);};});setCount("requests",a[0].length+a[1].length+a[2].length+a[3].filter(function(x){return !x.is_read;}).length);
}
async function requestAction(b,p){
  var a=b.dataset.ra,id=b.dataset.id,r;b.disabled=true;
  try{
    if(a==="progress-suggestion")r=await state.client.from("Sugestoes").update({status:"em_analise"}).eq("id",id);
    if(a==="archive-suggestion")r=await state.client.from("Sugestoes").update({status:"arquivada"}).eq("id",id);
    if(a==="review-deletion")r=await state.client.from("account_deletion_requests").update({status:"under_review",reviewed_at:new Date().toISOString(),reviewed_by:state.session.user.id}).eq("id",id);
    if(a==="complete-deletion"){if(!confirm("Marcar como concluída somente após executar o procedimento de exclusão. Continuar?"))return;r=await state.client.from("account_deletion_requests").update({status:"completed",completed_at:new Date().toISOString(),reviewed_by:state.session.user.id}).eq("id",id);}
    if(a==="read-notification")r=await state.client.from("admin_notifications").update({is_read:true,read_at:new Date().toISOString()}).eq("id",id);
    if(a==="keep-anonymous")r=await state.client.rpc("review_former_user_content",{p_review_id:id,p_decision:"keep_anonymous"});
    if(a==="delete-reviewed"){if(!confirm("Excluir definitivamente esta contribuição?"))return;r=await state.client.rpc("review_former_user_content",{p_review_id:id,p_decision:"delete"});}
    if(r&&r.error)throw r.error;await audit(a,"request",id);p.dataset.loaded="";await requests(p);invalidate(["overview","activity"]);
  }catch(e){alert(e.message||"Não foi possível atualizar a solicitação.");}finally{b.disabled=false;}
}
async function activity(p){
  var rows=await query("admin_audit_log","created_at",200);
  p.innerHTML=heading("RASTREABILIDADE","Histórico administrativo","Registro imutável das ações realizadas dentro deste painel.")+(rows.length?'<ol class="admin-hub-timeline">'+rows.map(function(x){return '<li><i class="fa-solid fa-file-shield"></i><div><strong>'+esc(x.action)+'</strong><p>'+esc(x.target_type)+(x.target_id?" · "+esc(x.target_id):"")+'</p><time>'+date(x.created_at)+"</time></div></li>";}).join("")+"</ol>":empty("Nenhuma ação administrativa registrada ainda."));
}
async function mount(){
  if(state.mounted)return;var m=document.querySelector("#admin-manager > .admin-manager");if(!m)return;
  state.client=window.obterClienteAdminIsolado?.();state.session=await window.obterSessaoAdminIsolada?.();
  if(!state.client||!state.session?.user||state.session.user.app_metadata?.role!=="admin")throw new Error("Sessão administrativa inválida.");
  shell(m);state.mounted=true;open("overview");
}
var obs=new MutationObserver(function(){if(state.mounted&&!document.querySelector(".admin-hub-shell"))state.mounted=false;if(!state.mounted&&document.querySelector("#admin-manager > .admin-manager"))mount().catch(console.error);});
obs.observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){mount().catch(console.error);},{once:true});else mount().catch(console.error);
})();
