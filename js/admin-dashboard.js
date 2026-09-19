
(function () {
"use strict";
var state = { client:null, session:null, mounted:false, view:"overview" };
var labels = {
  overview:"Visão geral", content:"Conteúdos e edição", community:"Comunidade",
  users:"Usuários", requests:"Solicitações", activity:"Histórico administrativo"
};
var icons = {
  overview:"fa-chart-line", content:"fa-folder-tree", community:"fa-comments",
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
  root.innerHTML='<aside class="admin-hub-sidebar"><div class="admin-hub-brand"><span>ÁREA RESTRITA</span><strong>Central Administrativa</strong><small>Arquivo Sombrio</small></div><nav aria-label="Menu administrativo">'+nav+'</nav><div class="admin-hub-sidebar-footer"><p><i class="fa-solid fa-shield-halved"></i> Acesso protegido</p><button type="button" data-admin-hub-logout><i class="fa-solid fa-right-from-bracket"></i> Sair</button></div></aside><div class="admin-hub-main"><header class="admin-hub-topbar"><button type="button" class="admin-hub-menu-toggle" aria-label="Abrir menu"><i class="fa-solid fa-bars"></i></button><div><span>PAINEL ADMINISTRATIVO</span><h1 data-admin-hub-title>Visão geral</h1></div><button type="button" class="admin-hub-refresh" aria-label="Atualizar"><i class="fa-solid fa-rotate"></i></button></header><div class="admin-hub-panels"><section class="admin-hub-panel" data-admin-hub-panel="overview"></section><section class="admin-hub-panel" data-admin-hub-panel="community" hidden></section><section class="admin-hub-panel" data-admin-hub-panel="users" hidden></section><section class="admin-hub-panel" data-admin-hub-panel="requests" hidden></section><section class="admin-hub-panel" data-admin-hub-panel="activity" hidden></section></div></div>';
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
  try{if(v==="overview")await overview(p);if(v==="community")await community(p);if(v==="users")await users(p);if(v==="requests")await requests(p);if(v==="activity")await activity(p);p.dataset.loaded="1";}
  catch(e){console.error(e);p.innerHTML='<div class="admin-hub-error"><i class="fa-solid fa-triangle-exclamation"></i><p>'+esc(e.message||"Não foi possível carregar esta área.")+"</p></div>";}
}
async function overview(p){
  var all=await Promise.all([state.client.rpc("admin_list_users"),count("Comentarios"),count("forum_posts"),count("content_reports","status","pending"),count("Sugestoes","status","nova"),count("account_deletion_requests","status","pending"),count("admin_notifications","is_read",false)]);
  if(all[0].error)throw all[0].error;var u=(all[0].data||[]).length,c=all[1]+all[2],pending=all[3]+all[4]+all[5]+all[6];
  p.innerHTML='<div class="admin-hub-intro"><div><span>CONTROLE CENTRAL</span><h2>Visão geral do Arquivo</h2><p>Acompanhe conteúdos, comunidade, usuários e solicitações sem acessar diretamente o painel técnico do banco.</p></div><time>'+esc(new Date().toLocaleDateString("pt-BR",{dateStyle:"long"}))+'</time></div><div class="admin-hub-metrics"><button data-go="users"><i class="fa-solid fa-users"></i><span>'+u+'</span><small>usuários cadastrados</small></button><button data-go="community"><i class="fa-solid fa-comment-dots"></i><span>'+c+'</span><small>publicações e comentários</small></button><button data-go="requests"><i class="fa-solid fa-shield-halved"></i><span>'+pending+'</span><small>itens aguardando atenção</small></button><button data-go="content"><i class="fa-solid fa-file-pen"></i><span>ABRIR</span><small>conteúdos e edição</small></button></div><div class="admin-hub-grid"><article class="admin-hub-card"><header><i class="fa-solid fa-list-check"></i><h3>Fila de trabalho</h3></header><ul class="admin-hub-checklist"><li><span>Denúncias pendentes</span><strong>'+all[3]+'</strong></li><li><span>Sugestões novas</span><strong>'+all[4]+'</strong></li><li><span>Exclusões de conta</span><strong>'+all[5]+'</strong></li><li><span>Notificações não lidas</span><strong>'+all[6]+'</strong></li></ul></article><article class="admin-hub-card admin-hub-privacy-card"><header><i class="fa-solid fa-user-lock"></i><h3>Limite de privacidade</h3></header><p>O painel mostra somente dados necessários à administração, conteúdo enviado, aceites legais e solicitações.</p><p>Anotações pessoais, favoritos, histórico de leitura, murais privados e evidências salvas permanecem privados.</p></article></div>';
  p.querySelectorAll("[data-go]").forEach(function(b){b.onclick=function(){open(b.dataset.go);};});setCount("users",u);setCount("community",c);setCount("requests",pending);
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
