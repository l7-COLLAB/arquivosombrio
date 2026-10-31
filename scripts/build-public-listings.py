"""Pre-render existing collection grids without changing their CSS or routes."""
from datetime import datetime
from html import escape
from html.parser import HTMLParser
import json
import unicodedata
from urllib.parse import urlsplit

LIST_FIELDS = {
    'Casos': ['imagem', 'local', 'ano', 'status', 'published_at', 'acompanhamento_status'],
    'casos_diarios': ['imagem_capa', 'local', 'data_caso', 'status_caso', 'acompanhamento_status'],
    'lendas': ['imagem_capa', 'origem', 'periodo'],
    'creepypastas': ['imagem_capa', 'origem', 'periodo_origem'],
    'pericias': ['imagem'],
}
BASE_FIELDS = ['id', 'titulo', 'resumo', 'categoria', 'status_publicacao', 'created_at', 'publicado_em']
ROUTES = {'Casos': 'caso', 'casos_diarios': 'garimpo', 'lendas': 'lendas', 'creepypastas': 'creepypastas', 'pericias': 'pericia'}

def published(row, now):
    if row.get('status_publicacao') != 'publicado':
        return False
    raw = row.get('published_at') or row.get('publicado_em')
    if not raw:
        return True
    date = datetime.fromisoformat(str(raw).replace('Z', '+00:00'))
    if date.tzinfo is None:
        raise ValueError('Data de publicação sem fuso horário')
    return date <= now

def normalize(value):
    return ''.join(c for c in unicodedata.normalize('NFD', str(value or '')) if not unicodedata.combining(c)).strip().upper()

def collection_rows(table, rows):
    result = []
    for row in rows:
        category = normalize(row.get('categoria'))
        if table in ('Casos', 'casos_diarios') and (category == 'PERICIA' or category.startswith('PERICIA ')):
            continue
        if table == 'casos_diarios' and (category == 'ESPECIAL' or category.startswith('ESPECIAL ')):
            continue
        result.append(row)
    def order(row):
        raw = row.get('published_at') or row.get('publicado_em') or row.get('created_at')
        stamp = datetime.fromisoformat(raw.replace('Z', '+00:00')).timestamp() if raw else 0
        return stamp, int(row['id'])
    return sorted(result, key=order, reverse=True)

def metadata(table, rows):
    output = []
    for row in collection_rows(table, rows):
        if row.get('status_publicacao') != 'publicado' or not str(row['id']).isascii() or not str(row['id']).isdecimal():
            raise ValueError('Registro inválido na listagem')
        item = {key: row[key] for key in BASE_FIELDS + LIST_FIELDS[table] if key in row}
        item['__static_url'] = '/arquivo/' + ROUTES[table] + '-' + str(row['id']) + '.html'
        output.append(item)
    return output

def e(value):
    return escape(str(value or ''), quote=True)

def image_url(value):
    value = str(value or '').strip()
    parsed = urlsplit(value)
    if not value or value.startswith('//') or '\\' in value or any(ord(c) < 32 for c in value):
        return '/imagem-compartilhamento.jpg'
    if parsed.scheme and parsed.scheme not in ('https', 'http'):
        return '/imagem-compartilhamento.jpg'
    return value

def card(table, row):
    url, title, summary = e(row['__static_url']), e(row['titulo']), e(row.get('resumo'))
    image = e(image_url(row.get('imagem') if table in ('Casos', 'pericias') else row.get('imagem_capa')))
    if table == 'Casos':
        return f'''<article class="case-card" data-case-id="{e(row['id'])}"><a class="case-card-link" href="{url}" aria-label="Abrir dossiê: {title}"><div class="card-image"><img src="{image}" alt="{title}" width="800" height="500" loading="lazy" decoding="async"><span class="badge status">{e(row.get('status') or 'EM ARQUIVO')}</span></div><div class="card-content"><span class="badge category">{e(row.get('categoria') or 'ARQUIVO')}</span><h3>{title}</h3><div class="card-meta"><span>{e(row.get('local') or 'Local desconhecido')}</span><span>{e(row.get('ano') or 'Data desconhecida')}</span></div><p class="card-summary">{summary}</p><span class="btn-read-more">Abrir dossiê →</span></div></a></article>'''
    if table == 'pericias':
        return f'''<article class="case-card" data-forensic-id="{e(row['id'])}"><a class="case-card-link" href="{url}" aria-label="Abrir perícia: {title}"><div class="card-image"><img src="{image}" alt="{title}" width="800" height="500" loading="lazy" decoding="async"><span class="badge status">TÉCNICO / METODOLÓGICO</span></div><div class="card-content"><span class="badge category">{e(row.get('categoria') or 'PERÍCIA')}</span><h3>{title}</h3><div class="card-meta"><span>Ciência Forense</span><span>Artigo técnico</span></div><p class="card-summary">{summary}</p><span class="btn-read-more">Abrir perícia →</span></div></a></article>'''
    if table == 'casos_diarios':
        return f'<a class="home-daily-card"' href="{url}"><img src="{image}" alt="" width="92" height="104" loading="lazy" decoding="async"><div><small>{e(row.get("categoria") or "GARIMPO SOMBRIO")}</small><strong>{title}</strong><p>{summary}</p></div></a>'
    label = 'LENDA' if table == 'lendas' else 'CREEPYPASTA'
    return f'<a class="archive-literary-card" href="{url}"><div class="archive-literary-card-media"><img src="{image}" alt="" width="184" height="154" loading="lazy" decoding="async"></div><div><span class="archive-literary-card-label">{label}</span><h2>{title}</h2><p>{summary}</p></div></a>'

class ElementSpan(HTMLParser):
    """Locate inner HTML by ID, preserving original markup outside the element."""
    def __init__(self, source, ident):
        super().__init__(convert_charrefs=False)
        self.offsets = [0]
        for line in source.splitlines(keepends=True):
            self.offsets.append(self.offsets[-1] + len(line))
        self.ident, self.depth, self.tag = ident, 0, None
        self.spans = []
        self.feed(source)
    def source_position(self):
        line, col = self.getpos()
        return self.offsets[line - 1] + col
    def handle_starttag(self, tag, attrs):
        if self.depth:
            if tag == self.tag:
                self.depth += 1
        elif dict(attrs).get('id') == self.ident:
            self.tag, self.depth = tag, 1
            self.start = self.source_position() + len(self.get_starttag_text())
    def handle_endtag(self, tag):
        if self.depth and tag == self.tag:
            self.depth -= 1
            if not self.depth:
                self.spans.append((self.start, self.source_position()))

def replace_contents(html, ident, content):
    spans = ElementSpan(html, ident).spans
    if len(spans) != 1:
        raise ValueError(f'Esperado um elemento #{ident}, encontrados {len(spans)}')
    start, end = spans[0]
    return html[:start] + content + html[end:]

def render_listing(html, table, rows, ident):
    cards = ''.join(card(table, row) for row in rows)
    return replace_contents(html, ident, cards or '<p class="archive-literary-empty">Nenhum arquivo publicado nesta coleção.</p>')

def prepare(site, datasets):
    """Return all edits first, so missing templates abort before any file is written."""
    catalog = {table: metadata(table, datasets[table]) for table in ROUTES}
    edits = {}
    targets = {
        'index.html': [('Casos', 'grid-casos'), ('casos_diarios', 'home-daily-feed'), ('pericias', 'grid-forense')],
        'dossies.html': [('Casos', 'grid-casos'), ('casos_diarios', 'home-daily-feed'), ('pericias', 'grid-forense')],
        'pericia.html': [('Casos', 'grid-casos'), ('casos_diarios', 'home-daily-feed'), ('pericias', 'grid-forense')],
        'forum.html': [('Casos', 'grid-casos'), ('casos_diarios', 'home-daily-feed'), ('pericias', 'grid-forense')],
        'garimpo.html': [('casos_diarios', 'daily-archive-grid')],
        'lendas.html': [('lendas', 'literary-grid')],
        'creepypastas.html': [('creepypastas', 'literary-grid')],
    }
    for filename, grids in targets.items():
        html = (site / filename).read_text(encoding='utf-8')
        if 'id="as-public-listings"' in html:
            raise ValueError('Listagem já gerada: ' + filename)
        snapshot = {}
        for table, ident in grids:
            # Full dossier collection remains available without JS; existing JS handles home pagination.
            rows = catalog[table][:6] if ident == 'home-daily-feed' else catalog[table]
            html = render_listing(html, table, rows, ident)
            snapshot[table] = rows
            if ident == 'grid-casos':
                html = replace_contents(html, 'contador-casos', str(len(rows)))
                html = replace_contents(html, 'contador-texto', 'dossiê encontrado' if len(rows) == 1 else 'dossiês encontrados')
        payload = json.dumps(snapshot, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')
        head = '<script type="application/json" id="as-public-listings">' + payload + '</script>\n<script src="/js/public-listings.js?v=1"></script>\n'
        head += '<noscript><style>.archive-search-panel,.archive-literary-search,.archive-quick-filters,.archive-results-bar .active-filter-indicator{display:none!important}</style></noscript>\n'
        if html.count('</head>') != 1:
            raise ValueError('Cabeçalho inválido: ' + filename)
        edits[filename] = html.replace('</head>', head + '</head>')
    return edits
