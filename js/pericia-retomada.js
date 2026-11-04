/* Próxima etapa de Perícia: calculada a partir do estado atual, não dos melhores resultados históricos. */
(function(root){
"use strict";
var names=["trilha","custodia","papiloscopia"];
var titles={trilha:"Trilha de Perícia",custodia:"Cadeia de Custódia",papiloscopia:"Papiloscopia"};
var chapters=["metodo","manchas","manchas","comparacao","comparacao","hemacias","hipoteses","custodia","hipoteses"];
function stateFor(sync,code,row){
  return sync.normalise(code,row&&row.state)||sync.defaultState(code);
}
function routeFor(sync,code,row){
  var state=stateFor(sync,code,row),value=sync.metrics(code,state);
  var active=false,href="",guide="",place="",note="",label="";
  if(code==="trilha"){
    var index=Math.max(0,Math.min(8,Number(state.index)||0));
    active=value.steps>0;
    href="laboratorio-forense.html#trilha";
    guide="guia-pericia.html#"+chapters[index];
    place="Questão "+(index+1)+" de 9";
    note="Continue a Trilha na questão em que a rodada foi interrompida. O guia abre no capítulo correspondente.";
  }else if(code==="custodia"){
    active=value.steps>0||state.order.some(function(n,i){return n!==[3,0,4,1,2][i];});
    href=state.sorted?"pericia-custodia.html#custodia-ficha":"pericia-custodia.html#custodia-ordem";
    guide="guia-pericia-custodia.html#"+(state.sorted?"cap-4":"cap-3");
    place=state.sorted?"Etapa 2 de 2 · verificar a ficha":"Etapa 1 de 2 · ordenar registros";
    note=state.sorted?"A sequência de movimentações foi concluída. Agora examine o campo ausente na ficha.":"Continue organizando os registros por horário.";
  }else if(code==="papiloscopia"){
    active=value.steps>0||state.marks||state.reference==="r24";
    href=state.compared?"pericia-papiloscopia.html#finger-limit-title":"pericia-papiloscopia.html#finger-compare-title";
    guide="guia-pericia-papiloscopia.html#"+(state.compared?"cap-3":"cap-2");
    place=state.compared?"Etapa 2 de 2 · avaliar os limites":"Etapa 1 de 2 · comparar desenhos";
    note=state.compared?"A comparação visual foi concluída. Retome a interpretação dos limites do exercício.":"Continue comparando as regiões A e B dos desenhos artificiais.";
  }
  if(value.completed){
    active=false;place="Atividade concluída";label="Revisar exercício";
    note="Todas as etapas desta atividade foram concluídas. Você pode revisar as explicações.";
  }else if(active){label="Retomar atividade";}
  else {
    label=row&&row.ever_completed?"Iniciar nova rodada":"Começar atividade";
    note="Você pode ler o guia e iniciar esta especialidade quando desejar.";
  }
  var timestamp=typeof row?.updated_at==="string"?Date.parse(row.updated_at):0;
  return {code:code,name:titles[code],href:href,guide:guide,place:place,note:note,
    label:label,active:active,completed:value.completed,
    ever:!!row?.ever_completed,time:Number.isFinite(timestamp)?timestamp:0};
}
function choose(sync,rows){
  var choices=names.map(function(code,i){return routeFor(sync,code,rows[i]);});
  var active=choices.filter(function(x){return x.active&&!x.completed;});
  if(active.length){
    active.sort(function(a,b){return b.time-a.time||names.indexOf(a.code)-names.indexOf(b.code);});
    return active[0];
  }
  return choices.find(function(x){return !x.completed&&!x.ever;})
    ||choices.find(function(x){return !x.completed;})||choices[0];
}
function init(){
  var sync=root.ArquivoPericiaProgresso;
  var panel=document.getElementById("forensic-resume-panel");
  var materials=document.getElementById("forensic-study-materials");
  if(!sync||!panel||!materials)return;
  var title=document.getElementById("forensic-resume-title");
  var stage=document.getElementById("forensic-resume-progress");
  var description=document.getElementById("forensic-resume-description");
  var action=document.getElementById("forensic-resume-action");
  var reading=document.getElementById("forensic-resume-reading");
  function render(){
    if(!sync.isAccountActive()){
      panel.hidden=true;materials.hidden=true;
      title.textContent="Seu próximo exercício";description.textContent="";
      action.removeAttribute("href");reading.removeAttribute("href");
      return;
    }
    var next=choose(sync,sync.listRecords());
    title.textContent=next.name;stage.textContent=next.place;
    description.textContent=next.note;
    action.href=next.href;action.textContent=next.label;
    reading.href=next.guide;
    panel.hidden=false;materials.hidden=false;
  }
  root.addEventListener("arquivo-pericia-progresso",render);
  sync.connect(false).then(render).catch(function(){
    panel.hidden=true;materials.hidden=true;
  });
  render();
}
var API=Object.freeze({routeFor:routeFor,choose:choose});
if(typeof module!=="undefined"&&module.exports)module.exports=API;
if(root&&root.document){
  root.ArquivoPericiaRetomada=API;
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);
  else init();
}
}(typeof window!=="undefined"?window:null));
