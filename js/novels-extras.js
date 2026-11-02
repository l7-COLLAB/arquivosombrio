"use strict";
/* Account- or device-scoped personal reading filters and in-library chapter alerts.
   Alerts are checked only while the library is open; no push or email is sent. */
(function(){
 let selected="andamento";
 const esc=value=>String(value??"").replace(/[&<>'"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch]));
 const stamp=(value)=>{const n=Date.parse(value||"");return Number.isFinite(n)?n:null};
 function released(ch,now=Date.now()){
  return ch?.status_publicacao==="publicado"&&
   (stamp(ch.publicado_em)===null||stamp(ch.publicado_em)<=now)&&
   (stamp(ch.agendado_para)===null||stamp(ch.agendado_para)<=now);
 }
 function renderPersonalShelf(section,books,entries,completed,wanted){
  if(!section)return;
  const current=new Map((entries||[]).filter(e=>e?.book?.id&&Number.isInteger(e.chapter)).map(e=>[e.book.id,e]));
  const groups={
   andamento:books.filter(b=>current.has(b.id)&&!completed.has(b.id)).map(b=>({book:b,label:"Capítulo "+current.get(b.id).chapter,href:"novel.html?obra="+encodeURIComponent(b.slug)+"&capitulo="+current.get(b.id).chapter})),
   quero:books.filter(b=>wanted.has(b.id)&&!completed.has(b.id)).map(b=>({book:b,label:"Salvo para depois",href:"novel.html?obra="+encodeURIComponent(b.slug)})),
   concluido:books.filter(b=>completed.has(b.id)).map(b=>({book:b,label:"Concluído por você",href:"novel.html?obra="+encodeURIComponent(b.slug)}))
  };
  if(!Object.values(groups).some(g=>g.length)){section.hidden=true;section.innerHTML="";return}
  const options=[["andamento","Em andamento"],["quero","Quero ler"],["concluido","Concluídas"]];
  section.hidden=false;
  section.innerHTML='<div class="novel-section-head"><div><span>SUAS ESTANTES</span><h2>Minha biblioteca</h2></div><p>Veja suas leituras por situação.</p></div>'+
    '<div class="novel-personal-filters" role="group" aria-label="Filtrar biblioteca pessoal">'+
    options.map(([id,label])=>'<button type="button" data-personal-filter="'+id+'" aria-pressed="'+String(selected===id)+'">'+label+' ('+groups[id].length+')</button>').join("")+'</div>'+
    '<div class="novel-personal-results" aria-live="polite">'+
    (groups[selected].length?groups[selected].map(({book,label,href})=>'<a href="'+href+'"><strong>'+esc(book.titulo)+'</strong><small>'+esc(label)+'</small></a>').join(""):
      '<p>Nenhum livro nesta categoria.</p>')+'</div>';
  section.onclick=event=>{
   const button=event.target.closest?.("[data-personal-filter]");
   if(!button||!section.contains(button))return;
   selected=button.dataset.personalFilter;
   if(!Object.prototype.hasOwnProperty.call(groups,selected))selected="andamento";
   renderPersonalShelf(section,books,entries,completed,wanted);
  };
 }
 const key=(book,user)=>"as-novel-chapter-alert-v1-"+(user?.id||"guest")+"-"+book;
 const get=(book,user)=>{
  try{const v=localStorage.getItem(key(book,user));return v!==null&&Number.isInteger(Number(v))&&Number(v)>=0?Number(v):null}catch{return null}
 };
 const put=(book,user,v)=>{
  try{if(v===null)localStorage.removeItem(key(book,user));else localStorage.setItem(key(book,user),String(Math.max(0,Number(v)||0)));return true}catch{return false}
 };
 function wireChapterAlerts(book,chapters,user){
  const section=document.querySelector("#novel-chapter-alert-controls");
  if(!section)return;
  const latest=(chapters||[]).filter(ch=>ch.status_publicacao==="publicado"||ch.status_publicacao===undefined)
   .filter(ch=>released({...ch,status_publicacao:"publicado"})).reduce((max,ch)=>Math.max(max,Number(ch.numero)||0),0);
  const subscribed=get(book.id,user)!==null;
  section.innerHTML='<button id="novel-alert-toggle" type="button" aria-pressed="'+String(subscribed)+'">'+
   (subscribed?"Desativar avisos de capítulos":"Avisar quando houver novos capítulos")+'</button>'+
   '<p id="novel-alert-status" role="status" aria-live="polite">Avisos somente dentro desta biblioteca e neste navegador. Não enviamos e-mails ou notificações push.</p>';
  const button=document.querySelector("#novel-alert-toggle");
  button.onclick=()=>{
   const next=get(book.id,user)===null?latest:null;
   const status=document.querySelector("#novel-alert-status");
   if(!put(book.id,user,next)){if(status)status.textContent="Não foi possível salvar neste navegador.";return}
   button.setAttribute("aria-pressed",String(next!==null));
   button.textContent=next===null?"Avisar quando houver novos capítulos":"Desativar avisos de capítulos";
   if(status)status.textContent=next===null?"Avisos desativados.":"Ativado. Os avisos aparecem quando você abrir a Biblioteca de Novels.";
  };
 }
 async function renderChapterAlerts(section,books,user,sb){
  if(!section)return;
  const subscribed=books.filter(b=>get(b.id,user)!==null);
  if(!subscribed.length){section.hidden=true;section.innerHTML="";return}
  const {data,error}=await sb.from("novel_capitulos")
   .select("novel_id,numero,status_publicacao,publicado_em,agendado_para")
   .in("novel_id",subscribed.map(b=>b.id)).eq("status_publicacao","publicado");
  if(error){section.hidden=true;return}
  const highest=new Map();
  for(const ch of data||[])if(released(ch))highest.set(ch.novel_id,Math.max(highest.get(ch.novel_id)||0,Number(ch.numero)||0));
  const available=subscribed.filter(b=>(highest.get(b.id)||0)>get(b.id,user));
  if(!available.length){section.hidden=true;section.innerHTML="";return}
  section.hidden=false;
  section.innerHTML='<div class="novel-section-head"><div><span>NOVIDADES DAS SUAS OBRAS</span><h2>Novos capítulos</h2></div><p>Avisos das obras que você escolheu acompanhar neste navegador.</p></div>'+
  available.map(b=>'<div class="novel-chapter-alert"><a href="novel.html?obra='+encodeURIComponent(b.slug)+'&capitulo='+highest.get(b.id)+'">'+esc(b.titulo)+' · Capítulo '+highest.get(b.id)+'</a>'+
  '<button type="button" data-chapter-alert-read="'+esc(b.id)+'">Marcar como visto</button></div>').join("");
  section.onclick=event=>{
   const button=event.target.closest?.("[data-chapter-alert-read]");
   if(!button||!section.contains(button))return;
   const book=available.find(b=>b.id===button.dataset.chapterAlertRead);
   if(book&&put(book.id,user,highest.get(book.id)))void renderChapterAlerts(section,books,user,sb);
  };
 }
 window.NovelExtras={renderPersonalShelf,wireChapterAlerts,renderChapterAlerts,released};
})();