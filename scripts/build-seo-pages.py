#!/usr/bin/env python3
"""Create canonical, crawlable HTML snapshots of published Archivo Sombrio articles.

GitHub Pages does not serve different HTML for ?id= URLs. These pages preserve
the original interactive reading routes through explicit navigation links.
Only publicly visible records are queried; failed queries abort before writing.
"""
from __future__ import annotations

import datetime as dt
from html import escape
import importlib.util
import json
from pathlib import Path
import re
import sys
from urllib.parse import urlencode
from urllib.request import Request, urlopen

SCRIPT = Path(__file__).with_name("build-public-sitemap.py")
spec = importlib.util.spec_from_file_location("arquivo_sitemap", SCRIPT)
sitemap = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(sitemap)

listing_spec = importlib.util.spec_from_file_location("public_listings", Path(__file__).with_name("build-public-listings.py"))
listings = importlib.util.module_from_spec(listing_spec)
listing_spec.loader.exec_module(listings)

format_spec = importlib.util.spec_from_file_location("seo_article_format", Path(__file__).with_name("seo-article-format.py"))
article_format = importlib.util.module_from_spec(format_spec)
format_spec.loader.exec_module(article_format)

updates_spec = importlib.util.spec_from_file_location("public_updates", Path(__file__).with_name("build-public-updates.py"))
updates = importlib.util.module_from_spec(updates_spec)
updates_spec.loader.exec_module(updates)

PUBLIC_TABLES = {
    "Casos": ("caso.html", "Dossiês", "historia", "imagem"),
    "casos_diarios": ("garimpo.html", "Garimpo Sombrio", "conteudo", "imagem_capa"),
    "pericias": ("pericia.html", "Perícia Forense", "historia_tecnica", "imagem"),
    "lendas": ("lendas.html", "Lendas", "conteudo", "imagem_capa"),
    "creepypastas": ("creepypastas.html", "Creepypastas", "conteudo", "imagem_capa"),
}
def safe_id(value):
    ident = str(value)
    if not ident.isascii() or not ident.isdecimal():
        raise ValueError("ID público inválido")
    return ident

def public_rows(table, now=None):
    page, label, narrative, image = PUBLIC_TABLES[table]
    fields = ["id", "titulo", "resumo", "categoria", "status_publicacao",
              "created_at", "updated_at", narrative] + listings.LIST_FIELDS[table]
    if table == "Casos":
        fields.append("documentos")
    else:
        fields.extend(["publicado_em", "fontes"])
    if table == "pericias":
        fields.extend(["legenda_imagem", "fonte_imagem"])
    params = urlencode({
        "select": ",".join(fields),
        "status_publicacao": "eq.publicado",
        "order": "id.asc",
        "limit": str(sitemap.MAX_PER_TABLE)
    })
    request = Request(
        sitemap.API + table + "?" + params,
        headers={"apikey": sitemap.PUBLIC_KEY,
                 "Authorization": "Bearer " + sitemap.PUBLIC_KEY,
                 "Accept": "application/json"}
    )
    with urlopen(request, timeout=30) as response:
        if response.status != 200:
            raise RuntimeError(f"Não foi possível obter {table}")
        rows = json.load(response)
    if not isinstance(rows, list) or len(rows) >= sitemap.MAX_PER_TABLE:
        raise ValueError(f"Consulta inválida ou truncada de {table}")
    for row in rows:
        if not isinstance(row, dict) or row.get("status_publicacao") != "publicado":
            raise ValueError(f"Registro não publicado em {table}")
        safe_id(row.get("id"))
        if not str(row.get("titulo") or "").strip():
            raise ValueError(f"Registro sem título em {table}")
        sitemap.lastmod(row)
    now = now or dt.datetime.now(dt.timezone.utc)
    return [row for row in rows if listings.published(row, now)]

def plain_text(value, limit=100000):
    value = str(value or "")
    value = re.sub(r"<[^>]*>", " ", value)
    value = re.sub(r"(?m)^#{1,6}\s*", "", value)
    value = re.sub(r"\s+", " ", value).strip()
    return value[:limit]

def canonical_path(page, ident):
    return "arquivo/" + page.removesuffix(".html") + "-" + safe_id(ident) + ".html"

def render_page(table, row, related=None, cross_editorial=None):
    page, label, field, _image_field = PUBLIC_TABLES[table]
    ident = safe_id(row["id"])
    title = plain_text(row["titulo"], 170)
    description = plain_text(row.get("resumo") or row.get(field) or title, 160)
    narrative = row.get(field) or row.get("resumo") or description
    article_body = article_format.render_narrative(narrative)
    image_value = row.get("imagem" if table in ("Casos", "pericias") else "imagem_capa")
    cover = article_format.cover_url(image_value)
    image_figure = ""
    if image_value and cover != article_format.FALLBACK_COVER:
        caption = row.get("legenda_imagem") if table == "pericias" else None
        caption_html = "<figcaption>" + escape(str(caption), quote=True) + "</figcaption>" if caption else ""
        image_figure = ('<figure class="article-cover"><img src="' + escape(cover, quote=True) + '" alt="Capa do arquivo: '
                        + escape(title, quote=True) + '" width="1200" height="700" decoding="async">'
                        + caption_html + '</figure>')
    references = article_format.render_references(row.get("documentos") if table == "Casos" else row.get("fontes"))
    path = canonical_path(page, ident)
    canonical = sitemap.BASE + path
    original = sitemap.BASE + page + "?id=" + ident
    headline = title + " — Arquivo Sombrio"
    published = row.get("published_at") or row.get("publicado_em") or row.get("created_at")
    modified = row.get("updated_at") or published
    schema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title,
        "description": description,
        "mainEntityOfPage": canonical,
        "author": {"@type": "Organization", "name": "Arquivo Sombrio"},
        "publisher": {"@type": "Organization", "name": "Arquivo Sombrio"},
        "articleSection": label,
        "inLanguage": "pt-BR",
        "image": [cover]
    }
    for key, date in (("datePublished", published), ("dateModified", modified)):
        if date:
            schema[key] = str(date)
    json_ld = json.dumps(schema, ensure_ascii=False).replace("<", "\\u003c")
    e = lambda value: escape(str(value or ""), quote=True)
    related_links = ""
    if related:
        links = []
        for peer in related[:3]:
            if peer.get("status_publicacao") != "publicado":
                raise ValueError("Sugestão de leitura não publicada")
            if safe_id(peer["id"]) == ident:
                raise ValueError("Link para o próprio dossiê")
            href = sitemap.BASE + canonical_path(page, peer["id"])
            label_peer = plain_text(peer.get("titulo"), 135)
            if not label_peer:
                raise ValueError("Título vazio na sugestão")
            links.append(f'<li><a href="{e(href)}">{e(label_peer)}</a></li>')
        related_links = ('<aside class="related-documents" aria-label="Outros registros publicados da mesma editoria">'
                         '<h2>Continue explorando esta editoria</h2>'
                         '<p>Outros registros publicados na mesma coleção. A lista não indica relação factual entre os casos.</p>'
                         '<ul>' + "".join(links) + '</ul></aside>')

    # Curated-by-editorial-position discovery: these are navigation options,
    # never factual relationships. Show at most two other published collections.
    cross_links = ""
    if cross_editorial:
        items = []
        for other_table, peer in cross_editorial[:2]:
            if other_table == table or other_table not in PUBLIC_TABLES:
                raise ValueError("Editorias cruzadas inválidas")
            if peer.get("status_publicacao") != "publicado":
                raise ValueError("Leitura cruzada não publicada")
            other_page, other_label, _, _ = PUBLIC_TABLES[other_table]
            target = sitemap.BASE + canonical_path(other_page, peer["id"])
            peer_title = plain_text(peer.get("titulo"), 135)
            if not peer_title:
                raise ValueError("Leitura cruzada sem título")
            items.append(f'<li><span>{e(other_label)}</span> '
                         f'<a href="{e(target)}">{e(peer_title)}</a></li>')
        if items:
            cross_links = ('<aside class="cross-editorial" aria-label="Descubra outras editorias">'
                           '<h2>Explore outras editorias</h2>'
                           '<p>Leituras de outras categorias do acervo. Estas indicações não representam '
                           'vínculo factual entre os assuntos.</p>'
                           '<ul>' + "".join(items) + '</ul></aside>')
    style = """*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#0b0d10;color:#e7dcc6;font:17px/1.85 Georgia,"Times New Roman",serif}
main,header,footer{width:min(100% - 36px,840px);margin:auto}header{padding:24px 0;border-bottom:1px solid #a28758}main{padding:35px 0 65px}footer{padding:22px 0 38px;border-top:1px solid #60503c}
h1{font:700 clamp(2rem,5vw,3.1rem)/1.22 Georgia,serif;margin:13px 0 20px}a{color:#d9b77d;text-underline-offset:3px}nav{display:flex;gap:18px;flex-wrap:wrap}nav a{margin:0}
small,.article-kicker{color:#bca882;letter-spacing:.08em;font:12px/1.6 "DM Mono",monospace;text-transform:uppercase}
.article-summary{font-size:1.09rem;color:#dcccb1;line-height:1.75;max-width:72ch}.article-original-link{display:inline-block;padding:11px 0}
article{overflow-wrap:anywhere;margin-top:34px}article p{margin:0 0 1.35em;max-width:76ch}article h2{color:#eed7ae;font:700 clamp(1.3rem,3vw,1.65rem)/1.35 Georgia,serif;margin:2.1em 0 .7em;border-left:2px solid #a28758;padding-left:16px}article h3{color:#e9d8bd;font-size:1.2rem;margin:1.7em 0 .6em}article ul{padding-left:25px;margin:0 0 1.5em}article li{margin:.45em 0}
.article-cover{margin:32px 0 20px}.article-cover img{display:block;width:100%;height:auto;max-height:550px;object-fit:contain;background:#171a1e}.article-cover figcaption{padding:10px 0;color:#bca882;font-size:.85rem}
.article-references,.related-documents,.cross-editorial{border-top:1px solid #a28758;margin:42px 0 0;padding:22px 0}.article-references h2,.related-documents h2,.cross-editorial h2{color:#eed7ae;font-size:1.35rem}.article-references ol,.related-documents ul,.cross-editorial ul{padding-left:24px}.article-references li,.related-documents li,.cross-editorial li{margin:13px 0;overflow-wrap:anywhere}.article-references p,.related-documents p,.cross-editorial p{color:#bca882;font-size:.91rem}.cross-editorial span{color:#bca882;font:12px "DM Mono",monospace}
a:focus-visible{outline:2px solid #e7dcc6;outline-offset:3px}@media(max-width:600px){body{font-size:16px}main,header,footer{width:min(100% - 30px,840px)}main{padding-top:25px}.article-cover{margin:22px 0}}"""
    html = f"""<!doctype html>
<html lang="pt-BR"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(headline)}</title>
<meta name="description" content="{e(description)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="{e(canonical)}">
<link rel="alternate" type="application/rss+xml" title="Atualizações do Arquivo Sombrio" href="https://arquivosombrio.net.br/rss.xml">
<meta property="og:type" content="article">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="Arquivo Sombrio">
<meta property="og:title" content="{e(headline)}">
<meta property="og:description" content="{e(description)}">
<meta property="og:url" content="{e(canonical)}">
<meta property="og:image" content="{e(cover)}">
<meta property="og:image:alt" content="{e(title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="{e(cover)}">
<meta name="twitter:image:alt" content="{e(title)}">
<script type="application/ld+json">{json_ld}</script>
<style>{style}</style>
</head><body>
<header><nav aria-label="Navegação do acervo">
<a href="/index.html">Início</a><a href="/pesquisa.html">Pesquisar</a>
<a href="/{e(page)}">{e(label)}</a><a href="/atualizacoes.html">Atualizações</a></nav></header>
<main id="conteudo-principal">
<small>ARQUIVO SOMBRIO / {e(label.upper())}</small>
<h1>{e(title)}</h1>
<p class="article-summary">{e(description)}</p>
<p><a class="article-original-link" href="{e(original)}">Abrir leitura interativa completa e anexos →</a></p>
{image_figure}
<article aria-label="Texto público do arquivo">{article_body}</article>
{references}
{related_links}
{cross_links}
<p><a href="{e(original)}">Consultar versão interativa, evidências e referências →</a></p>
</main><footer><a href="/pesquisa.html">Pesquisar outros arquivos</a></footer>
</body></html>
"""
    return html.encode("utf-8")

def ordered_public_rows(table, rows):
    """Stable editorial order: recent first, then unique numeric ID."""
    def key(row):
        raw = row.get("publicado_em") or row.get("created_at") or ""
        return (str(raw), int(safe_id(row["id"])))
    return sorted(rows, key=key, reverse=True)

def other_readings(rows, current):
    """Only the same public collection, without inventing case relationships."""
    current_id = safe_id(current["id"])
    ordered = ordered_public_rows(None, rows)
    pos = next(i for i, item in enumerate(ordered) if safe_id(item["id"]) == current_id)
    candidates = [ordered[i] for i in (pos - 1, pos + 1) if 0 <= i < len(ordered)]
    # A third, recent record strengthens discovery without duplicating neighbors.
    for item in ordered:
        if len(candidates) >= 3:
            break
        if safe_id(item["id"]) not in {current_id, *(safe_id(x["id"]) for x in candidates)}:
            candidates.append(item)
    return candidates

def index_links(datasets):
    """Crawlable public archive index inserted into the existing search page."""
    e = lambda value: escape(str(value or ""), quote=True)
    sections = []
    for table, (page, label, field, image) in PUBLIC_TABLES.items():
        entries = []
        for row in ordered_public_rows(table, datasets[table]):
            if row.get("status_publicacao") != "publicado":
                raise ValueError("Rascunho no índice público")
            url = sitemap.BASE + canonical_path(page, row["id"])
            title = plain_text(row.get("titulo"), 160)
            if not title:
                raise ValueError("Título vazio no índice")
            entries.append(f'<li><a href="{e(url)}">{e(title)}</a></li>')
        if entries:
            sections.append(f'<details class="as-static-index-group"><summary>{e(label)} ({len(entries)})</summary>'
                            '<ul>' + "".join(entries) + '</ul></details>')
    return ('<section id="indice-publicado" class="as-static-index" aria-labelledby="indice-publicado-titulo">'
            '<h2 id="indice-publicado-titulo">Índice dos arquivos publicados</h2>'
            '<p>Explore os títulos por editoria ou utilize a pesquisa acima.</p>'
            + "".join(sections) + '</section>')

def insert_index_into_search(html, datasets):
    marker = '</main>'
    if html.count(marker) != 1:
        raise ValueError("Página de pesquisa com estrutura inesperada")
    if 'id="indice-publicado"' in html:
        raise ValueError("Índice já inserido")
    stylesheet = """<style>
.as-static-index{margin:48px 0;padding:28px 0;border-top:1px solid #a28758}
.as-static-index h2{font-family:Georgia,serif}
.as-static-index-group{border:1px solid rgba(162,135,88,.4);margin:10px 0;background:#201917}
.as-static-index-group summary{cursor:pointer;padding:14px 18px;min-height:44px;font:500 .88rem "DM Mono",monospace}
.as-static-index-group ul{padding:0 22px 18px 42px;columns:2}
.as-static-index-group li{break-inside:avoid;padding:5px 0}
.as-static-index-group a{color:#e7dcc6;text-decoration:underline;text-underline-offset:3px}
.as-static-index-group a:focus-visible{outline:2px solid #e7dcc6}
@media(max-width:620px){.as-static-index-group ul{columns:1}}
</style>"""
    if html.count('</head>') != 1:
        raise ValueError("Cabeçalho da pesquisa inesperado")
    return html.replace('</head>', stylesheet + '</head>').replace(marker, index_links(datasets) + marker)

def cross_editorial_readings(current_table, current_id, datasets):
    """Rotate two other published editorias; not a related-case algorithm."""
    tables = list(PUBLIC_TABLES)
    position = tables.index(current_table)
    # Rotate across records so the same cross-category document is not linked everywhere.
    selection = []
    for offset in (1, 2):
        other = tables[(position + offset) % len(tables)]
        candidates = ordered_public_rows(other, datasets[other])
        if candidates:
            index = int(safe_id(current_id)) % len(candidates)
            selection.append((other, candidates[index]))
    return selection

def build_all(site: Path, datasets):
    if set(datasets) != set(PUBLIC_TABLES):
        raise ValueError("Todas as cinco editorias são obrigatórias")
    output = {}
    for table, rows in datasets.items():
        ordered = ordered_public_rows(table, rows)
        for row in ordered:
            if row.get("status_publicacao") != "publicado":
                raise ValueError("Registro não publicado em " + table)
            page = PUBLIC_TABLES[table][0]
            rel = canonical_path(page, row["id"])
            if rel in output:
                raise ValueError("Rota SEO duplicada")
            output[rel] = render_page(table, row, other_readings(ordered, row), cross_editorial_readings(table, row['id'], datasets))
    if not output:
        raise ValueError("Nenhuma publicação pública")
    return output

def main():
    if len(sys.argv) != 2:
        raise SystemExit("Uso: build-seo-pages.py <diretorio-do-artefato>")
    site = Path(sys.argv[1])
    sitemap_file = site / "sitemap.xml"
    base = sitemap_file.read_bytes()
    now = dt.datetime.now(dt.timezone.utc)
    data = {table: public_rows(table, now) for table in PUBLIC_TABLES}
    public_update_rows = updates.public_updates()
    updates_page = site / "atualizacoes.html"
    if not updates_page.is_file() or (site / "rss.xml").exists():
        raise ValueError("Template de atualizações ausente ou RSS duplicado")
    updates_html, rss_xml, updates_count = updates.generate(updates_page, data, public_update_rows, PUBLIC_TABLES, now)
    listing_edits = listings.prepare(site, data)
    pages = build_all(site, data)
    # A mesma fotografia de dados serve ao sitemap e às páginas.
    updated_sitemap = sitemap.build(base, data)
    sitemap_locs = set(x.text for x in __import__("xml.etree.ElementTree", fromlist=["ElementTree"]).fromstring(updated_sitemap).iter(sitemap.tag("loc")))
    for rel in pages:
        if sitemap.BASE + rel not in sitemap_locs:
            raise ValueError("Página SEO sem URL no sitemap: " + rel)
    dest = site / "arquivo"
    if dest.exists():
        raise ValueError("Diretório arquivo já existente; evitar sobrescrita")
    dest.mkdir(parents=True)
    for rel, content in pages.items():
        path = site / rel
        path.write_bytes(content)
    search_file = site / "pesquisa.html"
    if not search_file.is_file():
        raise ValueError("Página de pesquisa ausente do deploy")
    updated_search = insert_index_into_search(search_file.read_text(encoding="utf-8"), data)
    search_file.write_text(updated_search, encoding="utf-8")
    for filename, html in listing_edits.items():
        (site / filename).write_text(html, encoding="utf-8")
    updates_page.write_bytes(updates_html)
    (site / "rss.xml").write_bytes(rss_xml)
    sitemap_file.write_bytes(updated_sitemap)
    print(f"Pré-renderização: {len(pages)} páginas públicas; {updates_count} entradas na central de atualizações e RSS")

if __name__ == "__main__":
    main()
