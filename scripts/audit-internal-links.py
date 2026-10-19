#!/usr/bin/env python3
"""Audit crawlable archive links in the exact GitHub Pages build artifact.

No network calls, no writes except the optional report. A public HTML page
without an incoming link from the search index is an orphan for this audit.
"""
from __future__ import annotations
import argparse
from collections import Counter, defaultdict
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import urljoin, urlparse, unquote
import xml.etree.ElementTree as ET

BASE = "https://arquivosombrio.net.br/"
NS = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
PATTERN = re.compile(r"arquivo/(caso|garimpo|pericia|lendas|creepypastas)-(\d+)\.html\Z")

class Links(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.hrefs = []
        self.sections = 0
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "a" and a.get("href"):
            self.hrefs.append(a["href"])
        if tag == "section" and a.get("id") == "indice-publicado":
            self.sections += 1

def read_links(path: Path) -> Links:
    doc = Links()
    doc.feed(path.read_text(encoding="utf-8"))
    return doc

def archive_target(href: str, source: str) -> str | None:
    absolute = urljoin(source, href)
    url = urlparse(absolute)
    if url.netloc != "arquivosombrio.net.br" or url.scheme != "https":
        return None
    path = unquote(url.path.lstrip("/"))
    if not path.startswith("arquivo/"):
        return None
    # Fragments and tracking parameters must not fragment the canonical graph.
    return BASE + path

def audit(site: Path) -> dict:
    search = site / "pesquisa.html"
    sitemap = site / "sitemap.xml"
    if not search.is_file() or not sitemap.is_file():
        raise ValueError("Template de pesquisa ou sitemap ausente do build")
    errors = []
    urls = [el.text or "" for el in ET.parse(sitemap).findall("s:url/s:loc", NS)]
    indexed = {url for url in urls if url.startswith(BASE + "arquivo/")}
    files = sorted((site / "arquivo").glob("*.html"))
    canonical = {BASE + file.relative_to(site).as_posix(): file for file in files}
    if not canonical:
        errors.append("Nenhuma página canônica no build")
    index_doc = read_links(search)
    if index_doc.sections != 1:
        errors.append("Índice HTML da pesquisa ausente ou duplicado")
    index_counts = Counter()
    outgoing = {}
    incoming = defaultdict(set)
    invalid = []
    for page_url, file in [(BASE + "pesquisa.html", search), *canonical.items()]:
        doc = index_doc if file == search else read_links(file)
        target_set = set()
        for href in doc.hrefs:
            target = archive_target(href, page_url)
            if target is None:
                continue
            target_set.add(target)
            if target not in canonical or target not in indexed:
                invalid.append({"source": page_url, "target": target})
                errors.append("Link para arquivo inexistente ou não listado: " + page_url + " -> " + target)
                continue
            incoming[target].add(page_url)
            if file == search:
                index_counts[target] += 1
        outgoing[page_url] = sorted(target_set)
    missing_in_index = sorted(set(canonical) - set(index_counts))
    duplicated_in_index = sorted(url for url, n in index_counts.items() if n != 1)
    orphans = sorted(url for url in canonical if not incoming[url])
    for url in missing_in_index:
        errors.append("Página sem link no índice público: " + url)
    for url in duplicated_in_index:
        errors.append("Link repetido no índice público: " + url)
    for url in orphans:
        errors.append("Página órfã: " + url)
    crosslinks = sum(len(outgoing[url]) for url in canonical)
    return {
        "canonical_pages": len(canonical),
        "sitemap_archive_urls": len(indexed),
        "index_links": sum(index_counts.values()),
        "crosslinks": crosslinks,
        "orphan_pages": orphans,
        "missing_from_index": missing_in_index,
        "duplicate_index_links": duplicated_in_index,
        "invalid_archive_links": invalid,
        "errors": errors,
    }

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
