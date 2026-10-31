#!/usr/bin/env python3
"""Build crawlable, public-only novel landing pages inside a prepared Pages artifact."""
from __future__ import annotations
from html import escape
from pathlib import Path
from urllib.parse import urlencode, quote
from urllib.request import Request, urlopen
import json
import re
import sys
import xml.etree.ElementTree as ET

BASE = "https://arquivosombrio.net.br/"
API = "https://iuhotznurbyujzbyhizf.supabase.co/rest/v1/"
KEY = "sb_publishable_bpAZ5EhYLIuVoE4Q97s_-A_XQwwRxUj"
NS = "http://www.sitemaps.org/schemas/sitemap/0.9"
MAX_ROWS = 500

def query(table, fields, filters):
    args = {"select":fields, "limit":str(MAX_ROWS), **filters}
    req=Request(API+table+"?"+urlencode(args),headers={"apikey":KEY,"Authorization":"Bearer "+KEY,"Accept":"application/json"})
    with urlopen(req,timeout=30) as response:
        if response.status != 200: raise RuntimeError("Consulta pública falhou: "+table)
        rows=json.load(response)
    if not isinstance(rows,list) or len(rows)>=MAX_ROWS: raise RuntimeError("Consulta ausente ou truncada: "+table)
    return rows

def clean(value,limit=10000):
    return re.sub(r"\s+"," ",re.sub(r"<[^>]*>"," ",str(value or ""))).strip()[:limit]

def valid_slug(value):
    if not isinstance(value,str) or not re.fullmatch(r"[a-zA-Z0-9_-]{1,120}",value):
        raise ValueError("Slug inválido")
    return value

def public_books():
    return query("novels","id,slug,titulo,autor_nome,sinopse,status_publicacao",
                 {"status_publicacao":"eq.publicado","order":"slug.asc"})

def public_chapters(book_ids):
    if not book_ids:return []
    # Only published chapters from published books, never query drafts or unpublished content.
    return query("novel_capitulos","novel_id,numero,titulo,status_publicacao",
                 {"status_publicacao":"eq.publicado","novel_id":"in.("+",".join(str(x) for x in book_ids)+")","order":"numero.asc"})

def render(book,chapters):
    slug=valid_slug(book["slug"])
    title=clean(book["titulo"],160)
    if not title:raise ValueError("Livro sem título")
    desc=clean(book.get("sinopse") or "Leia "+title+" na Biblioteca de Novels do Arquivo Sombrio.",160)
    author=clean(book.get("autor_nome"),180)
    url=BASE+"novels/"+slug+".html"
    original=BASE+"novel.html?obra="+quote(slug)
    e=lambda x:escape(str(x or ""),quote=True)
    chapter_links="".join('<li><a href="'+e(original+"&capitulo="+str(c["numero"]))+'">Capítulo '+e(c["numero"])+' · '+e(clean(c.get("titulo"),180))+'</a></li>' for c in chapters)
    schema={"@context":"https://schema.org","@type":"Book","name":title,"description":desc,"inLanguage":"pt-BR","url":url}
    if author:schema["author"]={"@type":"Person","name":author}
    ld=json.dumps(schema,ensure_ascii=False).replace("<","\u003c")
    return ('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            '<title>'+e(title)+' — Biblioteca de Novels | Arquivo Sombrio</title><meta name="description" content="'+e(desc)+'">'
            '<link rel="canonical" href="'+e(url)+'"><meta property="og:type" content="book">'
            '<meta property="og:title" content="'+e(title)+'"><meta property="og:description" content="'+e(desc)+'">'
            '<meta property="og:url" content="'+e(url)+'"><script type="application/ld+json">'+ld+'</script>'
            '<style>body{background:#0b0d10;color:#e9dcc4;font:18px/1.65 Georgia,serif;margin:auto;padding:32px 20px;max-width:780px}a{color:#e0b779}h1{line-height:1.15}li{margin:10px 0}</style></head><body>'
            '<nav><a href="'+BASE+'novels.html">Biblioteca de Novels</a></nav><main><h1>'+e(title)+'</h1>'
            +('<p>Por '+e(author)+'</p>' if author else '')+'<p>'+e(clean(book.get("sinopse"),7000))+'</p>'
            '<p><a href="'+e(original)+'">Abrir obra no leitor interativo</a></p>'
            +('<section><h2>Capítulos disponíveis</h2><ol>'+chapter_links+'</ol></section>' if chapters else '')
            +'</main></body></html>').encode("utf-8")

def build(site,books,chapters):
    sitemap_file=site/"sitemap.xml"
    root=ET.fromstring(sitemap_file.read_bytes())
    tag=lambda name:"{"+NS+"}"+name
    if root.tag!=tag("urlset"):raise ValueError("Sitemap inválido")
    existing={e.text for e in root.iter(tag("loc"))}
    output={}
    grouping={}
    allowed={str(book["id"]) for book in books if book.get("status_publicacao")=="publicado"}
    for chapter in chapters:
        if chapter.get("status_publicacao")!="publicado" or str(chapter.get("novel_id")) not in allowed:
            raise ValueError("Capítulo não público recebido")
        grouping.setdefault(str(chapter["novel_id"]),[]).append(chapter)
    for book in books:
        if book.get("status_publicacao")!="publicado":raise ValueError("Obra não publicada")
        slug=valid_slug(book["slug"])
        rel="novels/"+slug+".html"
        url=BASE+rel
        if url in existing or rel in output:raise ValueError("URL duplicada: "+url)
        page=render(book,grouping.get(str(book["id"]),[]))
        output[rel]=page
        node=ET.SubElement(root,tag("url"))
        ET.SubElement(node,tag("loc")).text=url
        modified=str(book.get("updated_at") or book.get("publicado_em") or "")
        if re.match(r"^\d{4}-\d{2}-\d{2}",modified):
            ET.SubElement(node,tag("lastmod")).text=modified[:10]
    if not output:return 0
    dest=site/"novels"
    if dest.exists():raise ValueError("Pasta novels já existe no artefato")
    dest.mkdir()
    for rel,html in output.items(): (site/rel).write_bytes(html)
    sitemap_file.write_bytes(b'<?xml version="1.0" encoding="UTF-8"?>\n'+ET.tostring(root,encoding="utf-8")+b"\n")
    return len(output)

if __name__=="__main__":
    if len(sys.argv)!=2:raise SystemExit("Uso: build-novels-seo.py <site>")
    books=public_books()
    chapters=public_chapters([book["id"] for book in books])
    print("SEO novels: %d obras públicas geradas" % build(Path(sys.argv[1]),books,chapters))
