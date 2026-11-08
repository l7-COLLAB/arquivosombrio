/* Atlas Criminal — locais publicados, não endereços precisos. */
(() => {
  'use strict';
  const API = 'https://iuhotznurbyujzbyhizf.supabase.co/rest/v1/case_atlas_public?select=source_type,source_id,title,summary,country,state_region,city,neighborhood,latitude,longitude,event_year,location_precision,wikidata_id&order=event_year.asc&limit=1000';
  // Chave publicável de navegador; acesso efetivo controlado por GRANT, RLS e view security_invoker.
  const KEY = 'sb_publishable_bpAZ5EhYLIuVoE4Q97s_-A_XQwwRxUj';
  const byId = id => document.getElementById(id);
  const fields = {
    country: byId('atlas-country'),
    region: byId('atlas-region'),
    city: byId('atlas-city'),
    neighborhood: byId('atlas-neighborhood'),
    search: byId('atlas-search'),
    viewport: byId('atlas-viewport')
  };
  const list = byId('atlas-list');
  const feedback = byId('atlas-feedback');
  const counter = byId('atlas-count');
  const form = byId('atlas-filters');
  const discovery = byId('atlas-discovery');
  const placeInput = byId('atlas-place');
  const discoveryResults = byId('atlas-discovery-results');
  const discoveryList = byId('atlas-discovery-list');
  const discoveryStatus = byId('atlas-discovery-status');
  const WIKI_LANGS = ['pt', 'en'];
  const CRIME_TITLE = /\b(assassinato|homicidio|chacina|massacre|sequestro|desaparecimento|atentado|murder|murders|killing|killings|kidnapping|disappearance|shootings?|bombings?|attacks?)\b/;
  const CRIME_EVENT = /\b(assassin\w*|homicidio|chacina|massacre|massacrad\w*|invadiu|refens?|refem|sequestr\w*|desaparec\w*|morto|morta|morrer\w*|atentado|murder\w*|kill\w*|kidnap\w*|disappear\w*|shoot\w*|shot|bomb\w*|stabbed)\b/;
  const BRAZIL_STATES = {
    ac:'acre', al:'alagoas', ap:'amapa', am:'amazonas', ba:'bahia', ce:'ceara',
    df:'distrito federal', es:'espirito santo', go:'goias', ma:'maranhao', mt:'mato grosso',
    ms:'mato grosso do sul', mg:'minas gerais', pa:'para', pb:'paraiba', pr:'parana',
    pe:'pernambuco', pi:'piaui', rj:'rio de janeiro', rn:'rio grande do norte',
    rs:'rio grande do sul', ro:'rondonia', rr:'roraima', sc:'santa catarina',
    sp:'sao paulo', se:'sergipe', to:'tocantins'
  };
  const collator = new Intl.Collator('pt-BR', {sensitivity: 'base'});
  let records = [];
  let map = null;
  let pointsLayer = null;
  let loaded = false;
  let discoveryScope = null;
  let discoveryRequest = null;

  function normalize(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
  }
  function safeText(value) {
    return String(value == null ? '' : value);
  }
  function unique(values) {
    return Array.from(new Set(values.filter(Boolean))).sort(collator.compare);
  }
  function optionList(select, values, label) {
    const current = select.value;
    select.replaceChildren();
    const blank = document.createElement('option');
    blank.value = '';
    blank.textContent = label;
    select.append(blank);
    unique(values).forEach(value => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      select.append(option);
    });
    select.value = Array.from(select.options).some(option => option.value === current) ? current : '';
  }
  function updateChoices() {
    optionList(fields.country, records.map(item => item.country), 'Todos os países');
    const country = fields.country.value;
    const inCountry = records.filter(item => !country || item.country === country);
    optionList(fields.region, inCountry.map(item => item.state_region), 'Todas as regiões');
    const region = fields.region.value;
    const inRegion = inCountry.filter(item => !region || item.state_region === region);
    optionList(fields.city, inRegion.map(item => item.city), 'Todas as cidades');
    const city = fields.city.value;
    const inCity = inRegion.filter(item => !city || item.city === city);
    optionList(fields.neighborhood, inCity.map(item => item.neighborhood), 'Todos os bairros');
    fields.country.disabled = !records.length;
    fields.region.disabled = !inCountry.some(item => item.state_region);
    fields.city.disabled = !inRegion.length;
    fields.neighborhood.disabled = !inCity.some(item => item.neighborhood);
  }
  function matches(item) {
    if (discoveryScope && !matchesPlace(item, discoveryScope)) return false;
    if (fields.country.value && item.country !== fields.country.value) return false;
    if (fields.region.value && item.state_region !== fields.region.value) return false;
    if (fields.city.value && item.city !== fields.city.value) return false;
    if (fields.neighborhood.value && item.neighborhood !== fields.neighborhood.value) return false;
    const search = normalize(fields.search.value);
    return !search || [item.country, item.state_region, item.city, item.neighborhood, item.title, item.summary].some(value => normalize(value).includes(search));
  }
  function locationMatches() {
    return records.filter(matches);
  }
  function inViewport(item) {
    return !fields.viewport.checked || !map || map.getBounds().pad(.02).contains([item.latitude, item.longitude]);
  }
  function sortRecords(a,b) {
    return a.event_year - b.event_year || collator.compare(a.title, b.title) || a.source_id - b.source_id;
  }
  function articleUrl(item) {
    return '/arquivo/' + (item.source_type === 'dossie' ? 'caso-' : 'garimpo-') + item.source_id + '.html';
  }
  function createElement(tag, className, content) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (content != null) el.textContent = safeText(content);
    return el;
  }
  function readablePlace(item) {
    const result = [item.city, item.state_region, item.country].filter(Boolean);
    return result.join(' · ');
  }
  function renderList() {
    if (!loaded) return;
    const matching = locationMatches();
    const visible = matching.filter(inViewport).sort(sortRecords);
    // Um dossiê pode ter várias localidades: liste a publicação uma única vez.
    const seen = new Set();
    const uniqueCases = visible.filter(item => {
      const key = item.source_type + ':' + item.source_id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    list.replaceChildren();
    counter.textContent = uniqueCases.length + (uniqueCases.length === 1 ? ' caso' : ' casos');
    if (!uniqueCases.length) {
      list.append(createElement('p', 'empty', 'Nenhum caso do Arquivo Sombrio nesta seleção. A busca por local também pode encontrar referências na Wikipédia.'));
      feedback.textContent = !matching.length ?
        'Nenhum registro corresponde a esta pesquisa ou combinação de filtros. Tente outra cidade ou limpe os filtros.' :
        fields.viewport.checked ?
          'Há registros catalogados fora da área visível. Mova ou afaste o mapa, ou desmarque “Resultados na área visível”.' :
          'Tente outra cidade ou limpe os filtros.';
      return;
    }
    feedback.textContent = 'Ordem cronológica: ano inicial do acontecimento, do mais antigo ao mais recente.';
    uniqueCases.forEach(item => {
      const article = createElement('article', 'case');
      const time = createElement('time', 'year', item.event_year);
      time.dateTime = String(item.event_year);
      const rail = createElement('div', 'track');
      rail.setAttribute('aria-hidden', 'true');
      const body = createElement('div', 'case-body');
      const meta = createElement('div', 'case-meta');
      meta.append(createElement('span', 'case-kind', item.source_type === 'dossie' ? 'DOSSIÊ' : 'GARIMPO'));
      meta.append(createElement('span', '', readablePlace(item)));
      if (item.neighborhood) meta.append(createElement('span', '', 'Bairro registrado: ' + item.neighborhood));
      const heading = createElement('h3', '', item.title);
      const description = createElement('p', '', item.summary || 'Consulte o registro completo para conhecer o contexto e as fontes.');
      const link = createElement('a', '', 'Abrir registro completo');
      link.href = articleUrl(item);
      link.setAttribute('aria-label', 'Abrir ' + item.title);
      body.append(meta, heading, description, link);
      article.append(time, rail, body);
      list.append(article);
    });
  }
  function groupByCity(items) {
    const grouped = new Map();
    items.forEach(item => {
      const key = [item.country, item.state_region, item.city].map(normalize).join('|');
      if (!grouped.has(key)) grouped.set(key, {country:item.country, region:item.state_region, city:item.city, latitude:item.latitude, longitude:item.longitude, items:[]});
      grouped.get(key).items.push(item);
    });
    return Array.from(grouped.values());
  }
  function markerPopup(group) {
    const box = createElement('div','atlas-popup');
    box.append(createElement('strong', '', group.city));
    box.append(createElement('p', '', group.items.length + (group.items.length === 1 ? ' caso catalogado' : ' casos catalogados') + ' · ' + (group.region || group.country)));
    const button = createElement('button', '', 'Ver casos desta cidade');
    button.type = 'button';
    button.addEventListener('click', () => focusCity(group));
    box.append(button);
    return box;
  }
  function focusCity(group) {
    clearDiscovery();
    placeInput.value = '';
    fields.country.value = group.country;
    updateChoices();
    fields.region.value = group.region || '';
    updateChoices();
    fields.city.value = group.city;
    updateChoices();
    fields.neighborhood.value = '';
    fields.search.value = '';
    if (map) {
      fields.viewport.checked = true;
      map.setView([group.latitude, group.longitude], 10, {animate: false});
    }
    rebuildMarkers();
    renderList();
    byId('atlas-results').scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block:'start'});
  }
  function rebuildMarkers() {
    if (!map || !pointsLayer) return;
    pointsLayer.clearLayers();
    groupByCity(locationMatches()).forEach(group => {
      const count = group.items.length;
      const icon = window.L.divIcon({
        className: 'atlas-point',
        html: '<span class="atlas-pin"><span>' + count + '</span></span>',
        iconSize: [40,40],
        iconAnchor: [20,38]
      });
      const marker = window.L.marker([group.latitude,group.longitude], {icon:icon,keyboard:true,title:group.city + ' · ' + count + ' casos',atlasCaseCount:count});
      marker.bindPopup(markerPopup(group));
      pointsLayer.addLayer(marker);
    });
  }
  function fitItems(items) {
    if (!map || !items.length) return;
    const coords = items.map(item => [item.latitude, item.longitude]);
    if (coords.length === 1) {
      map.setView(coords[0], 9, {animate:false});
    } else {
      map.fitBounds(window.L.latLngBounds(coords),{padding:[35,35],maxZoom:10,animate:false});
    }
  }
  function refreshFilters(changed) {
    if (changed === 'country') {
      fields.region.value = '';
      fields.city.value = '';
      fields.neighborhood.value = '';
    } else if (changed === 'region') {
      fields.city.value = '';
      fields.neighborhood.value = '';
    } else if (changed === 'city') {
      fields.neighborhood.value = '';
    }
    updateChoices();
    rebuildMarkers();
    const matching = locationMatches();
    if (matching.length) fitItems(matching);
    renderList();
  }
  function initMap() {
    if (!window.L) {
      const el = byId('atlas-map');
      el.replaceChildren(createElement('p','map-placeholder','O mapa não carregou. Os casos permanecem acessíveis pelos filtros e pela lista.'));
      fields.viewport.checked = false;
      fields.viewport.disabled = true;
      return;
    }
    byId('atlas-map').replaceChildren();
    map = window.L.map('atlas-map', {zoomControl:true,scrollWheelZoom:false,minZoom:1,maxZoom:12,worldCopyJump:true});
    window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
    }).addTo(map);
    map.setView([18,-27],2);
    const canCluster = typeof window.L.markerClusterGroup === 'function';
    pointsLayer = canCluster ? window.L.markerClusterGroup({
      maxClusterRadius:55,
      disableClusteringAtZoom:11,
      spiderfyOnMaxZoom:true,
      iconCreateFunction: cluster => {
        const total = cluster.getAllChildMarkers().reduce((n,marker) => n + Number(marker.options.atlasCaseCount || 1),0);
        return window.L.divIcon({html:'<span class="atlas-cluster">' + total + '</span>',className:'atlas-point',iconSize:[44,44],iconAnchor:[22,22]});
      }
    }) : window.L.featureGroup();
    pointsLayer.addTo(map);
    map.on('moveend', renderList);
    map.on('zoomend', renderList);
  }
  function placeWords(value) {
    return normalize(value).replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  }
  function parsePlace(value) {
    const parts = value.split(',').map(part => part.trim()).filter(Boolean);
    if (!parts.length || parts.length > 4 || parts.some(part =>
      !/^[\p{L}\p{M}\d .’'-]+$/u.test(part) || !/\p{L}/u.test(part) || placeWords(part).length < 2)) return null;
    const [name, ...qualifiers] = parts;
    return {name, key: placeWords(name), qualifiers, label: parts.join(', ')};
  }
  function hasPlace(text, key) {
    return (' ' + text + ' ').includes(' ' + key + ' ');
  }
  function hasQualifier(text, qualifier) {
    const key = placeWords(qualifier);
    return hasPlace(text, key) || Boolean(BRAZIL_STATES[key] && hasPlace(text, BRAZIL_STATES[key]));
  }
  function matchesPlace(item, place) {
    const locations = [item.neighborhood, item.city, item.state_region, item.country].map(placeWords);
    return locations.includes(place.key) && place.qualifiers.every(qualifier =>
      locations.some(location => hasQualifier(location, qualifier)));
  }
  function eventTitle(value) {
    return placeWords(value.split(':', 1)[0]).replace(/^(?:caso|assassinato|homicidio|morte|desaparecimento|sequestro|murder|killing|death|disappearance|kidnapping) (?:d[aeo]s? |of )?/, '');
  }
  function publishedMatch(candidate, place) {
    const nearby = records.filter(item => matchesPlace(item, place));
    const sameId = candidate.wikidataId ? nearby.filter(item => item.wikidata_id === candidate.wikidataId) : [];
    const title = eventTitle(candidate.title);
    const options = sameId.length ? sameId : nearby.filter(item =>
      title.includes(' ') && eventTitle(item.title) === title &&
      (!candidate.wikidataId || !item.wikidata_id || item.wikidata_id === candidate.wikidataId));
    const cases = new Map(options.map(item => [item.source_type + ':' + item.source_id, item]));
    return cases.size === 1 ? cases.values().next().value : null;
  }
  function wikiCandidate(page, lang, place) {
    const {title, pageid, extract = '', pageprops = {}} = page;
    if (typeof title !== 'string' || typeof extract !== 'string' ||
        !Number.isSafeInteger(pageid) || pageid < 1 || 'disambiguation' in pageprops) return null;
    const heading = placeWords(title);
    if (/^(lista|list|categoria|category|cronologia|timeline|histor(i|y)a?|reactions to|reacoes ao)\b/.test(heading) ||
        /\b(conspiracy theories|teorias da conspiracao|shooting sports)\b/.test(heading)) return null;
    const wikidataId = typeof pageprops.wikibase_item === 'string' && /^Q[1-9][0-9]{0,11}$/.test(pageprops.wikibase_item) ? pageprops.wikibase_item : '';
    const candidate = {title, pageid, lang, wikidataId};
    if (publishedMatch(candidate, place)) return candidate;
    const lead = extract.slice(0, 1800);
    const text = placeWords(title + ' ' + lead);
    if (!place.qualifiers.every(part => hasQualifier(text, part))) return null;
    // A busca encontra menções. Só sugerimos verbetes cujo início ou título associa o local ao acontecimento.
    const explicitTitle = CRIME_TITLE.test(heading);
    const lifeEvent = /\b(nasceu|nascid[oa]|born|cresceu|grew up)\b/;
    const locative = new RegExp('\\b(?:em|na|nas|no|nos|in|at|near) (?:a |o |the )?(?:(?:cidade|bairro|municipio|estado|regiao|distrito) (?:de|do|da) |(?:city|town|state|district|neighborhood) of )?(?:central |north |south |east |west |northeast |northwest |southeast |southwest )?' + place.key + '(?: |$)');
    const titlePlacesEvent = locative.test(heading) ||
      new RegExp('(?:^| )' + place.key + ' (?:bombings?|shootings?|attacks?|murders?|massacre)(?: |$)').test(heading);
    const locationInEvent = lead.split(/(?<=[.!?])\s+|\n+/u).slice(0, 3).some(sentence => {
      const statement = placeWords(sentence);
      return !lifeEvent.test(statement) &&
        locative.test(statement) && CRIME_EVENT.test(statement);
    });
    if (!((explicitTitle && !lifeEvent.test(heading) && titlePlacesEvent) ||
        ((explicitTitle || /^caso\b/.test(heading)) && locationInEvent))) return null;
    return candidate;
  }
  async function searchWiki(lang, place, signal) {
    const keywords = lang === 'pt' ? 'assassinato|homicidio|homicídio|chacina|massacre|sequestro|desaparecimento|atentado|caso' :
      'murder|murders|killing|killings|massacre|kidnapping|disappearance|shooting|bombing|attack';
    const params = new URLSearchParams({
      action:'query', generator:'search', gsrnamespace:'0', gsrlimit:'15',
      gsrsearch:'"' + place.name + '" intitle:/(' + keywords + ')/i',
      prop:'extracts|pageprops', ppprop:'wikibase_item|disambiguation',
      exintro:'1', explaintext:'1', exlimit:'15',
      format:'json', formatversion:'2', origin:'*'
    });
    const response = await fetch('https://' + lang + '.wikipedia.org/w/api.php?' + params, {
      credentials:'omit', referrerPolicy:'no-referrer', signal
    });
    if (!response.ok) throw new Error('Wikipédia: HTTP ' + response.status);
    const data = await response.json();
    if (data.error) throw new Error('Wikipédia: consulta indisponível');
    return (data.query?.pages || []).sort((a,b) => a.index - b.index);
  }
  function clearDiscovery() {
    discoveryRequest?.abort();
    discoveryRequest = null;
    discoveryScope = null;
    discoveryResults.hidden = true;
    discoveryResults.removeAttribute('aria-busy');
    discoveryList.replaceChildren();
  }
  function renderDiscovery(responses, place) {
    const seen = new Set();
    const catalogued = new Set(locationMatches().filter(inViewport).map(item => item.source_type + ':' + item.source_id));
    const external = [];
    let alreadyListed = 0;
    let failures = 0;
    for (const [index, result] of responses.entries()) {
      if (result.status === 'rejected') {
        failures++;
        continue;
      }
      const lang = WIKI_LANGS[index];
      for (const page of result.value) {
        const candidate = wikiCandidate(page, lang, place);
        if (!candidate) continue;
        const match = publishedMatch(candidate, place);
        const key = match ? match.source_type + ':' + match.source_id : candidate.wikidataId || lang + ':' + candidate.pageid;
        if (seen.has(key)) continue;
        seen.add(key);
        if (catalogued.has(key)) alreadyListed++;
        else external.push({candidate, match});
      }
    }
    discoveryList.replaceChildren();
    for (const {candidate, match} of external.slice(0, 12)) {
      const item = createElement('li', 'case-body');
      item.append(createElement('span', 'case-meta', match ? 'ARQUIVO SOMBRIO' :
        'FONTE EXTERNA · WIKIPÉDIA (' + candidate.lang.toUpperCase() + ')'));
      item.append(createElement('h3', '', match?.title || candidate.title));
      const link = createElement('a', '', match ? 'Ler no Arquivo Sombrio' : 'Abrir referência na Wikipédia');
      link.href = match ? articleUrl(match) : 'https://' + candidate.lang + '.wikipedia.org/?curid=' + candidate.pageid;
      if (!match) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
      link.setAttribute('aria-label', link.textContent + ': ' + (match?.title || candidate.title));
      item.append(link);
      discoveryList.append(item);
    }
    const suffix = ' Local pesquisado: ' + place.label + '.';
    if (failures === WIKI_LANGS.length) {
      discoveryStatus.textContent = 'A consulta à Wikipédia está temporariamente indisponível. Tente novamente.' + suffix;
    } else if (!external.length) {
      discoveryStatus.textContent = (alreadyListed ? 'Os casos correspondentes estão listados no acervo acima.' :
        'A busca não encontrou referências que associassem um caso a este local. Tente outra grafia ou inclua a região.') + suffix;
    } else {
      discoveryStatus.textContent = 'Links externos são sugestões de pesquisa. Confirme a localização e as fontes no verbete.' + suffix;
    }
    if (failures && failures < WIKI_LANGS.length) discoveryStatus.textContent += ' Uma das consultas à Wikipédia falhou.';
  }
  async function discover(event) {
    event.preventDefault();
    if (discoveryRequest && parsePlace(placeInput.value)?.label === discoveryScope?.label) return;
    clearDiscovery();
    discoveryResults.hidden = false;
    const place = parsePlace(placeInput.value);
    if (!place) {
      discoveryStatus.textContent = 'Digite um local válido, com até quatro partes separadas por vírgulas.';
      discoveryResults.scrollIntoView({block:'start'});
      return;
    }
    discoveryScope = place;
    for (const name of ['country','region','city','neighborhood','search']) fields[name].value = '';
    refreshFilters();
    byId('atlas-results').scrollIntoView({block:'start'});
    discoveryStatus.textContent = 'Consultando referências para ' + place.label + '…';
    discoveryResults.setAttribute('aria-busy', 'true');
    const controller = new AbortController();
    discoveryRequest = controller;
    const timer = window.setTimeout(() => controller.abort(), 8000);
    const results = await Promise.allSettled(WIKI_LANGS.map(lang => searchWiki(lang, place, controller.signal)));
    window.clearTimeout(timer);
    if (discoveryRequest !== controller) return;
    discoveryRequest = null;
    discoveryResults.removeAttribute('aria-busy');
    renderDiscovery(results, place);
    if (!loaded) catalogueReady.then(() => {
      if (loaded && discoveryScope === place) renderDiscovery(results, place);
    });
  }
  function bindControls() {
    discovery.addEventListener('submit', discover);
    ['country','region','city','neighborhood'].forEach(name => {
      fields[name].addEventListener('change', () => {
        clearDiscovery();
        placeInput.value = '';
        refreshFilters(name);
      });
    });
    // Localização pesquisada deve ficar visível mesmo quando o usuário estava com zoom em outra cidade.
    fields.search.addEventListener('input', () => {
      clearDiscovery();
      placeInput.value = '';
      rebuildMarkers();
      const matching = locationMatches();
      if (matching.length) fitItems(matching);
      renderList();
    });
    fields.viewport.addEventListener('change', renderList);
    form.addEventListener('submit', event => {
      event.preventDefault();
      fitItems(locationMatches());
      renderList();
    });
    form.addEventListener('reset', event => {
      event.preventDefault();
      clearDiscovery();
      placeInput.value = '';
      Object.keys(fields).forEach(name => {
        if (['country','region','city','neighborhood','search'].includes(name)) fields[name].value = '';
      });
      fields.viewport.checked = true;
      updateChoices();
      rebuildMarkers();
      fitItems(records);
      renderList();
    });
  }
  async function load() {
    bindControls();
    try {
      const response = await fetch(API,{headers:{apikey:KEY,Accept:'application/json'},credentials:'omit',cache:'no-store'});
      if (!response.ok) throw new Error('Consulta pública indisponível (' + response.status + ')');
      const json = await response.json();
      if (!Array.isArray(json)) throw new Error('Resposta inesperada');
      records = json.map(item => ({
        source_type:item.source_type,
        source_id:Number(item.source_id),
        title:safeText(item.title),
        summary:safeText(item.summary),
        country:safeText(item.country),
        state_region:safeText(item.state_region),
        city:safeText(item.city),
        neighborhood:safeText(item.neighborhood),
        latitude:Number(item.latitude),
        longitude:Number(item.longitude),
        event_year:Number(item.event_year),
        location_precision:item.location_precision,
        wikidata_id:safeText(item.wikidata_id)
      })).filter(item =>
        ['dossie','garimpo'].includes(item.source_type) &&
        Number.isSafeInteger(item.source_id) && item.source_id > 0 &&
        Number.isInteger(item.event_year) && item.event_year >= 1000 &&
        Number.isFinite(item.latitude) && Math.abs(item.latitude) <= 90 &&
        Number.isFinite(item.longitude) && Math.abs(item.longitude) <= 180 &&
        item.title && item.country && item.city
      );
      loaded = true;
      initMap();
      updateChoices();
      rebuildMarkers();
      if (records.length) fitItems(records);
      renderList();
    } catch (error) {
      loaded = false;
      byId('atlas-map').replaceChildren(createElement('p','map-placeholder','Mapa temporariamente indisponível.'));
      updateChoices();
      feedback.textContent = 'Não foi possível consultar os registros geográficos agora. Tente atualizar esta página.';
      list.replaceChildren(createElement('p','empty','O acervo geográfico está temporariamente indisponível. Os demais artigos do site continuam acessíveis.'));
      counter.textContent = 'Consulta indisponível';
      if (map) map.setView([18,-27],2);
      console.warn('Atlas Criminal:',error.message);
    }
  }
  const catalogueReady = load();
})();