/* Arquivo Sombrio — preparacao para o WebChat do Jarvis Helpdesk.
 * Desativado ate obter o codigo oficial de incorporacao na conta Jarvis.
 * Nao incluir tokens privados, chaves secretas ou dados de usuarios neste arquivo.
 */
(function () {
  'use strict';
  var config = window.ARQUIVO_JARVIS_WEBCHAT || {};
  if (config.enabled !== true || typeof config.scriptUrl !== 'string' || !config.scriptUrl.trim()) return;

  var url;
  try {
    url = new URL(config.scriptUrl, document.baseURI);
  } catch (_) {
    return;
  }
  if (url.protocol !== 'https:') return;
  // Exigir origem explicitamente aprovada na configuracao; nao carregar scripts arbitrarios.
  if (typeof config.allowedOrigin !== 'string' || url.origin !== config.allowedOrigin) return;
  if (document.querySelector('script[data-arquivo-jarvis-webchat]')) return;

  function loadWidget() {
    if (document.querySelector('script[data-arquivo-jarvis-webchat]')) return;
    var script = document.createElement('script');
    script.src = url.href;
    script.async = true;
    script.dataset.arquivoJarvisWebchat = 'true';
    script.onerror = function () { console.warn('[Arquivo Sombrio] Falha ao carregar WebChat do Jarvis.'); };
    document.body.appendChild(script);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadWidget, { once: true });
  } else {
    loadWidget();
  }
})();
