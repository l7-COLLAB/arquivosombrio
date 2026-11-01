"use strict";
const SUPABASE_URL="https://iuhotznurbyujzbyhizf.supabase.co",KEY="sb_publishable_bpAZ5EhYLIuVoE4Q97s_-A_XQwwRxUj";
const sb=window.supabase.createClient(SUPABASE_URL,KEY);
const esc=s=>String(s??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const params=new URLSearchParams(location.search);const slug=params.get("obra"),hasChapter=params.has("capitulo"),cap=hasChapter?Number(params.get("capitulo")):null;
const progressUrl=(book,chapter)=>"novel.html?obra="+encodeURIComponent(book)+"&capitulo="+encodeURIComponent(chapter);

const guestProgressKey=id=>"as-novel-guest-progress-v1-"+id;
function readGuestProgress(id){
 try{const p=JSON.parse(localStorage.getItem(guestProgressKey(id))||"null");return p&&Number.isInteger(p.chapter)&&p.chapter>=0&&Number.isFinite(p.scroll)&&p.scroll>=0&&Number.isFinite(p.percent)&&p.percent>=0&&p.percent<=100?p:null}catch{return null}
}
function renderGuestContinue(section,books){
 const rows=books.map(b=>({book:b,progress:readGuestProgress(b.id)})).filter(x=>x.progress).sort((a,b)=>b.progress.updated-a.progress.updated).slice(0,3);
 if(!rows.length)return;
 section.hidden=false;
 section.innerHTML='<div class="novel-section-head"><div><span>SUA LEITURA NESTE DISPOSITIVO</span><h2>Continuar lendo</h2></div><p>Sem login: o progresso fica salvo apenas neste navegador.</p></div><div class="novel-continue-grid">'+rows.map(({book:b,progress:p})=>'<article class="novel-continue-card">'+cover(b)+'<div><h3>'+esc(b.titulo)+'</h3><p>Capítulo '+p.chapter+'</p><div class="novel-progress-track" role="progressbar" aria-label="Progresso do capítulo" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+Math.round(p.percent)+'"><span style="width:'+p.percent+'%"></span></div><small>'+Math.round(p.percent)+'% deste capítulo</small><a class="novel-button" href="'+progressUrl(b.slug,p.chapter)+'">Continuar lendo →</a></div></article>').join("")+'</div>';
}

function setNovelMetadata(title,description){
 document.title=title;
 const summary=String(description||"").replace(/\s+/g," ").trim().slice(0,155);
 let meta=document.querySelector('meta[name="description"]');
 if(!meta){meta=document.createElement("meta");meta.name="description";document.head.appendChild(meta)}
 meta.content=summary;
 let social=document.querySelector('meta[property="og:title"]');
 if(!social){social=document.createElement("meta");social.setAttribute("property","og:title");document.head.appendChild(social)}
 social.content=title;
 let ogDescription=document.querySelector('meta[property="og:description"]');
 if(!ogDescription){ogDescription=document.createElement("meta");ogDescription.setAttribute("property","og:description");document.head.appendChild(ogDescription)}
 ogDescription.content=summary;
}

async function getReadingProgress(userId,novelIds){
 if(!userId||!novelIds.length)return [];
 const {data,error}=await sb.from("novel_progresso").select("novel_id,capitulo_id,percentual,scroll_y,atualizado_em").eq("user_id",userId).in("novel_id",novelIds).order("atualizado_em",{ascending:false});
 if(error){console.warn("Progresso indisponível",error);return []}return data||[];
}
async function chapterNumbers(chapterIds){
 if(!chapterIds.length)return new Map();
 const {data,error}=await sb.from("novel_capitulos").select("id,numero,status_publicacao").in("id",chapterIds);
 if(error){console.warn("Capítulos do progresso indisponíveis",error);return new Map()}
 return new Map((data||[]).filter(c=>c.status_publicacao==="publicado").map(c=>[c.id,c.numero]));
}
function cover(x,cl="novel-cover"){return x.imagem_capa?'<img class="'+cl+'" src="'+esc(x.imagem_capa)+'" alt="Capa de '+esc(x.titulo)+'">':'<div class="'+cl+'"></div>'}

const novelThemeRules=[
 {id:"vestigios",title:"Enigmas e vestígios",description:"Mistérios guiados por provas, pistas e situações aparentemente impossíveis.",match:g=>g.includes("pericia")||g.includes("quarto fechado")},
 {id:"sombras",title:"Segredos na penumbra",description:"Suspense, atmosfera gótica e histórias que revelam seus segredos aos poucos.",match:g=>g.includes("suspense")||g.includes("gotico")||g.includes("terror")},
 {id:"investigacoes",title:"Investigações clássicas",description:"Detetives, crimes e enigmas para acompanhar pista por pista.",match:g=>g.includes("investigacao")||g.includes("misterio")}
];
function normalizedNovelGenres(book){
 const genres=Array.isArray(book.generos)?book.generos:[];
 return genres.join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
}
function selectNovelThemeShelves(books){
 const assigned=new Set();
 return novelThemeRules.map(rule=>{
  const selected=books.filter(book=>!assigned.has(book.id)&&rule.match(normalizedNovelGenres(book))).slice(0,3);
  selected.forEach(book=>assigned.add(book.id));
  return {...rule,books:selected};
 }).filter(shelf=>shelf.books.length>0);
}
function renderNovelThemeShelves(section,books){
 if(!section||!books.length)return;
 const shelves=selectNovelThemeShelves(books);
 if(!shelves.length)return;
 section.innerHTML='<div class="novel-section-head"><div><span>MAPAS DE LEITURA</span><h2>Explore por atmosfera</h2></div><p>Seleções organizadas a partir dos gêneros das obras publicadas.</p></div>'+
  shelves.map(shelf=>'<section class="novel-theme-shelf" aria-labelledby="novel-theme-'+shelf.id+'"><div class="novel-theme-heading"><div><h3 id="novel-theme-'+shelf.id+'">'+shelf.title+'</h3><p>'+shelf.description+'</p></div><span class="novel-theme-count">'+shelf.books.length+' '+(shelf.books.length===1?'obra':'obras')+'</span></div><div class="novel-theme-grid">'+
   shelf.books.map(book=>'<a class="novel-theme-item" href="novel.html?obra='+encodeURIComponent(book.slug)+'">'+cover(book,"novel-theme-cover")+'<span class="novel-theme-copy"><strong>'+esc(book.titulo)+'</strong><small>'+esc(book.autor_nome||"Autor não informado")+'</small><em>Conhecer a obra</em></span></a>').join("")+
  '</div></section>').join("");
 section.hidden=false;
}


const relatedGenreFamilies=["gotico","suspense","misterio","investigacao","pericia","terror"];
function normalizeRelatedGenre(value){
 return String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
}
function relatedGenreScore(a,b){
 if(a===b)return 3;
 if(a.length>=5&&b.startsWith(a+" ")||b.length>=5&&a.startsWith(b+" "))return 2;
 return relatedGenreFamilies.some(family=>a.includes(family)&&b.includes(family))?1:0;
}
function findRelatedNovels(current,books,limit=3){
 const own=(Array.isArray(current?.generos)?current.generos:[]).map(normalizeRelatedGenre).filter(Boolean);
 if(!own.length||!Array.isArray(books))return [];
 return books.filter(book=>book&&book.status_publicacao==="publicado"&&book.id!==current.id&&book.slug!==current.slug&&typeof book.slug==="string"&&book.slug.trim()&&book.titulo)
  .map(book=>{
   const genres=Array.isArray(book.generos)?book.generos:[];
   let score=0,match="";
   for(const raw of genres){
    const genre=normalizeRelatedGenre(raw);
    const relevance=own.reduce((best,g)=>Math.max(best,genre?relatedGenreScore(g,genre):0),0);
    if(relevance>0){score+=relevance;if(!match)match=String(raw);}
   }
   return {book,score,match};
  })
  .filter(item=>item.score>0)
  .sort((a,b)=>b.score-a.score||String(a.book.titulo).localeCompare(String(b.book.titulo),"pt-BR"))
  .slice(0,Math.max(0,Math.min(3,Number(limit)||3)));
}
async function loadRelatedNovels(current,section,atEnd=false){
 if(!section)return;
 try{
  const {data,error}=await sb.from("novels").select("id,slug,titulo,autor_nome,generos,imagem_capa,status_publicacao").eq("status_publicacao","publicado").limit(60);
  if(error)return;
  const suggestions=findRelatedNovels(current,data||[]);
  if(!suggestions.length)return;
  section.innerHTML='<div class="novel-related-head"><span>CONEXÕES LITERÁRIAS</span><h2 id="novel-related-heading">'+(atEnd?"Sua próxima leitura":"Outras obras para investigar")+'</h2><p>Livros relacionados pelos gêneros cadastrados na biblioteca.</p></div><div class="novel-related-grid">'+
   suggestions.map(({book,match})=>'<a class="novel-related-card" href="novel.html?obra='+encodeURIComponent(book.slug)+'">'+cover(book,"novel-related-cover")+'<span class="novel-related-info"><strong>'+esc(book.titulo)+'</strong><small>'+esc(book.autor_nome||"Autor não informado")+'</small><em>Afinidade: '+esc(match)+'</em><span class="novel-related-link">Conhecer a obra →</span></span></a>').join("")+
   '</div>';
  section.hidden=false;
 }catch(error){console.warn("Sugestões de novels indisponíveis",error);}
}

async function catalog(){
 const root=document.querySelector("#novel-grid");if(!root)return;
 const {data,error}=await sb.from("novels").select("*").eq("status_publicacao","publicado").order("destaque",{ascending:false}).order("publicado_em",{ascending:false});
 if(error){root.innerHTML='<p class="empty">Não foi possível carregar o acervo.</p>';return}
 const books=data||[],input=document.querySelector("#novel-search"),genre=document.querySelector("#novel-genre");
 const gs=[...new Set(books.flatMap(x=>x.generos||[]))].sort();
 genre.innerHTML='<option value="">Todas as categorias</option>'+gs.map(g=>'<option>'+esc(g)+'</option>').join("");
 const draw=()=>{const q=(input.value||"").toLowerCase(),g=genre.value;const rows=books.filter(x=>(!q||[x.titulo,x.autor_nome,x.sinopse,...(x.tags||[])].join(" ").toLowerCase().includes(q))&&(!g||(x.generos||[]).includes(g)));root.innerHTML=rows.map(x=>'<a class="novel-card" href="novel.html?obra='+encodeURIComponent(x.slug)+'">'+cover(x)+'<h2>'+esc(x.titulo)+'</h2><p>'+esc(x.autor_nome)+' · '+esc((x.status_obra||"").replaceAll("_"," "))+'</p><div class="novel-tags">'+(x.generos||[]).slice(0,3).map(t=>'<span>'+esc(t)+'</span>').join("")+'</div></a>').join("")||'<p class="empty">Nenhuma obra encontrada.</p>'};
 input.oninput=draw;genre.onchange=draw;draw();
 const starter=document.querySelector("#novel-starter");
 if(starter&&books.length){
  const suggestions=books.slice(0,Math.min(3,books.length));
  starter.hidden=false;
  starter.innerHTML='<div class="novel-section-head"><div><span>PRIMEIRAS PÁGINAS</span><h2>Comece por aqui</h2></div><p>Uma seleção de obras do acervo para descobrir sua próxima leitura.</p></div><div class="novel-starter-grid">'+suggestions.map(x=>'<a class="novel-starter-item" href="novel.html?obra='+encodeURIComponent(x.slug)+'">'+cover(x)+'<span><strong>'+esc(x.titulo)+'</strong><small>'+esc(x.autor_nome||"Autor não informado")+'</small><em>Conhecer a obra →</em></span></a>').join("")+'</div>';
 }
 renderNovelThemeShelves(document.querySelector("#novel-themes"),books);
 const section=document.querySelector("#novel-continue");if(!section||!books.length)return;
 const {data:{user}}=await sb.auth.getUser();if(!user){renderGuestContinue(section,books);return;}
 const progress=await getReadingProgress(user.id,books.map(x=>x.id));if(!progress.length)return;
 const nums=await chapterNumbers(progress.map(x=>x.capitulo_id));const byId=new Map(books.map(b=>[b.id,b]));
 const items=progress.filter(p=>byId.has(p.novel_id)&&nums.has(p.capitulo_id));
 if(!items.length)return;
 section.hidden=false;
 section.innerHTML='<div class="novel-section-head"><div><span>SUA LEITURA</span><h2>Continuar lendo</h2></div><p>Retome de onde parou.</p></div><div class="novel-continue-grid">'+items.map(p=>{const b=byId.get(p.novel_id),num=nums.get(p.capitulo_id),pct=Math.max(0,Math.min(100,Number(p.percentual)||0));return '<article class="novel-continue-card">'+cover(b)+'<div><h3>'+esc(b.titulo)+'</h3><p>Capítulo '+num+'</p><div class="novel-progress-track" role="progressbar" aria-label="Progresso do capítulo" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+Math.round(pct)+'"><span style="width:'+pct+'%"></span></div><small>'+Math.round(pct)+'% deste capítulo</small><a class="novel-button" href="'+progressUrl(b.slug,num)+'">Continuar lendo →</a></div></article>'}).join("")+'</div>';
}
async function detail(){const root=document.querySelector("#novel-detail");if(!root||!slug||hasChapter)return;root.hidden=false;const {data:n}=await sb.from("novels").select("*").eq("slug",slug).eq("status_publicacao","publicado").single();if(!n){root.innerHTML='<p class="empty">Obra não encontrada.</p>';return}const {data:chs}=await sb.from("novel_capitulos").select("id,numero,titulo,palavras,publicado_em").eq("novel_id",n.id).eq("status_publicacao","publicado").order("numero");setNovelMetadata(n.titulo+" — Novels · Arquivo Sombrio",n.sinopse||"Leia "+n.titulo+" na Biblioteca de Novels do Arquivo Sombrio.");root.innerHTML='<div>'+cover(n,"novel-detail-cover")+'</div><div><p class="novel-kicker">NOVEL · '+esc(n.status_obra.replaceAll("_"," ").toUpperCase())+'</p><h1>'+esc(n.titulo)+'</h1><p>'+esc(n.autor_nome)+'</p><div class="novel-tags">'+(n.generos||[]).map(t=>'<span>'+esc(t)+'</span>').join("")+'</div><p class="novel-synopsis">'+esc(n.sinopse)+'</p>'+(chs?.length?'<a class="novel-button" href="novel.html?obra='+encodeURIComponent(slug)+'&capitulo='+chs[0].numero+'">Começar a ler</a><button class="novel-button" id="novel-library-toggle" type="button">Adicionar às minhas leituras</button>':'')+'<section class="chapter-area"><h2>Capítulos</h2><div class="chapter-list">'+(chs||[]).map(c=>'<a class="chapter-link" href="novel.html?obra='+encodeURIComponent(slug)+'&capitulo='+c.numero+'"><span>Capítulo '+c.numero+' · '+esc(c.titulo)+'</span><small>'+c.palavras+' palavras</small></a>').join("")+'</div></section></div><section id="novel-related" class="novel-related" aria-labelledby="novel-related-heading" hidden></section>';void loadRelatedNovels(n,document.querySelector("#novel-related"));const {data:{user}}=await sb.auth.getUser();
 if(user&&chs?.length){
  const progress=await getReadingProgress(user.id,[n.id]);
  const current=chs.find(ch=>ch.id===progress[0]?.capitulo_id);
  if(current){const start=root.querySelector('a.novel-button');if(start){start.href=progressUrl(slug,current.numero);start.textContent="Continuar lendo · Capítulo "+current.numero;}}
 }
 const toggle=document.querySelector("#novel-library-toggle");if(toggle&&user){const {data:saved}=await sb.from("novel_biblioteca").select("novel_id").eq("user_id",user.id).eq("novel_id",n.id).maybeSingle();let active=!!saved;const label=()=>toggle.textContent=active?"Remover das minhas leituras":"Adicionar às minhas leituras";label();toggle.onclick=async()=>{if(active){const {error}=await sb.from("novel_biblioteca").delete().eq("user_id",user.id).eq("novel_id",n.id);if(!error)active=false}else{const {error}=await sb.from("novel_biblioteca").insert({user_id:user.id,novel_id:n.id,estado:"acompanhando"});if(!error)active=true}label()}}else if(toggle){toggle.onclick=()=>location.href="meu-arquivo.html"}}
async function reader(){const root=document.querySelector("#novel-reader");if(!root||!slug||!hasChapter||!Number.isInteger(cap)||cap<0)return;const detailRoot=document.querySelector("#novel-detail");if(detailRoot)detailRoot.hidden=true;const {data:n}=await sb.from("novels").select("id,titulo,slug,generos").eq("slug",slug).eq("status_publicacao","publicado").single();if(!n){root.hidden=false;root.innerHTML='<p class="empty">Obra indisponível.</p>';return;}const {data:chs}=await sb.from("novel_capitulos").select("id,numero,titulo,conteudo").eq("novel_id",n.id).eq("status_publicacao","publicado").order("numero");const i=chs.findIndex(x=>x.numero===cap),c=chs[i];if(!c){root.innerHTML='<p class="empty">Capítulo não encontrado.</p>';return}document.querySelector("#novel-detail").hidden=true;root.hidden=false;setNovelMetadata("Capítulo "+c.numero+" · "+n.titulo+" — Arquivo Sombrio","Leia o capítulo "+c.numero+": "+c.titulo+" da obra "+n.titulo+" na Biblioteca de Novels do Arquivo Sombrio.");const body=esc(c.conteudo).split(/\n\s*\n/).filter(Boolean).map(p=>"<p>"+p.replaceAll("\n","<br>")+"</p>").join("");root.innerHTML='<a class="novel-home" href="novel.html?obra='+encodeURIComponent(slug)+'">← '+esc(n.titulo)+'</a><p class="novel-kicker">CAPÍTULO '+c.numero+'</p><h1>'+esc(c.titulo)+'</h1><div class="reader-settings"><label for="chapter-jump">Capítulo</label><select id="chapter-jump" aria-label="Ir para capítulo">'+chs.map(ch=>'<option value="'+ch.numero+'"'+(ch.numero===c.numero?' selected':'')+'>'+ch.numero+' · '+esc(ch.titulo)+'</option>').join('')+'</select><button id="font-down">A−</button><button id="font-up">A+</button></div><article class="reader-body" id="reader-body">'+body+'</article><nav class="reader-nav">'+(chs[i-1]?'<a class="novel-home" href="novel.html?obra='+encodeURIComponent(slug)+'&capitulo='+chs[i-1].numero+'">← Anterior</a>':'<span></span>')+(chs[i+1]?'<a class="novel-home" href="novel.html?obra='+encodeURIComponent(slug)+'&capitulo='+chs[i+1].numero+'">Próximo →</a>':'<span>Fim disponível</span>')+'</nav>'+(chs[i+1]?'':'<section id="novel-related" class="novel-related novel-related-reader" aria-labelledby="novel-related-heading" hidden></section>');if(!chs[i+1])void loadRelatedNovels(n,document.querySelector("#novel-related"),true);document.querySelector("#chapter-jump").onchange=e=>{location.href="novel.html?obra="+encodeURIComponent(slug)+"&capitulo="+encodeURIComponent(e.target.value)};const prefsKey="as-novel-reader-v1";
const defaults={theme:"archive",font:"Georgia",size:1.16,spacing:"comfortable",immersive:false};
let prefs;
try{prefs={...defaults,...JSON.parse(localStorage.getItem(prefsKey)||"{}")}}catch{prefs={...defaults}}
const themes=["archive","paper","night"],fonts=["Georgia","Verdana","Arial"],spacings=["compact","comfortable","wide"];
if(!themes.includes(prefs.theme))prefs.theme=defaults.theme;
if(!fonts.includes(prefs.font))prefs.font=defaults.font;
if(!spacings.includes(prefs.spacing))prefs.spacing=defaults.spacing;
prefs.size=Math.max(.95,Math.min(1.65,Number(prefs.size)||defaults.size));
const settings=document.querySelector(".reader-settings");
root.insertAdjacentHTML("afterbegin",'<div class="reader-floating"><a class="reader-exit" href="novels.html" aria-label="Sair da leitura e voltar à biblioteca" title="Voltar à biblioteca">←</a><button type="button" class="reader-menu-toggle" id="reader-menu-toggle" aria-label="Mostrar controles de leitura" aria-expanded="false" title="Controles de leitura">Aa</button></div>');
const menuToggle=document.querySelector("#reader-menu-toggle");
menuToggle.onclick=()=>{const opened=document.body.classList.toggle("reader-controls-open");menuToggle.setAttribute("aria-expanded",String(opened));menuToggle.setAttribute("aria-label",opened?"Ocultar controles de leitura":"Mostrar controles de leitura")};

settings.insertAdjacentHTML("beforeend",'<button type="button" id="reader-options" aria-expanded="false" aria-controls="reader-preferences">Aa · Aparência</button><button type="button" id="reader-immersive" aria-pressed="false">Modo imersivo</button>');
settings.insertAdjacentHTML("afterend",'<section id="reader-preferences" class="reader-preferences" hidden aria-label="Preferências de leitura"><div class="reader-pref-row"><span>Tema</span><div role="group" aria-label="Tema"><button data-reader-theme="archive">Arquivo</button><button data-reader-theme="paper">Papel antigo</button><button data-reader-theme="night">Noturno</button></div></div><div class="reader-pref-row"><label for="reader-font">Fonte</label><select id="reader-font"><option>Georgia</option><option>Verdana</option><option>Arial</option></select></div><div class="reader-pref-row"><label for="reader-spacing">Espaçamento</label><select id="reader-spacing"><option value="compact">Compacto</option><option value="comfortable">Confortável</option><option value="wide">Amplo</option></select></div><button type="button" id="reader-reset">Restaurar padrão</button></section>');
const panel=document.querySelector("#reader-preferences"),bodyEl=document.querySelector("#reader-body"),immersiveButton=document.querySelector("#reader-immersive");
const persist=()=>{try{localStorage.setItem(prefsKey,JSON.stringify(prefs))}catch{}};
const apply=()=>{document.body.dataset.readerTheme=prefs.theme;document.body.classList.toggle("reader-immersive",!!prefs.immersive);bodyEl.style.fontSize=prefs.size+"rem";bodyEl.style.fontFamily=prefs.font+", Georgia, serif";bodyEl.dataset.spacing=prefs.spacing;document.querySelector("#reader-font").value=prefs.font;document.querySelector("#reader-spacing").value=prefs.spacing;document.querySelectorAll("[data-reader-theme]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.readerTheme===prefs.theme)));immersiveButton.setAttribute("aria-pressed",String(!!prefs.immersive));immersiveButton.textContent=prefs.immersive?"Sair do modo imersivo":"Modo imersivo";persist()};
const optionsButton=document.querySelector("#reader-options");
const closeOptions=()=>{panel.hidden=true;optionsButton.setAttribute("aria-expanded","false")};
optionsButton.onclick=()=>{panel.hidden=!panel.hidden;optionsButton.setAttribute("aria-expanded",String(!panel.hidden))};
document.addEventListener("pointerdown",e=>{if(!panel.hidden&&!panel.contains(e.target)&&e.target!==optionsButton)closeOptions()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeOptions();document.body.classList.remove("reader-controls-open");menuToggle.setAttribute("aria-expanded","false")}});

document.querySelectorAll("[data-reader-theme]").forEach(b=>b.onclick=()=>{prefs.theme=b.dataset.readerTheme;apply()});
document.querySelector("#reader-font").onchange=e=>{prefs.font=e.target.value;apply()};
document.querySelector("#reader-spacing").onchange=e=>{prefs.spacing=e.target.value;apply()};
document.querySelector("#font-up").onclick=()=>{prefs.size=Math.min(1.65,Math.round((prefs.size+.08)*100)/100);apply()};
document.querySelector("#font-down").onclick=()=>{prefs.size=Math.max(.95,Math.round((prefs.size-.08)*100)/100);apply()};
immersiveButton.onclick=()=>{prefs.immersive=!prefs.immersive;closeOptions();document.body.classList.remove("reader-controls-open");menuToggle.setAttribute("aria-expanded","false");apply()};
document.querySelector("#reader-reset").onclick=()=>{prefs={...defaults};apply()};
apply();
const {data:{user}}=await sb.auth.getUser();
if(!user){
 const key=guestProgressKey(n.id);
 const maxScroll=()=>Math.max(0,document.documentElement.scrollHeight-innerHeight);
 const saved=readGuestProgress(n.id);
 if(saved?.chapter===c.numero&&saved.scroll>0){
  if(document.fonts?.ready)await document.fonts.ready;
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  scrollTo({top:Math.min(saved.scroll,maxScroll()),behavior:"instant"});
 }
 let timer=null;
 const save=()=>{clearTimeout(timer);const max=maxScroll();const data={chapter:c.numero,scroll:Math.round(scrollY),percent:max?Math.min(100,Math.round(scrollY/max*100)):0,updated:Date.now()};try{localStorage.setItem(key,JSON.stringify(data))}catch{}};
 addEventListener("scroll",()=>{clearTimeout(timer);timer=setTimeout(save,900)},{passive:true});
 document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")save()});
 addEventListener("pagehide",save);
 // A chapter visit establishes the continuation link without requiring a scroll.
 if(saved?.chapter!==c.numero)save();
}
if(user){
 let restoring=true,dirty=false,saving=false,timer=null,lastSaved=-1;
 const key="novel-progress-"+user.id+"-"+n.id;
 const maxScroll=()=>Math.max(0,document.documentElement.scrollHeight-innerHeight);
 const position=()=>{const max=maxScroll();return {user_id:user.id,novel_id:n.id,capitulo_id:c.id,percentual:max?Math.min(100,Math.max(0,Math.round(scrollY/max*10000)/100)):0,scroll_y:Math.round(scrollY),atualizado_em:new Date().toISOString()}};
 const save=async()=>{if(restoring||!dirty||saving)return;saving=true;dirty=false;const row=position();try{localStorage.setItem(key,JSON.stringify(row))}catch{}
  const {error}=await sb.from("novel_progresso").upsert(row,{onConflict:"user_id,novel_id"});
  saving=false;if(error){console.warn("Falha ao salvar progresso",error);dirty=true}else lastSaved=row.scroll_y;
  if(dirty&&document.visibilityState==="visible")schedule();
 };
 const schedule=()=>{clearTimeout(timer);timer=setTimeout(save,1100)};
 const mark=()=>{if(restoring)return;const y=Math.round(scrollY);if(y===lastSaved)return;dirty=true;schedule()};
 addEventListener("scroll",mark,{passive:true});
 document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden"){clearTimeout(timer);void save()}else if(dirty)schedule()});
 addEventListener("pagehide",()=>{clearTimeout(timer);void save()});
 const {data:server}=await sb.from("novel_progresso").select("scroll_y,capitulo_id,atualizado_em").eq("user_id",user.id).eq("novel_id",n.id).maybeSingle();
 let local=null;try{local=JSON.parse(localStorage.getItem(key)||"null")}catch{}
 const candidate=local?.capitulo_id===c.id&&(!server||new Date(local.atualizado_em)>new Date(server.atualizado_em))?local:server;
 if(candidate?.capitulo_id===c.id&&candidate.scroll_y>0){
  // Wait for fonts and layout before restoring; do not save the initial jump as a new position.
  if(document.fonts?.ready)await document.fonts.ready;
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  scrollTo({top:Math.min(candidate.scroll_y,maxScroll()),behavior:"instant"});
 }
 restoring=false;lastSaved=Math.round(scrollY);
 // Entering another chapter establishes its own position even before scrolling.
 if(!server||server.capitulo_id!==c.id){dirty=true;schedule()}
}
}

document.addEventListener("DOMContentLoaded",()=>{for(const [fn,selector] of [[catalog,"#novel-grid"],[detail,"#novel-detail"],[reader,"#novel-reader"]]){Promise.resolve().then(fn).catch(err=>{console.error("Novels:",err);const el=document.querySelector(selector);if(el)el.innerHTML='<div class="novel-notice"><h2>Não foi possível carregar o acervo</h2><p>Verifique sua conexão e tente novamente.</p><button class="novel-button" onclick="location.reload()">Tentar novamente</button></div>'})}});