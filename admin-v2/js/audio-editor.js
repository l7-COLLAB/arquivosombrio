/* Editor local de áudio: não envia arquivos ao servidor até o upload da parte.
   Exporta PCM WAV mono 32 kHz para compatibilidade entre navegadores. */
(function(){
"use strict";
const RATE=32000, MAX_FILE=30*1024*1024;
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const number=(v,fallback=0)=>{const n=Number(v);return Number.isFinite(n)?n:fallback;};
const clamp=(v,low,high)=>Math.max(low,Math.min(high,v));
const format=t=>{const n=Math.floor(Math.max(0,t));return Math.floor(n/60)+":"+String(n%60).padStart(2,"0");};
function makeWav(buffer){
 const samples=buffer.getChannelData(0),bytes=new ArrayBuffer(44+samples.length*2),view=new DataView(bytes);
 const put=(pos,value)=>{for(let i=0;i<value.length;i++)view.setUint8(pos+i,value.charCodeAt(i));};
 put(0,"RIFF");view.setUint32(4,36+samples.length*2,true);
 put(8,"WAVE");put(12,"fmt ");view.setUint32(16,16,true);
 view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,buffer.sampleRate,true);
 view.setUint32(28,buffer.sampleRate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);
 put(36,"data");view.setUint32(40,samples.length*2,true);
 let peak=0;
 for(let i=0;i<samples.length;i++)peak=Math.max(peak,Math.abs(samples[i]));
 // Não amplifica ruído de fundo, apenas evita saturação do resultado final.
 const scale=peak>0.95?0.95/peak:1;
 for(let i=0;i<samples.length;i++){
  const x=clamp(samples[i]*scale,-1,1);
  view.setInt16(44+i*2,x<0?Math.round(x*32768):Math.round(x*32767),true);
 }
 return new Blob([bytes],{type:"audio/wav"});
}
function preset(ctx,input,name,bus){
 const highpass=ctx.createBiquadFilter();
 highpass.type="highpass";highpass.frequency.value=name==="radio"?300:name==="clear"?100:65;
 input.connect(highpass);
 let tail=highpass;
 if(name==="warm"){
  const low=ctx.createBiquadFilter();low.type="lowshelf";low.frequency.value=240;low.gain.value=3;
  tail.connect(low);tail=low;
 }
 if(name==="radio"){
  const lowpass=ctx.createBiquadFilter();lowpass.type="lowpass";lowpass.frequency.value=3700;
  tail.connect(lowpass);tail=lowpass;
 }
 if(name==="clear"){
  const comp=ctx.createDynamicsCompressor();
  comp.threshold.value=-24;comp.knee.value=16;comp.ratio.value=2.4;comp.attack.value=0.01;comp.release.value=0.2;
  tail.connect(comp);tail=comp;
 }
 tail.connect(bus);
 if(name==="echo"){
  const delay=ctx.createDelay(1),wet=ctx.createGain();
  delay.delayTime.value=0.18;wet.gain.value=0.16;
  tail.connect(delay);delay.connect(wet);wet.connect(bus);
 }
}
function envelope(param,base,globalStart,run,total,fade){
 if(!fade){param.setValueAtTime(base,0);return;}
 const gainAt=t=>base*clamp(Math.min(t/fade,(total-t)/fade),0,1);
 param.setValueAtTime(gainAt(globalStart),0);
 const change=[fade-globalStart,total-fade-globalStart,run].filter(t=>t>0&&t<=run);
 change.sort((a,b)=>a-b);
 for(const t of change)param.linearRampToValueAtTime(gainAt(globalStart+t),t);
}
async function decode(file){
 if(!file)return null;
 if(!/\.(mp3|wav|webm|m4a|mp4|ogg)$/i.test(file.name))throw Error("Selecione MP3, WAV, WebM, OGG ou M4A.");
 if(file.size>MAX_FILE)throw Error("Arquivo de origem acima de 30 MB; divida a gravação em partes menores.");
 const AudioContext=window.AudioContext||window.webkitAudioContext;
 if(!AudioContext)throw Error("Este navegador não suporta edição Web Audio.");
 const ctx=new AudioContext();
 try{
  const array=await file.arrayBuffer();
  return await ctx.decodeAudioData(array);
 }finally{await ctx.close();}
}
async function open({initialFile=null,onExport}={}){
 if(document.querySelector(".as-audio-editor"))throw Error("Feche o editor atual antes de abrir outro.");
 if(!(window.OfflineAudioContext||window.webkitOfflineAudioContext))throw Error("O navegador não oferece processamento de áudio offline.");
 const overlay=document.createElement("div");
 overlay.className="as-audio-editor";
 overlay.innerHTML=[
 '<style>',
 '.as-audio-editor{position:fixed;inset:0;z-index:2147483000;background:rgba(3,2,2,.86);display:flex;align-items:center;justify-content:center;padding:12px;color:#eee2d2}',
 '.as-audio-editor *{box-sizing:border-box}.as-audio-editor .ae-panel{max-width:780px;width:100%;max-height:94dvh;overflow:auto;border:1px solid #8c6545;border-radius:12px;background:#19130f;padding:clamp(14px,2.5vw,28px);box-shadow:0 20px 70px #0009}',
 '.as-audio-editor h2{margin:0;color:#f2d8b1}.as-audio-editor h3{color:#e6c79f;margin:8px 0}.as-audio-editor p,.as-audio-editor small{color:#c2b3a2;line-height:1.55}',
 '.as-audio-editor .ae-header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}',
 '.as-audio-editor label{display:grid;gap:6px;color:#ddd0be;font-size:13px}.as-audio-editor input,.as-audio-editor select{width:100%;padding:9px;border:1px solid #68523b;border-radius:5px;background:#0e0b09;color:#f0e5d4}',
 '.as-audio-editor button{min-height:40px;background:#44301f;border:1px solid #9a7552;border-radius:6px;color:#f7e8d7;padding:9px 13px;cursor:pointer}',
 '.as-audio-editor button:disabled{opacity:.5;cursor:wait}.as-audio-editor button.ae-commit{background:#8d6944;border-color:#b48c5d}',
 '.as-audio-editor .ae-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:12px 0}',
 '.as-audio-editor .ae-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:12px 0}',
 '.as-audio-editor section{border:1px solid #564332;padding:13px;border-radius:8px;margin:12px 0}',
 '.as-audio-editor audio{width:100%;margin:9px 0}.as-audio-editor .ae-check{display:flex;gap:10px;align-items:flex-start}',
 '.as-audio-editor .ae-check input{width:auto;margin-top:4px}.as-audio-editor .ae-message{min-height:20px;color:#c6daa7}',
 '.as-audio-editor output{font-variant-numeric:tabular-nums;color:#e7cdad}',
 '@media(max-width:540px){.as-audio-editor .ae-grid{grid-template-columns:1fr}}',
 '</style>',
 '<div class="ae-panel" role="dialog" aria-modal="true" aria-labelledby="ae-title">',
 '<div class="ae-header"><div><small>ARQUIVO SOMBRIO · EDIÇÃO LOCAL</small><h2 id="ae-title">Editor de áudio</h2>',
 '<p>Edite sua narração antes de enviar. A gravação original não é substituída.</p></div>',
 '<button type="button" data-ae-close aria-label="Fechar o editor">Fechar</button></div>',
 '<section><h3>1. Sua voz</h3>',
 '<label>Gravação original (MP3, WAV, WebM, OGG ou M4A)<input data-ae-voice type="file" accept=".mp3,.wav,.webm,.ogg,.m4a,.mp4,audio/*"></label>',
 '<small data-ae-details>Selecione uma gravação.</small>',
 '<div class="ae-grid"><label>Início do corte (segundos)<input data-ae-start type="number" min="0" step="0.1" value="0"></label>',
 '<label>Fim do corte (segundos; 0 = duração total)<input data-ae-end type="number" min="0" step="0.1" value="0"></label>',
 '<label>Velocidade <select data-ae-speed><option value="0.9">0,90×</option><option value="1" selected>1× (original)</option><option value="1.05">1,05×</option><option value="1.1">1,10×</option><option value="1.15">1,15×</option><option value="1.25">1,25×</option></select></label>',
 '<label>Tratamento da voz<select data-ae-preset><option value="natural">Natural · filtro leve</option><option value="clear">Clareza · compressão suave</option><option value="warm">Grave quente</option><option value="radio">Rádio antigo</option><option value="echo">Eco discreto</option></select></label>',
 '<label>Volume da voz (%)<input data-ae-voice-volume type="number" min="30" max="180" step="5" value="100"></label>',
 '<label>Fade da voz (segundos)<input data-ae-fade type="number" min="0" max="3" step="0.2" value="0.3"></label></div>',
 '<small>A velocidade deste editor pode alterar o tom da voz. Não há correção de afinação automática nesta versão.</small></section>',
 '<section><h3>2. Música de fundo (opcional)</h3>',
 '<label>Arquivo de música autorizado (MP3 ou WAV)<input data-ae-music type="file" accept=".mp3,.wav,audio/mpeg,audio/wav"></label>',
 '<div class="ae-grid"><label>Volume de fundo (%)<input data-ae-music-volume type="number" min="0" max="35" step="1" value="10"></label>',
 '<label>Comportamento<select data-ae-music-loop><option value="repeat">Repetir até o fim da voz</option><option value="once">Tocar somente uma vez</option></select></label></div>',
 '<small>O volume musical permanece baixo para preservar a inteligibilidade. Há fade de entrada e saída.</small></section>',
 '<section><h3>3. Efeito pontual (opcional)</h3>',
 '<label>Arquivo de efeito autorizado (MP3 ou WAV)<input data-ae-effect type="file" accept=".mp3,.wav,audio/mpeg,audio/wav"></label>',
 '<div class="ae-grid"><label>Iniciar efeito no segundo<input data-ae-effect-at type="number" min="0" step="0.1" value="0"></label>',
 '<label>Volume do efeito (%)<input data-ae-effect-volume type="number" min="0" max="50" step="5" value="20"></label></div>',
 '<label>Créditos, fonte e licença da música/efeito<input data-ae-credits type="text" maxlength="1000" placeholder="Ex.: Trilha X, autor Y, licença CC0, URL da fonte"></label>',
 '<label class="ae-check"><input data-ae-rights type="checkbox"><span>Confirmo ter direito de utilizar e publicar a música e os efeitos selecionados.</span></label>',
 '<small>Não é permitido presumir que músicas de filmes, séries ou artistas estejam liberadas por terem sido encontradas na internet.</small></section>',
 '<section><h3>4. Prévia e exportação</h3>',
 '<div class="ae-grid"><label>Ouvir prévia a partir do segundo<input data-ae-preview-from type="number" min="0" step="1" value="0"></label>',
 '<label>Duração prevista<output data-ae-total>—</output></label></div>',
 '<div class="ae-row"><button type="button" data-ae-preview>Ouvir prévia (até 20 s)</button>',
 '<button type="button" data-ae-export class="ae-commit">Processar e usar no envio</button></div>',
 '<audio data-ae-player controls preload="none" hidden></audio>',
 '<p data-ae-message class="ae-message" role="status" aria-live="polite"></p>',
 '<small>Exportação: WAV mono 32 kHz. Limite de 30 MB por parte (aproximadamente 8 minutos). O processamento ocorre neste navegador.</small>',
 '</section></div>'
 ].join("");
 document.body.appendChild(overlay);
 const $=selector=>overlay.querySelector(selector), message=$("[data-ae-message]");
 let voiceBuffer=null,musicBuffer=null,effectBuffer=null,working=false,previewUrl=null;
 const notify=(text,error=false)=>{message.textContent=text;message.style.color=error?"#ffb2a6":"#c5dda7";};
 const releasePreview=()=>{const audio=$("[data-ae-player]");audio.pause();audio.removeAttribute("src");audio.hidden=true;audio.load();if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null;}};
 const lock=state=>{working=state;overlay.querySelectorAll("button").forEach(button=>button.disabled=state);};
 const close=()=>{if(working)return;releasePreview();overlay.remove();document.removeEventListener("keydown",onKey);};
 const onKey=event=>{if(event.key==="Escape"){event.preventDefault();close();}};
 document.addEventListener("keydown",onKey);
 $("[data-ae-close]").onclick=close;
 overlay.addEventListener("click",e=>{if(e.target===overlay)close()});
 const voiceFile=$("[data-ae-voice]"),musicFile=$("[data-ae-music]"),effectFile=$("[data-ae-effect]");
 const lengthOf=()=>{
  if(!voiceBuffer)return 0;
  const start=number($("[data-ae-start]").value),end=number($("[data-ae-end]").value)||voiceBuffer.duration;
  const speed=number($("[data-ae-speed]").value,1);
  if(start<0||start>=voiceBuffer.duration||end<=start||end>voiceBuffer.duration||speed<=0)
   throw Error("Confira o início e fim do corte. O fim precisa ser maior que o início.");
  return (end-start)/speed;
 };
 const durationLabel=()=>{
  try{$("[data-ae-total]").textContent=voiceBuffer?format(lengthOf()):"—";}
  catch(_){$("[data-ae-total]").textContent="Corte inválido";}
 };
 async function loadBuffer(file,kind){
  lock(true);releasePreview();
  try{
   notify("Lendo arquivo "+kind+" neste navegador...");
   const result=await decode(file);
   if(kind==="voz"){voiceBuffer=result;$("[data-ae-details]").textContent=file.name+" · "+format(result.duration);$("[data-ae-start]").value="0";$("[data-ae-end]").value=String(result.duration);}
   else if(kind==="música")musicBuffer=result;
   else effectBuffer=result;
   durationLabel();notify(kind+" carregada. Nenhum arquivo foi enviado ao servidor.");
  }catch(error){
   if(kind==="voz")voiceBuffer=null;
   if(kind==="música")musicBuffer=null;
   if(kind==="efeito")effectBuffer=null;
   notify(error.message||"Erro ao carregar áudio",true);
  }finally{lock(false);}
 }
 voiceFile.addEventListener("change",()=>{if(voiceFile.files?.[0])loadBuffer(voiceFile.files[0],"voz");else{voiceBuffer=null;durationLabel();}});
 musicFile.addEventListener("change",()=>{if(musicFile.files?.[0])loadBuffer(musicFile.files[0],"música");else musicBuffer=null;});
 effectFile.addEventListener("change",()=>{if(effectFile.files?.[0])loadBuffer(effectFile.files[0],"efeito");else effectBuffer=null;});
 for(const element of overlay.querySelectorAll("input[type=number],select"))element.addEventListener("change",()=>{durationLabel();releasePreview()});
 async function mix(preview=false){
  if(!voiceBuffer)throw Error("Selecione primeiro a gravação da voz.");
  if((musicBuffer||effectBuffer)&&!$("[data-ae-rights]").checked)
   throw Error("Confirme os direitos de uso da música e dos efeitos.");
  if((musicBuffer||effectBuffer)&&$("[data-ae-credits]").value.trim().length<10)
   throw Error("Informe os créditos, fonte e licença da trilha ou do efeito.");
  const start=number($("[data-ae-start]").value),end=number($("[data-ae-end]").value)||voiceBuffer.duration,
   speed=number($("[data-ae-speed]").value,1),total=lengthOf(),
   offset=preview?clamp(number($("[data-ae-preview-from]").value),0,Math.max(0,total-0.1)):0,
   run=preview?Math.min(20,total-offset):total;
  if(run<=0||run*RATE*2+44>MAX_FILE)throw Error("O resultado excede 30 MB. Divida a gravação em partes menores.");
  const OfflineContext=window.OfflineAudioContext||window.webkitOfflineAudioContext;
  const ctx=new OfflineContext(1,Math.ceil(run*RATE),RATE),bus=ctx.createGain();bus.connect(ctx.destination);
  const voice=ctx.createBufferSource(),gain=ctx.createGain();
  voice.buffer=voiceBuffer;voice.playbackRate.value=speed;
  voice.connect(gain);
  const fade=clamp(number($("[data-ae-fade]").value),0,3),
    voiceVolume=clamp(number($("[data-ae-voice-volume]").value)/100,0.3,1.8);
  envelope(gain.gain,voiceVolume,offset,run,total,fade);
  preset(ctx,gain,$("[data-ae-preset]").value,bus);
  voice.start(0,start+offset*speed,Math.min((end-start)-offset*speed,run*speed));
  if(musicBuffer&&number($("[data-ae-music-volume]").value)>0){
   const bg=ctx.createBufferSource(),vol=ctx.createGain();
   bg.buffer=musicBuffer;bg.loop=$("[data-ae-music-loop]").value==="repeat";
   bg.connect(vol);vol.connect(bus);
   const value=clamp(number($("[data-ae-music-volume]").value)/100,0,0.35);
   const offsetMusic=bg.loop?offset%musicBuffer.duration:offset;
   if(offsetMusic<musicBuffer.duration){
    envelope(vol.gain,value,offset,run,total,Math.min(1.2,total/3));
    bg.start(0,offsetMusic,Math.min(run,bg.loop?run:musicBuffer.duration-offsetMusic));
   }
  }
  if(effectBuffer&&number($("[data-ae-effect-volume]").value)>0){
   const effectAt=Math.max(0,number($("[data-ae-effect-at]").value)),elapsed=offset-effectAt;
   if(effectAt<offset+run&&elapsed<effectBuffer.duration){
    const effect=ctx.createBufferSource(),vol=ctx.createGain();effect.buffer=effectBuffer;
    vol.gain.value=clamp(number($("[data-ae-effect-volume]").value)/100,0,0.5);
    effect.connect(vol);vol.connect(bus);
    const startAt=Math.max(0,effectAt-offset),startFrom=Math.max(0,elapsed);
    effect.start(startAt,startFrom,Math.min(effectBuffer.duration-startFrom,run-startAt));
   }
  }
  return ctx.startRendering();
 }
 $("[data-ae-preview]").onclick=async()=>{
  if(working)return;lock(true);
  try{
   releasePreview();notify("Preparando prévia de até 20 segundos...");
   const buffer=await mix(true);
   previewUrl=URL.createObjectURL(makeWav(buffer));
   const audio=$("[data-ae-player]");audio.src=previewUrl;audio.hidden=false;
   await audio.play();notify("Prévia local. Ajuste os controles e ouça novamente.");
  }catch(error){notify(error.message||"Falha na prévia",true)}finally{lock(false);}
 };
 $("[data-ae-export]").onclick=async()=>{
  if(working)return;lock(true);
  try{
   releasePreview();notify("Processando o arquivo completo neste navegador...");
   const rendered=await mix(false),blob=makeWav(rendered);
   if(blob.size>MAX_FILE)throw Error("O WAV final excede 30 MB. Divida esta parte.");
   const file=new File([blob],"arquivo-sombrio-parte-editada-"+Date.now()+".wav",{type:"audio/wav"});
   if(typeof onExport!=="function")throw Error("Destino de exportação indisponível.");
   await onExport(file,{credits:$("[data-ae-credits]").value.trim(),externalAudio:!!(musicBuffer||effectBuffer)});
   notify("Edição pronta. Use o botão Enviar áudio da parte para salvá-la no servidor.");
   releasePreview();document.removeEventListener("keydown",onKey);overlay.remove();
  }catch(error){notify(error.message||"Falha ao processar áudio",true)}finally{lock(false);}
 };
 if(initialFile){
  try{
   const transfer=new DataTransfer();transfer.items.add(initialFile);voiceFile.files=transfer.files;
  }catch(_){/* iOS pode não permitir atribuir FileList; usa o arquivo diretamente. */}
  await loadBuffer(initialFile,"voz");
 }
 voiceFile.focus();
}
window.ArquivoAudioEditor={open};
})();