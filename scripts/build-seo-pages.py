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

def public_rows(table):
    page, label, narrative, image = PUBLIC_TABLES[table]
    fields = ["id", "titulo", "resumo", "categoria", "status_publicacao",
              "created_at", "updated_at", narrative]
    if table != "Casos":
        fields.append("publicado_em")
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
    return rows

def plain_text(value, limit=100000):
    value = str(value or "")
    value = re.sub(r"<[^>]*>", " ", value)
    value = re.sub(r"(?m)^#{1,6}\s*", "", value)
    value = re.sub(r"\s+", " ", value).strip()
    return value[:limit]

def canonical_path(page, ident):
    return "arquivo/" + page.removesuffix(".html") + "-" + safe_id(ident) + ".html"

def render_page(table, row):
    page, label, field, _image_field = PUBLIC_TABLES[table]
    ident = safe_id(row["id"])
    title = plain_text(row["titulo"], 170)
    description = plain_text(row.get("resumo") or row.get(field) or title, 160)
    narrative = plain_text(row.get(field), 100000)
    if not narrative:
        narrative = plain_text(row.get("resumo"), 100000)
    path = canonical_path(page, ident)
    canonical = sitemap.BASE + path
    original = sitemap.BASE + page + "?id=" + ident
    headline = title + " — Arquivo Sombrio"
    published = row.get("publicado_em") or row.get("created_at")
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
        "inLanguage": "pt-BR"
    }
    for key, date in (("datePublished", published), ("dateModified", modified)):
        if date:
            schema[key] = str(date)
    json_ld = json.dumps(schema, ensure_ascii=False).replace("<", "\\u003c")
    e = lambda value: escape(str(value or ""), quote=True)
    chunks = [narrative[i:i+1900] for i in range(0, len(narrative), 1900)] or [description]
    paragraphs = "\n".join("<p>" + e(part) + "</p>" for part in chunks)
    return ("""<!doctype html>
<html lang="pt-BR"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>""" + e(headline) + """</title>
<meta name="description" content="""" + e(description) + """">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="""" + e(canonical) + """">
<meta property="og:type" content="article">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="Arquivo Sombrio">
<meta property="og:title" content="""" + e(headline) + """">
<meta property="og:description" content="""" + e(description) + """">
<meta property="og:url" content="""" + e(canonical) + """">
<meta name="twitter:card" content="summary">
<script type="application/ld+json">""" + json_ld + """</script>
<style>
body{margin:0;background:#12100f;color:#e7dcc6;font:17px/1.8 Georgia,serif}
main,header,footer{max-width:800px;margin:auto;padding:24px}
header{border-bottom:1px solid #a28758}h1{font:700 clamp(2rem,5vw,3rem)/1.2 Georgia,serif}
a{color:#d9b77d}nav a{margin-right:18px}
small{color:#bca882;letter-spacing:.08em}article{overflow-wrap:anywhere}
article p{margin:0 0 1.35em}a:focus-visible{outline:2px solid #e7dcc6;outline-offset:3px}
</style>
</head><body>
<header><nav aria-label="Navegação do acervo">
<a href="/index.html">Início</a><a href="/pesquisa.html">Pesquisar</a>
<a href="/""" + e(page) + """">""" + e(label) + """</a></nav></header>
<main id="conteudo-principal">
<small>ARQUIVO SOMBRIO / """ + e(label.upper()) + """</small>
<h1>""" + e(title) + """</h1>
<p>""" + e(description) + """</p>
<p><a href="""" + e(original) + """">Abrir leitura interativa completa e anexos →</a></p>
<article aria-label="Texto público do arquivo">""" + paragraphs + """</article>
<p><a href="""" + e(original) + """">Consultar versão interativa, evidências e referências →</a></p>
</main><footer><a href="/pesquisa.html">Pesquisar outros arquivos</a></footer>
</body></html>
""").encode("utf-8")

def build_all(site: Path, datasets):
    if set(datasets) != set(PUBLIC_TABLES):
        raise ValueError("Todas as cinco editorias são obrigatórias")
    output = {}
    for table, rows in datasets.items():
        for row in rows:
            page = PUBLIC_TABLES[table][0]
            rel = canonical_path(page, row["id"])
            if rel in output:
                raise ValueError("Rota SEO duplicada")
            output[rel] = render_page(table, row)
    if not output:
        raise ValueError("Nenhuma publicação pública")
    return output

def main():
    if len(sys.argv) != 2:
        raise SystemExit("Uso: build-seo-pages.py <diretorio-do-artefato>")
    site = Path(sys.argv[1])
    sitemap_file = site / "sitemap.xml"
    base = sitemap_file.read_bytes()
    data = {table: public_rows(table) for table in PUBLIC_TABLES}
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
    sitemap_file.write_bytes(updated_sitemap)
    print(f"Pré-renderização: {len(pages)} páginas públicas com canonical e Article JSON-LD")

if __name__ == "__main__":
    main()
