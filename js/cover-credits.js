/* Créditos de imagens documentais e avisos das capas ilustrativas substitutas. */
(function () {
  'use strict';
  var script = document.currentScript;
  if (!script) return;
  var originalManifest = new URL('../data/capas-documentais.json', script.src).href;
  var illustrationManifest = new URL('../data/capas-alternativas-direitos-20261103.json', script.src).href;
  var uploadManifest = new URL('../data/alternativas-originais-uploads-20261103.json', script.src).href;
  var selector = '.daily-reader-cover, .archive-literary-detail-cover, #caso-imagem, .forensic-detail-image img, .article-cover img';
  var illustrationCaption = 'Capa ilustrativa original do Arquivo Sombrio. Não é fotografia, retrato nem evidência do caso.';
  function load(url) {
    return fetch(url).then(function (response) {
      if (!response.ok) throw new Error('Catálogo de créditos indisponível');
      return response.json();
    }).catch(function () { return null; });
  }
  function link(label, href, host) {
    var url = new URL(href);
    if (url.protocol !== 'https:' || url.hostname !== host) throw new Error('Fonte inválida');
    var anchor = document.createElement('a');
    anchor.textContent = label;
    anchor.href = url.href;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    return anchor;
  }
  function captionFor(img) {
    var figure = img.parentElement && img.parentElement.tagName === 'FIGURE' ? img.parentElement : null;
    var caption = figure && figure.querySelector('figcaption');
    if (!caption && !figure && img.nextElementSibling && img.nextElementSibling.classList.contains('documentary-cover-credit')) {
      caption = img.nextElementSibling;
    }
    if (!caption) {
      caption = document.createElement(figure ? 'figcaption' : 'p');
      img.insertAdjacentElement('afterend', caption);
    }
    caption.classList.add('documentary-cover-credit');
    caption.style.cssText = 'font-size:.875rem;line-height:1.6;margin:.75rem 0 1.5rem;max-width:80ch';
    return caption;
  }
  Promise.all([load(originalManifest), load(illustrationManifest), load(uploadManifest)]).then(function (catalogues) {
    var documentary = new Map();
    (Array.isArray(catalogues[0]) ? catalogues[0] : []).forEach(function (row) {
      if (typeof row.asset_path === 'string') documentary.set('/' + row.asset_path.replace(/^\/+/, ''), row);
    });
    var illustrations = new Map();
    var proposed = catalogues[1] && Array.isArray(catalogues[1].records) ? catalogues[1].records : [];
    var uploaded = catalogues[2] && Array.isArray(catalogues[2].records) ? catalogues[2].records : [];
    uploaded.forEach(function (row) {
      if (typeof row.cover_path === 'string' && row.cover_path.indexOf('assets/capas-alternativas-direitos/') === 0) {
        illustrations.set('/' + row.cover_path, { titulo: row.original_title });
      }
      if (typeof row.story_path === 'string' && row.story_path.indexOf('assets/capas-alternativas-direitos/') === 0) {
        illustrations.set('/' + row.story_path, { titulo: row.original_title });
      }
    });
    proposed.forEach(function (row) {
      if (typeof row.alternative_path === 'string' && row.alternative_path.indexOf('assets/capas-alternativas-direitos/') === 0) {
        illustrations.set('/' + row.alternative_path, row);
      }
    });
    var queued = false;
    function render() {
      queued = false;
      document.querySelectorAll(selector).forEach(function (img) {
        var path;
        try { path = new URL(img.src, document.baseURI).pathname; } catch (_) { return; }
        if (img.dataset.coverCredit === path) return;
        var illustration = illustrations.get(path);
        if (illustration) {
          var caption = captionFor(img);
          caption.replaceChildren(document.createTextNode(illustrationCaption));
          img.alt = 'Capa ilustrativa de ' + (illustration.titulo || 'um arquivo do Arquivo Sombrio') + '. Não é fotografia do caso.';
          img.dataset.coverCredit = path;
          return;
        }
        var entry = Array.from(documentary.entries()).find(function (pair) { return path.endsWith(pair[0]); });
        if (!entry) return;
        var row = entry[1];
        var caption = captionFor(img);
        caption.replaceChildren(document.createTextNode(row.caption + ' Crédito: ' + row.credit + '. '));
        try {
          caption.appendChild(link('Fonte da imagem', row.source_url, 'commons.wikimedia.org'));
          caption.appendChild(document.createTextNode(' · '));
          caption.appendChild(link(row.license, row.license_url, 'creativecommons.org'));
        } catch (_) {
          // O crédito não deve perder o texto quando uma URL histórica não satisfaz a validação.
        }
        caption.appendChild(document.createTextNode('. ' + (row.changes || '')));
        img.dataset.coverCredit = path;
        img.alt = row.caption;
      });
    }
    function schedule() {
      if (!queued) { queued = true; requestAnimationFrame(render); }
    }
    render();
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
  });
})();
