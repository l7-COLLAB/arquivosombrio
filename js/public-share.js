/* Compartilhamento público de conteúdos · Arquivo Sombrio */
(function () {
  'use strict';
  if (document.getElementById('arquivo-share-widget')) return;
  const style = document.createElement('style');
  style.textContent = `
    #arquivo-share-widget{position:fixed;right:16px;bottom:calc(20px + env(safe-area-inset-bottom,0px));z-index:9000;font-family:Arial,sans-serif}
    #arquivo-share-widget button,#arquivo-share-widget a{font:inherit}
    .as-share-trigger{display:flex;align-items:center;gap:8px;justify-content:center;background:#352720;color:#fff;border:1px solid #b99869;border-radius:40px;padding:12px 17px;box-shadow:0 6px 24px #0008;cursor:pointer;font-weight:700}
    .as-share-panel{position:absolute;right:0;bottom:calc(100% + 12px);width:min(310px,calc(100vw - 32px));max-height:min(510px,75vh);overflow:auto;background:#191715;color:#f4eadb;border:1px solid #8a7153;border-radius:13px;padding:16px;box-shadow:0 18px 40px #0009}
    .as-share-panel[hidden]{display:none}
    .as-share-panel h2{margin:0 0 10px;font-size:17px;color:#f4eadb}
    .as-share-options{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .as-share-options button,.as-share-options a{box-sizing:border-box;min-height:48px;display:flex;align-items:center;justify-content:center;text-align:center;padding:9px 6px;border:1px solid #695740;border-radius:8px;background:#29241e;color:#f4eadb;text-decoration:none;cursor:pointer;font-size:13px}
    .as-share-options button:focus-visible,.as-share-trigger:focus-visible,.as-share-options a:focus-visible{outline:3px solid #d7aa65;outline-offset:2px}
    .as-share-note{font-size:12px;line-height:1.5;color:#cbbba8;margin:11px 0 0}
    .as-share-status{min-height:16px;margin-top:8px;font-size:12px;color:#f5d39a}
    @media(max-width:600px){#arquivo-share-widget{right:12px;bottom:calc(14px + env(safe-area-inset-bottom,0px))}.as-share-trigger{padding:11px 14px}}
    @media print{#arquivo-share-widget{display:none}}
  `;
  document.head.appendChild(style);
  const widget = document.createElement('div');
  widget.id = 'arquivo-share-widget';
  widget.innerHTML = '<button type="button" class="as-share-trigger" aria-expanded="false" aria-controls="as-share-panel" aria-label="Compartilhar este conteúdo">↗ Compartilhar</button><section class="as-share-panel" id="as-share-panel" hidden aria-label="Opções de compartilhamento"><h2>Compartilhar arquivo</h2><div class="as-share-options"><button type="button" data-action="native">Pessoas e aplicativos</button><a data-action="whatsapp" target="_blank" rel="noopener noreferrer">WhatsApp</a><a data-action="telegram" target="_blank" rel="noopener noreferrer">Telegram</a><button type="button" data-action="instagram">Instagram Stories</button><button type="button" data-action="copy">Copiar link</button><a data-action="email">E-mail</a></div><p class="as-share-note">Para Stories, copie o link e adicione-o ao sticker de link no Instagram. No celular, “Pessoas e aplicativos” abre as opções disponíveis no aparelho.</p><div class="as-share-status" role="status" aria-live="polite"></div></section>';
  document.body.appendChild(widget);
  const trigger=widget.querySelector('.as-share-trigger'), panel=widget.querySelector('.as-share-panel'), status=widget.querySelector('.as-share-status');
  const canonical=document.querySelector('link[rel="canonical"]');
  function shareUrl(){
    const url=new URL(location.href);
    url.hash='';
    ['utm_source','utm_medium','utm_campaign','fbclid','gclid'].forEach(k=>url.searchParams.delete(k));
    // Dynamic detail pages depend on id/obra: preserve their query parameters.
    if (!url.search && canonical && canonical.href && !/caso|garimpo|pericia|novel|lenda|creepypasta/i.test(location.pathname)) return canonical.href;
    return url.href;
  }
  function title(){return (document.querySelector('main h1,article h1,.case-title,.novel-title,h1')?.textContent||document.title||'Arquivo Sombrio').trim().replace(/\s+/g,' ').slice(0,150);}
  function sync(){const u=shareUrl(), message=title()+' — Arquivo Sombrio';widget.querySelector('[data-action="whatsapp"]').href='https://api.whatsapp.com/send?text='+encodeURIComponent(message+'\n'+u);widget.querySelector('[data-action="telegram"]').href='https://t.me/share/url?url='+encodeURIComponent(u)+'&text='+encodeURIComponent(message);widget.querySelector('[data-action="email"]').href='mailto:?subject='+encodeURIComponent(message)+'&body='+encodeURIComponent(u);}
  function close(){panel.hidden=true;trigger.setAttribute('aria-expanded','false');}
  trigger.addEventListener('click',async()=>{
    sync();
    status.textContent='';
    if (typeof navigator.share === 'function') {
      close();
      try {
        await navigator.share({title:title(),text:'Leia no Arquivo Sombrio',url:shareUrl()});
      } catch (e) {
        if (e.name !== 'AbortError') {
          panel.hidden=false;
          trigger.setAttribute('aria-expanded','true');
          status.textContent='O compartilhamento nativo falhou. Escolha outra opção.';
        }
      }
      return;
    }
    panel.hidden=!panel.hidden;
    trigger.setAttribute('aria-expanded',String(!panel.hidden));
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  document.addEventListener('click',e=>{if(!widget.contains(e.target))close();});
  async function copy(){
    const value=shareUrl();
    if(navigator.clipboard && window.isSecureContext){await navigator.clipboard.writeText(value);return;}
    const t=document.createElement('textarea');t.value=value;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();const ok=document.execCommand('copy');t.remove();if(!ok)throw new Error('copy unavailable');
  }
  widget.querySelector('[data-action="copy"]').addEventListener('click',async()=>{try{await copy();status.textContent='Link copiado.';}catch(e){status.textContent='Não foi possível copiar automaticamente: '+shareUrl();}});
  widget.querySelector('[data-action="instagram"]').addEventListener('click',async()=>{try{await copy();status.textContent='Link copiado. Abra o Instagram, crie um Story e use o sticker de link.';}catch(e){status.textContent='Copie este link para o sticker do Instagram: '+shareUrl();}});
  widget.querySelector('[data-action="native"]').addEventListener('click',async()=>{
    if(!navigator.share){status.textContent='Compartilhamento nativo indisponível neste navegador. Use WhatsApp ou Copiar link.';return;}
    try{await navigator.share({title:title(),text:'Leia no Arquivo Sombrio',url:shareUrl()});close();}catch(e){if(e.name!=='AbortError')status.textContent='Não foi possível abrir o compartilhamento.';}
  });
  sync();
})();