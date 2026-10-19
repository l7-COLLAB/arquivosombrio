/* Etapa 12 — recomendações editoriais verificáveis: mesma categoria/coleção.
   Apenas itens publicados, nunca associações criminais inferidas. */
(function(){
"use strict";
function render(target,records,opts){
  if(!target || !Array.isArray(records))return;
  const old=target.querySelector(".as-related-reading");
  if(old)old.remove();
  const cfg=opts||{}, current=String(cfg.currentId||"");
  const rows=[], seen=new Set();
  records.forEach(function(item){
    if(!item || !item.id || !item.titulo)return;
    if(String(item.id)===current || seen.has(String(item.id)))return;
    if(String(item.status_publicacao||"").toLowerCase()!=="publicado")return;
    seen.add(String(item.id));rows.push(item);
  });
  if(!rows.length)return;
  const section=document.createElement("section");
  section.className="as-related-reading";
  section.setAttribute("aria-label","Continue explorando o acervo");
  const eyebrow=document.createElement("p");
  eyebrow.className="as-related-eyebrow";
  eyebrow.textContent="CONTINUE NO ARQUIVO";
  const title=document.createElement("h2");
  title.textContent=cfg.heading||"Outras leituras do acervo";
  const note=document.createElement("p");
  note.className="as-related-note";
  note.textContent=cfg.note||"Registros publicados na mesma coleção. A indicação não significa ligação factual entre os casos.";
  const list=document.createElement("div");
  list.className="as-related-list";
  rows.slice(0,3).forEach(function(item){
    const a=document.createElement("a");
    const route=cfg.route||"dossies.html";
    const value=encodeURIComponent(String(item.id));
    a.href=route+"?id="+value+(cfg.anchor||"");
    a.className="as-related-link";
    const badge=document.createElement("span");
    badge.textContent=String(item.categoria||cfg.label||"ARQUIVO");
    const name=document.createElement("strong");
    name.textContent=String(item.titulo);
    const action=document.createElement("small");
    action.textContent="Consultar arquivo →";
    a.append(badge,name,action);
    list.appendChild(a);
  });
  section.append(eyebrow,title,note,list);
  const more=document.createElement("a");
  more.className="as-related-more";
  more.href=cfg.archive||"dossies.html";
  more.textContent="Explorar todo o acervo →";
  section.appendChild(more);
  target.appendChild(section);
}
window.ArquivoLeiturasRelacionadas=Object.freeze({render:render});
})();
