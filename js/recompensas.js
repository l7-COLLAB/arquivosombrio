/* Programa de Investigadores: painel somente leitura; nunca calcula ou concede XP no navegador. */
(function(){
 const levels=[{name:'Observador',min:0,icon:'fa-eye'},{name:'Pesquisador',min:200,icon:'fa-book-open'},{name:'Investigador',min:600,icon:'fa-magnifying-glass'},{name:'Perito',min:1500,icon:'fa-fingerprint'},{name:'Arquivista',min:3000,icon:'fa-box-archive'},{name:'Guardião do Arquivo',min:6000,icon:'fa-shield-halved'}];
 const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 async function init(){
  const target=document.querySelector('.arquivo-dashboard > .container')||document.querySelector('.arquivo-dashboard');
  if(!target||typeof obterClienteSupabase!=='function')return;
  const panel=document.createElement('section');panel.className='recompensas';panel.id='programa-investigadores';panel.setAttribute('aria-label','Programa de Investigadores');panel.innerHTML='<span class="recompensas__etiqueta">ARQUIVO SOMBRIO / PROGRESSÃO</span><h2 class="recompensas__titulo">Programa de Investigadores</h2><p class="recompensas__descricao" role="status">Consultando seu registro...</p>';
  target.prepend(panel);
  try{
   const db=await obterClienteSupabase();const auth=await db.auth.getUser();if(!auth.data?.user){panel.remove();return;}
   const uid=auth.data.user.id;
   const [profile,badges,entitlements]=await Promise.all([
    db.from('investigator_profiles').select('lifetime_xp').eq('user_id',uid).maybeSingle(),
    db.from('investigator_badges').select('badge_code').eq('user_id',uid),
    db.from('investigator_entitlements').select('entitlement_code').eq('user_id',uid)
   ]);
   if(profile.error||badges.error||entitlements.error)throw new Error('Registro indisponível');
   const xp=Math.max(0,profile.data?.lifetime_xp||0);const level=[...levels].reverse().find(l=>xp>=l.min)||levels[0];const next=levels[levels.indexOf(level)+1];const pct=next?Math.min(100,Math.max(0,(xp-level.min)/(next.min-level.min)*100)):100;
   panel.innerHTML='<span class="recompensas__etiqueta">ARQUIVO SOMBRIO / REGISTRO DE INVESTIGAÇÃO</span><h2 class="recompensas__titulo">Programa de Investigadores</h2><p class="recompensas__descricao">Sua trajetória de pesquisa e colaboração no Arquivo.</p><div class="recompensas__nivel"><span class="recompensas__insignia" aria-hidden="true"><i class="fa-solid '+level.icon+'"></i></span><div><div class="recompensas__etiqueta">NÍVEL '+String(levels.indexOf(level)+1).padStart(2,'0')+'</div><div class="recompensas__nome">'+level.name+'</div><div class="recompensas__xp">'+xp.toLocaleString('pt-BR')+' XP'+(next?' / '+next.min.toLocaleString('pt-BR')+' XP':' · NÍVEL MÁXIMO')+'</div></div></div><div class="recompensas__trilha" role="progressbar" aria-label="Progresso do nível" aria-valuemin="'+level.min+'" aria-valuemax="'+(next?.min||xp||1)+'" aria-valuenow="'+xp+'"><div class="recompensas__progresso" style="--progresso:'+pct+'%"></div></div><div class="recompensas__grade"><div class="recompensas__dado"><span class="recompensas__numero">'+xp+'</span><span class="recompensas__legenda">Pontos acumulados</span></div><div class="recompensas__dado"><span class="recompensas__numero">'+(badges.data||[]).length+'</span><span class="recompensas__legenda">Medalhas</span></div><div class="recompensas__dado"><span class="recompensas__numero">'+(entitlements.data||[]).length+'</span><span class="recompensas__legenda">Benefícios</span></div></div><p class="recompensas__nota">'+(next?'Próxima classificação: '+escapeHtml(next.name):'Classificação máxima alcançada')+'. As recompensas são registradas pelo servidor após validação.</p>';
  }catch(err){console.warn('Programa de Investigadores:',err);panel.querySelector('.recompensas__descricao').textContent='Seu registro de recompensas está temporariamente indisponível.';}
 }
 document.addEventListener('DOMContentLoaded',init);
})();
