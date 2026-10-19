#!/usr/bin/env python3
"""Static mobile/SEO/performance-readiness audit of a prepared Pages artifact.

This measures delivered byte sizes and checks HTML semantics. It does not
measure Core Web Vitals, Lighthouse, layout shifts or actual mobile rendering.
"""
from __future__ import annotations
import argparse
from html.parser import HTMLParser
from pathlib import Path
import json
import re
import xml.etree.ElementTree as ET

BASE = "https://arquivosombrio.net.br/"
MAIN_ROUTES = (
    "index.html", "dossies.html", "pesquisa.html", "garimpo.html",
    "pericia.html", "lendas.html", "creepypastas.html",
)
NS = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}

class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title = []
        self._title = False
        self.metas = {}
        self.canonicals = []
        self.headings = 0
        self.landmarks = 0
        self.images = 0
        self.images_without_alt = 0
        self.stylesheets = 0
        self.scripts = 0
        self.lang = ""
    def handle_starttag(self, tag, pairs):
        attrs = dict(pairs)
        if tag == "html":
            self.lang = attrs.get("lang", "")
        elif tag == "title":
            self._title = True
        elif tag == "h1":
            self.headings += 1
        elif tag == "main":
            self.landmarks += 1
        elif tag == "img":
            self.images += 1
            if "alt" not in attrs:
                self.images_without_alt += 1
        elif tag == "script":
            if attrs.get("src"): self.scripts += 1
        elif tag == "link":
            if "canonical" in (attrs.get("rel") or "").split():
                self.canonicals.append(attrs.get("href", ""))
            if "stylesheet" in (attrs.get("rel") or "").split():
                self.stylesheets += 1
        elif tag == "meta":
            key = attrs.get("name") or attrs.get("property")
            if key: self.metas.setdefault(key.lower(), []).append(attrs.get("content", ""))
    def handle_endtag(self, tag):
        if tag == "title": self._title = False
    def handle_data(self, data):
        if self._title: self.title.append(data)

def check(site: Path) -> dict:
    if not (site / "sitemap.xml").exists():
        raise ValueError("sitemap.xml não encontrado no artefato")
    sitemap = {
        x.text for x in ET.parse(site / "sitemap.xml").findall("s:url/s:loc", NS)
    }
    targets = list(MAIN_ROUTES) + sorted(
        p.relative_to(site).as_posix() for p in (site / "arquivo").glob("*.html")
    )
    errors, warnings, pages = [], [], []
    if not any(p.startswith("arquivo/") for p in targets):
        errors.append("Nenhum artigo canônico no artefato")
    for rel in targets:
        file = site / rel
        if not file.is_file():
            errors.append(f"Página ausente: {rel}")
            continue
        p = Page()
        try:
            p.feed(file.read_text(encoding="utf-8-sig"))
        except (UnicodeError, ValueError) as exc:
            errors.append(f"HTML ilegível {rel}: {exc}")
            continue
        own_url = BASE if rel == "index.html" else BASE + rel
        if own_url not in sitemap:
            errors.append(f"Página principal não listada no sitemap: {rel}")
        if p.canonicals != [own_url]:
            errors.append(f"Canonical inválida ou duplicada: {rel}")
        if len(p.metas.get("viewport", [])) != 1 or "width=device-width" not in p.metas["viewport"][0]:
            errors.append(f"Viewport móvel ausente/incorreto: {rel}")
        if not p.lang.startswith("pt"):
            warnings.append(f"Idioma não identificado como português: {rel}")
        if not "".join(p.title).strip():
            errors.append(f"Title vazio: {rel}")
        if not p.headings:
            warnings.append(f"Sem heading H1 estático: {rel}")
        if not p.landmarks:
            warnings.append(f"Sem landmark main: {rel}")
        if p.images_without_alt:
            warnings.append(f"{p.images_without_alt} imagens sem alt: {rel}")
        size = file.stat().st_size
        if size > 250_000:
            warnings.append(f"HTML grande ({size} bytes): {rel}")
        pages.append({"path": rel, "html_bytes": size, "h1": p.headings,
                      "main": p.landmarks, "images": p.images,
                      "missing_alt": p.images_without_alt,
                      "external_script_tags": p.scripts,
                      "stylesheet_tags": p.stylesheets})
    return {
        "pages_checked": len(pages),
        "canonical_articles_checked": sum(p["path"].startswith("arquivo/") for p in pages),
        "main_routes_checked": sum(p["path"] in MAIN_ROUTES for p in pages),
        "largest_html": sorted(
            [{"path": p["path"], "bytes": p["html_bytes"]} for p in pages],
            key=lambda x: -x["bytes"]
        )[:10],
        "total_html_bytes": sum(p["html_bytes"] for p in pages),
        "warnings": warnings,
        "errors": errors,
        "scope": "Static artifact only; no actual mobile rendering or Core Web Vitals",
    }

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("site", type=Path)
    ap.add_argument("--report", type=Path)
    args = ap.parse_args()
    results = check(args.site)
    print(json.dumps(results, ensure_ascii=False, indent=2))
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if results["errors"]:
        raise SystemExit(1)

if __name__ == "__main__":
    main()
