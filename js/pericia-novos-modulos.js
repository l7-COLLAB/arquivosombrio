/* Módulos educativos da Perícia Forense — situações e impressões totalmente fictícias. */
(function () {
"use strict";
var ITEMS=Object.freeze([
  {id:0,time:"09h10",label:"Coleta do item AS-017",detail:"Ana registra o vestígio no local simulado."},
  {id:1,time:"09h15",label:"Identificação e embalagem",detail:"Ana acondiciona o item com o código AS-017."},
  {id:2,time:"09h40",label:"Transferência para transporte",detail:"Bruno recebe o pacote e registra a transferência."},
  {id:3,time:"10h20",label:"Chegada ao laboratório",detail:"A ficha informa o horário, mas não identifica o recebedor."},
  {id:4,time:"10h35",label:"Registro de exame",detail:"Carla documenta o início da análise do item."}
]);
var INITIAL=Object.freeze([3,0,4,1,2]);
function isValidOrder(order){return Array.isArray(order)&&order.length===5&&new Set(order).size===5&&order.every(function(x){return Number.isInteger(x)&&x>=0&&x<5;});}
function checkOrder(order){return isValidOrder(order)&&order.every(function(x,i){return x===i;});}
function checkGap(choice){return Number(choice)===1;}
function checkReference(reference){return reference==="r17";}
function checkConclusion(choice){return Number(choice)===1;}
function freshCustody(){return {order:INITIAL.slice(),sorted:false,complete:false};}
function normalizeCustody(state){if(!state||!isValidOrder(state.order))return freshCustody();return {order:state.order.slice(),sorted:!!state.sorted&&checkOrder(state.order),complete:!!state.complete&&!!state.sorted&&checkOrder(state.order)};}
function freshPrint(){return {compared:false,complete:false,reference:"r17",marks:false};}
function normalizePrint(state){if(!state||!["r17","r24"].includes(state.reference))return freshPrint();return {compared:!!state.compared,complete:!!state.complete&&!!state.compared,reference:state.reference,marks:!!state.marks};}
var API=Object.freeze({ITEMS:ITEMS,INITIAL:INITIAL,checkOrder:checkOrder,checkGap:checkGap,checkReference:checkReference,checkConclusion:checkConclusion,normalizeCustody:normalizeCustody,normalizePrint:normalizePrint});
if(typeof module!=="undefined"&&module.exports)module.exports=API;
if(typeof document==="undefined")return;
function el(id){return document.getElementById(id);}
function output(id,title,detail){
  var box=el(id);box.replaceChildren();
  var strong=document.createElement("strong"),text=document.createElement("p");
  strong.textContent=title;text.textContent=detail;box.append(strong,text);
}
function store(key,state){
  var bridge=window.ArquivoPericiaProgresso;
  var code=key==="arquivo-sombrio-custodia-v1"?"custodia":
    key==="arquivo-sombrio-papiloscopia-v1"?"papiloscopia":null;
  if(code && bridge && bridge.isAccountActive()){bridge.save(code,state);return;}
  try{localStorage.setItem(key,JSON.stringify(state));}catch(e){}
}
function restore(key){try{return JSON.parse(localStorage.getItem(key));}catch(e){return null;}}
function initCustody(){
  var KEY="arquivo-sombrio-custodia-v1",state=normalizeCustody(restore(KEY));
  function render(){
    var list=el("custody-events");
    list.replaceChildren();
    state.order.forEach(function(id,pos){
      var item=ITEMS[id],li=document.createElement("li");li.className="m-evidence";
      li.tabIndex=-1;
      var span=document.createElement("span"),title=document.createElement("strong");
      title.textContent=item.time+" · "+item.label;
      span.append(title,document.createTextNode(item.detail));
      var controls=document.createElement("div");controls.className="m-move";
      [{offset:-1,icon:"↑",word:"subir"},{offset:1,icon:"↓",word:"descer"}].forEach(function(op){
        var btn=document.createElement("button");btn.type="button";btn.textContent=op.icon;
        btn.setAttribute("aria-label",op.word+" o registro "+item.time);
        btn.disabled=state.sorted||(pos===0&&op.offset===-1)||(pos===4&&op.offset===1);
        btn.addEventListener("click",function(){
          var newIndex=pos+op.offset;if(newIndex<0||newIndex>4||state.sorted)return;
          var tmp=state.order[newIndex];state.order[newIndex]=state.order[pos];state.order[pos]=tmp;
          store(KEY,state);render();
          var moved=list.children[newIndex];
          if(moved){
            var enabled=Array.from(moved.querySelectorAll("button")).filter(function(b){return !b.disabled;});
            var next=enabled.find(function(b){return b.getAttribute("aria-label").indexOf(op.word)===0;})||enabled[0]||moved;
            next.focus();
          }
          el("custody-move-status").textContent=item.time+" movido para a posição "+(newIndex+1)+" de 5.";
        });
        controls.appendChild(btn);
      });
      li.append(span,controls);list.appendChild(li);
    });
    el("custody-check-order").disabled=state.sorted;
    el("custody-choices").disabled=!state.sorted||state.complete;
    el("custody-check-gap").disabled=!state.sorted||state.complete;
    el("custody-award").hidden=!state.complete;
    if(state.sorted&&el("custody-order-feedback").textContent.trim()==="")output("custody-order-feedback","Sequência concluída","Os cinco registros estão em ordem. Agora verifique se a ficha contém todas as informações necessárias.");
    if(state.complete&&el("custody-gap-feedback").textContent.trim()==="")output("custody-gap-feedback","Lacuna identificada","A ficha não informa quem recebeu o item às 10h20. A ausência deve ser esclarecida; não prova troca ou adulteração.");
  }
  el("custody-check-order").addEventListener("click",function(){
    if(checkOrder(state.order)){
      state.sorted=true;store(KEY,state);
      output("custody-order-feedback","Sequência correta","A ordem acompanha os horários registrados: 09h10, 09h15, 09h40, 10h20 e 10h35. A conferência da documentação ainda é necessária.");
    }else{
      output("custody-order-feedback","Confira os horários","A sequência ainda tem registros fora da ordem. Compare os horários e mova cada item com os botões de seta. Não há desconto de pontos por tentar novamente.");
    }
    render();
    if(state.sorted)el("ficha-titulo").focus();
  });
  el("custody-check-gap").addEventListener("click",function(){
    if(!state.sorted||state.complete)return;
    var selected=document.querySelector('input[name="custody-gap"]:checked');
    if(!selected){output("custody-gap-feedback","Escolha uma observação","Selecione a opção que descreve uma informação efetivamente ausente.");return;}
    if(checkGap(selected.value)){
      state.complete=true;store(KEY,state);output("custody-gap-feedback","Lacuna identificada","O documento não identifica quem recebeu o item às 10h20. Isso pede esclarecimento documental, mas não demonstra adulteração.");
    }else{
      output("custody-gap-feedback","Volte à ficha","O código do item e o horário estão registrados. Observe o campo do responsável pelo recebimento; uma lacuna não comprova substituição de material.");
    }render();
    if(state.complete)el("custody-award").focus();
  });
  el("custody-reset").addEventListener("click",function(){
    if((state.sorted||state.complete)&&!window.confirm("Reiniciar o exercício de cadeia de custódia?"))return;
    state=freshCustody();store(KEY,state);
    el("custody-order-feedback").replaceChildren();el("custody-gap-feedback").replaceChildren();
    el("custody-move-status").textContent="A sequência foi reiniciada.";
    document.querySelectorAll('input[name="custody-gap"]').forEach(function(x){x.checked=false;});
    render();
  });
  render();
  if(window.ArquivoPericiaProgresso) {
    window.ArquivoPericiaProgresso.register("custodia",{
      apply:function(remote){
        state=normalizeCustody(remote);
        el("custody-order-feedback").replaceChildren();
        el("custody-gap-feedback").replaceChildren();
        document.querySelectorAll('input[name="custody-gap"]').forEach(function(x){x.checked=false;});
        render();
      }
    });
  }
}
function fingerprintSvg(ref,marks){
  var source=ref==="v03"?"v03":ref==="r24"?"r24":"r17";
  var alternate=source==="r24", latent=source==="v03";
  var paths="";
  for(var i=0;i<17;i++){
    var shift=i*5.4,offset=alternate?i*1.55:0;
    var left=50+shift*.58+offset*.3;
    var y=209-shift*.9;
    var peak=44+(i%4)*2+(alternate?17:0);
    var right=244-shift*.34+offset;
    paths+='<path d="M '+left.toFixed(1)+' '+y.toFixed(1)+' C '+(left-20).toFixed(1)+' '+(peak+58).toFixed(1)+', '+(110+offset).toFixed(1)+' '+(peak-18).toFixed(1)+', '+(153+offset).toFixed(1)+' '+peak.toFixed(1)+' S '+right.toFixed(1)+' '+(y-15).toFixed(1)+', '+right.toFixed(1)+' '+(y+8).toFixed(1)+'" />';
  }
  // Sinais auxiliares são zonas de comparação fictícias, não minúcias extraídas de pessoas reais.
  var vPoints=alternate?[[157,121,"A"],[89,190,"B"]]:[[106,115,"A"],[216,176,"B"]];
  var extras=marks?vPoints.map(function(p){return '<circle cx="'+p[0]+'" cy="'+p[1]+'" r="12" fill="none" stroke="#db293d" stroke-width="4"/><text x="'+(p[0]+12)+'" y="'+(p[1]-11)+'" fill="#b81029" font-size="17" font-weight="700">'+p[2]+'</text>';}).join(""):"";
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 260" role="img" aria-label="'+(latent?"Vestígio ilustrado V-03, parcial":alternate?"Referência ilustrada R-24":"Referência ilustrada R-17")+'; regiões indicadas '+(marks?"visíveis":"ocultas")+'"><rect width="300" height="260" fill="#e5edf6"/><rect x="25" y="20" width="250" height="220" rx="13" fill="#fafcff" stroke="#a6b5cb"/><g stroke="#38465d" stroke-width="2.7" fill="none" stroke-linecap="round" opacity=".92">'+paths+'</g>'+ (latent?'<rect x="29" y="23" width="13" height="210" fill="#dce4ef" opacity=".8"/>':'')+extras+'</svg>';
}
function initPrint(){
  var KEY="arquivo-sombrio-papiloscopia-v1",state=normalizePrint(restore(KEY)),zoom=1;
  function render(){
    var sel=el("fp-reference");sel.value=state.reference;sel.disabled=state.compared;
    el("fp-ref-label").textContent=state.reference==="r17"?"Referência R-17":"Referência R-24";
    el("fp-latent").innerHTML=fingerprintSvg("v03",state.marks);
    el("fp-known").innerHTML=fingerprintSvg(state.reference,state.marks);
    [el("fp-latent"),el("fp-known")].forEach(function(container){
      var svg=container.querySelector("svg");svg.style.maxWidth="none";svg.style.width=(zoom*100)+"%";
    });
    el("fp-zoom-status").textContent="Ampliação: "+Math.round(zoom*100)+"%";
    el("fp-zoom-in").disabled=zoom>=2;
    el("fp-zoom-out").disabled=zoom<=1;
    el("fp-show-marks").setAttribute("aria-pressed",String(state.marks));
    el("fp-show-marks").textContent=state.marks?"Ocultar regiões A e B":"Mostrar regiões A e B";
    el("fp-check-match").disabled=state.compared;
    el("fp-conclusion-choices").disabled=!state.compared||state.complete;
    el("fp-check-conclusion").disabled=!state.compared||state.complete;
    el("fp-award").hidden=!state.complete;
    if(state.compared&&el("fp-match-feedback").textContent.trim()==="")output("fp-match-feedback","Comparação concluída","A referência R-17 foi desenhada com as duas regiões em posições semelhantes às do V-03. Isso não identifica a origem de uma impressão.");
    if(state.complete&&el("fp-conclusion-feedback").textContent.trim()==="")output("fp-conclusion-feedback","Interpretação correta","Sem qualidade e contexto suficientes, não se determina identidade a partir destes desenhos fictícios.");
  }
  el("fp-reference").addEventListener("change",function(v){if(state.compared)return;state.reference=v.target.value;store(KEY,state);render();});
  el("fp-show-marks").addEventListener("click",function(){state.marks=!state.marks;store(KEY,state);render();});
  el("fp-zoom-in").addEventListener("click",function(){zoom=Math.min(2,Math.round((zoom+.25)*100)/100);render();});
  el("fp-zoom-out").addEventListener("click",function(){zoom=Math.max(1,Math.round((zoom-.25)*100)/100);render();});
  el("fp-check-match").addEventListener("click",function(){
    if(state.compared)return;
    if(!state.marks){output("fp-match-feedback","Observe as regiões","Ative as marcações A e B antes de fazer a comparação.");return;}
    if(checkReference(state.reference)){
      state.compared=true;store(KEY,state);
      output("fp-match-feedback","R-17 se aproxima mais neste desenho","As duas regiões sinalizadas foram colocadas em posições semelhantes às do vestígio V-03. Essa aproximação visual é apenas a resposta esperada do exercício.");
    }else{
      output("fp-match-feedback","Observe a posição das marcações","Na referência R-24, as zonas A e B foram desenhadas em posições diferentes. Compare com R-17 antes de concluir.");
    }render();
    if(state.compared)el("finger-limit-title").focus();
  });
  el("fp-check-conclusion").addEventListener("click",function(){
    if(!state.compared||state.complete)return;
    var chosen=document.querySelector('input[name="fp-conclusion"]:checked');
    if(!chosen){output("fp-conclusion-feedback","Selecione uma conclusão","Escolha a afirmação mais adequada sobre os limites desta atividade.");return;}
    if(checkConclusion(chosen.value)){state.complete=true;store(KEY,state);output("fp-conclusion-feedback","Conclusão adequada","A atividade só demonstra uma semelhança ilustrada. Uma comparação pericial real exige exame técnico, material de qualidade suficiente e avaliação fundamentada.");}
    else output("fp-conclusion-feedback","Sem identificação individual","Dois pontos esquemáticos ou uma aparência semelhante não são suficientes para determinar de quem é uma impressão. Consulte o guia e tente novamente.");
    render();
    if(state.complete)el("fp-award").focus();
  });
  el("fp-reset").addEventListener("click",function(){
    if((state.compared||state.complete)&&!window.confirm("Reiniciar a comparação? O selo desta rodada será desfeito neste navegador."))return;
    state=freshPrint();zoom=1;store(KEY,state);
    el("fp-match-feedback").replaceChildren();el("fp-conclusion-feedback").replaceChildren();
    document.querySelectorAll('input[name="fp-conclusion"]').forEach(function(input){input.checked=false;});
    render();
    el("fp-reference").focus();
  });
  render();
  if(window.ArquivoPericiaProgresso) {
    window.ArquivoPericiaProgresso.register("papiloscopia",{
      apply:function(remote){
        state=normalizePrint(remote);zoom=1;
        el("fp-match-feedback").replaceChildren();
        el("fp-conclusion-feedback").replaceChildren();
        document.querySelectorAll('input[name="fp-conclusion"]').forEach(function(x){x.checked=false;});
        render();
      }
    });
  }
}
function ready(){var mode=document.body.getAttribute("data-lab");if(mode==="custodia")initCustody();if(mode==="papiloscopia")initPrint();}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ready);else ready();
}());
