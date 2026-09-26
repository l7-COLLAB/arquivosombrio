/* Experimento reversível. Mantém o DOM e os eventos originais do site.
   Use ?sem3d=1 para desativar localmente nesta sessão. */
(function(){
  'use strict';
  if (!document.body || !document.body.classList.contains('home-page')) return;
  var params;
  try { params = new URLSearchParams(location.search); } catch (_) { params=null; }
  if(params && params.get('sem3d')==='1')return;
  var reduced=false;
  try { reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(_){}
  var coarse=false;
  try { coarse=window.matchMedia('(pointer: coarse)').matches; }catch(_){}
  document.body.classList.add('as-depth-on');
  if(reduced||coarse||window.innerWidth<=760)return;
  var region=document.querySelector('.hero-dossier');
  var panel=document.querySelector('.hero-editorial-frame');
  if(!region||!panel)return;
  var frame=0;
  var x=0,y=0;
  function render(){frame=0;panel.style.setProperty('--depth-x',(-y*3.5).toFixed(2)+'deg');panel.style.setProperty('--depth-y',(x*5.5).toFixed(2)+'deg')}
  region.addEventListener('pointermove',function(event){
    if(event.pointerType==='touch')return;
    var rect=region.getBoundingClientRect();
    x=Math.max(-1,Math.min(1,((event.clientX-rect.left)/rect.width-.5)*2));
    y=Math.max(-1,Math.min(1,((event.clientY-rect.top)/rect.height-.5)*2));
    if(!frame)frame=requestAnimationFrame(render);
  },{passive:true});
  region.addEventListener('pointerleave',function(){x=0;y=0;if(!frame)frame=requestAnimationFrame(render)},{passive:true});
  document.addEventListener('visibilitychange',function(){if(document.hidden){x=0;y=0;if(!frame)frame=requestAnimationFrame(render)}});
})();
