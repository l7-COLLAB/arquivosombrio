/* Proveniência das capas documentais: somente imagens do manifesto editorial. */
(function () {
  'use strict';
  var script = document.currentScript;
  var manifestURL = new URL('../data/capas-documentais.json', script.src).href;
  var selector = '.daily-reader-cover, .archive-literary-detail-cover, #caso-imagem, .forensic-detail-image img, .article-cover img';
  function link(label, href, host) {
    var url = new URL(href);
    if (url.protocol !== 'https:' || url.hostname !== host) throw new Error('Fonte inválida');
    var a = document.createElement('a');
    a.textContent = label; a.href = url.href; a.target = '_blank'; a.rel = 'noopener noreferrer';
    return a;
  }
  fetch(manifestURL).then(function (r) {
    if (!r.ok) throw new Error('Manifesto indisponível');
    return r.json();
  }).then(function (rows) {
    var map = new Map(rows.map(function (row) { return ['/' + row.asset_path, row]; }));
    var queued = false;
    function render() {
      queued = false;
      document.querySelectorAll(selector).forEach(function (img) {
        var path;
        try { path = new URL(img.src, document.baseURI).pathname; } catch (_) { return; }
        var entry = Array.from(map.entries()).find(function (pair) { return path.endsWith(pair[0]); });
        if (!entry || img.dataset.coverCredit === path) return;
        var row = entry[1];
        var figure = img.parentElement.tagName === 'FIGURE' ? img.parentElement : null;
        var caption = figure && figure.querySelector('figcaption');
        if (!caption) {
          caption = document.createElement(figure ? 'figcaption' : 'p');
          img.insertAdjacentElement('afterend', caption);
        }
        caption.classList.add('documentary-cover-credit');
        caption.style.cssText = 'font-size:.875rem;line-height:1.6;margin:.75rem 0 1.5rem;max-width:80ch';
        caption.replaceChildren(document.createTextNode(row.caption + ' Crédito: ' + row.credit + '. '));
        caption.appendChild(link('Fonte da imagem', row.source_url, 'commons.wikimedia.org'));
        caption.appendChild(document.createTextNode(' · '));
        caption.appendChild(link(row.license, row.license_url, 'creativecommons.org'));
        caption.appendChild(document.createTextNode('. ' + row.changes));
        img.dataset.coverCredit = path;
        img.alt = row.caption;
      });
    }
    function schedule() {
      if (!queued) { queued = true; requestAnimationFrame(render); }
    }
    render();
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
  }).catch(function () { /* As fontes cadastradas no artigo continuam disponíveis. */ });
})();
