(function(){'use strict';
 if(!window.ARQUIVO_ADMIN_V2_CLONE)return;
 const options='<option value="normal">Arquivo normal</option><option value="ativo">Caso em acompanhamento</option><option value="encerrado">Acompanhamento encerrado</option>';
 async function attach(type,data){
  const modal=document.getElementById(type==='dossie'?'admin-form-modal':'admin-daily-case-modal');
  const form=modal?.querySelector(type==='dossie'?'#admin-content-form':'#daily-case-form');
  if(!form||(type==='dossie'&&!form.querySelector('#admin-title'))||modal.querySelector('[data-legacy-tracking]'))return;
  const root=document.createElement('div');root.dataset.legacyTracking='';form.after(root);
  if(!data?.id){
   root.innerHTML='<section class="case-tracking-admin"><h3>CASO EM ACOMPANHAMENTO</h3><label>Classificação editorial<select data-tracking-status>'+options+'</select></label><p>Salve o arquivo como rascunho e reabra a edição para adicionar atualizações. A classificação será salva junto com o formulário.</p></section>';
   // Connect the selector to the original form even though its panel is outside it.
   const input=document.createElement('input');input.type='hidden';input.dataset.trackingStatus='';input.value='normal';form.append(input);
   root.querySelector('select').onchange=e=>input.value=e.target.value;
   return;
  }
  root.innerHTML='<p>Carregando acompanhamento editorial...</p>';
  try{const module=await import('./case-tracking.js?v=case-tracking-20261006-2');if(!root.isConnected)return;root.replaceChildren();await module.mountCaseTracking(root,type,()=>data,row=>{Object.assign(data,row);},obterClienteAdminIsolado());}
  catch(e){root.textContent='Não foi possível abrir o acompanhamento: '+e.message;}
 }
 const dossier=window.abrirFormularioAdmin,daily=window.abrirFormularioCasoDiario;
 if(typeof dossier==='function')window.abrirFormularioAdmin=function(type,data){const result=dossier.apply(this,arguments);if(type==='caso')setTimeout(()=>attach('dossie',data),0);return result;};
 if(typeof daily==='function')window.abrirFormularioCasoDiario=function(data){const result=daily.apply(this,arguments);setTimeout(()=>attach('garimpo',data),0);return result;};
})();
