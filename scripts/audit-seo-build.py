#!/usr/bin/env python3
"""Audit SEO pages and sitemap in a built GitHub Pages artifact.

This checks technical eligibility, NOT Google's indexing decisions.
Exits nonzero on inconsistent canonicals, missing metadata or unlisted pages.
"""
from __future__ import annotations
import argparse
from collections import Counter
from html.parser import HTMLParser
import json
from pathlib import Path
from urllib.parse import urlparse, parse_qs
import xml.etree.ElementTree as ET

BASE = "https://arquivosombrio.net.br/"
SITEMAP_NS = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
EDITORIAS = {"caso", "garimpo", "pericia", "lendas", "creepypastas"}

class ArticleParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title = ""
        self.in_title = False
        self.canonical = []
        self.metas = {}
        self.links = []
        self.schemas = []
        self.in_schema = False
        self.schema_buffer = ""
        self.headings = []
        self.in_h1 = False

    def handle_starttag(self, name, attrs):
        attrs = dict(attrs)
        if name == "title": self.in_title = True
        if name == "h1": self.in_h1 = True
        if name == "link" and attrs.get("rel") == "canonical":
            self.canonical.append(attrs.get("href", ""))
        if name == "meta":
            key = attrs.get("name") or attrs.get("property")
            if key: self.metas.setdefault(key, []).append(attrs.get("content", ""))
        if name == "a": self.links.append(attrs.get("href", ""))
        if name == "script" and attrs.get("type") == "application/ld+json":
            self.in_schema = True
            self.schema_buffer = ""

    def handle_data(self, data):
        if self.in_title: self.title += data
        if self.in_h1: self.headings.append(data)
        if self.in_schema: self.schema_buffer += data

    def handle_endtag(self, name):
        if name == "title": self.in_title = False
        if name == "h1": self.in_h1 = False
        if name == "script" and self.in_schema:
            self.schemas.append(json.loads(self.schema_buffer))
            self.in_schema = False

def audit(site: Path) -> dict:
    errors = []
    xml = site / "sitemap.xml"
    if not xml.is_file():
        raise ValueError("sitemap.xml ausente do artefato")
    doc = ET.parse(xml)
    urls = [el.text or "" for el in doc.findall("s:url/s:loc", SITEMAP_NS)]
    counts = Counter(urls)
    errors.extend(f"URL duplicada no sitemap: {url}" for url, count in counts.items() if count > 1)
    pages = sorted((site / "arquivo").glob("*.html"))
    if not pages:
        errors.append("Nenhuma página SEO em /arquivo/")
    expected = set()
    categories = Counter()
    for file in pages:
        rel = file.relative_to(site).as_posix()
        url = BASE + rel
        expected.add(url)
        match = __import__("re").fullmatch(r"(caso|garimpo|pericia|lendas|creepypastas)-(\d+)\.html", file.name)
        if not match:
            errors.append(f"Rota inesperada: {rel}")
            continue
        category, ident = match.groups()
        categories[category] += 1
        parser = ArticleParser()
        try: parser.feed(file.read_text(encoding="utf-8"))
        except (ValueError, json.JSONDecodeError, UnicodeError) as err:
            errors.append(f"HTML/JSON-LD inválido em {rel}: {err}")
            continue
        if url not in counts: errors.append(f"URL sem entrada no sitemap: {rel}")
        if parser.canonical != [url]: errors.append(f"Canonical incorreto ou duplicado: {rel}")
        if not parser.title.strip(): errors.append(f"Title vazio: {rel}")
        if not "".join(parser.headings).strip(): errors.append(f"H1 vazio: {rel}")
        for key in ("description", "og:title", "og:description", "og:url"):
            if len(parser.metas.get(key, [])) != 1 or not parser.metas[key][0].strip():
                errors.append(f"Meta {key} ausente ou duplicada: {rel}")
        if parser.metas.get("og:url") != [url]:
            errors.append(f"Open Graph URL divergente: {rel}")
        for name in ("og:image", "twitter:image"):
            values = parser.metas.get(name, [])
            if len(values) != 1 or urlparse(values[0]).scheme not in ("http", "https") or not urlparse(values[0]).netloc:
                errors.append(f"Imagem social {name} ausente ou inválida: {rel}")
        if parser.metas.get("twitter:card") != ["summary_large_image"]:
            errors.append(f"Twitter Card inconsistente: {rel}")
        robots = parser.metas.get("robots", [""])[0].lower()
        if "noindex" in robots: errors.append(f"Arquivo publicado com noindex: {rel}")
        if len(parser.schemas) != 1:
            errors.append(f"Article JSON-LD ausente ou duplicado: {rel}")
        else:
            schema = parser.schemas[0]
            if schema.get("@type") != "Article" or schema.get("mainEntityOfPage") != url:
                errors.append(f"JSON-LD divergente: {rel}")
        original = f"/{category}.html?id={ident}"
        matching = [link for link in parser.links if link == BASE[0:len(BASE)-1] + original or link == original or link == BASE + original.lstrip("/")]
        if not matching:
            errors.append(f"Link ao leitor interativo ausente: {rel}")
    listed = {url for url in counts if url.startswith(BASE + "arquivo/")}
    errors.extend(f"Entrada no sitemap sem arquivo: {url}" for url in sorted(listed - expected))
    errors.extend(f"Arquivo não listado: {url}" for url in sorted(expected - listed))
    return {"pages": len(pages), "sitemap": len(urls), "by_category": dict(categories), "errors": errors}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("site", type=Path)
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()
    result = audit(args.site)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if result["errors"]:
        raise SystemExit(1)

if __name__ == "__main__":
    main()
