#!/usr/bin/env python3
"""Atualiza o sitemap no artefato do Pages usando somente registros públicos.

Não modifica sitemap.xml versionado nem consulta rascunhos. Falha o build
se não for possível confirmar todas as editorias, evitando deploy parcial.
"""
from __future__ import annotations

import datetime as dt
import json
import os
from pathlib import Path
import re
import sys
from urllib.parse import urlencode
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

BASE = "https://arquivosombrio.net.br/"
API = "https://iuhotznurbyujzbyhizf.supabase.co/rest/v1/"
# Chave publishable anon já exposta ao navegador público; não é service_role.
PUBLIC_KEY = "sb_publishable_bpAZ5EhYLIuVoE4Q97s_-A_XQwwRxUj"
NS = "http://www.sitemaps.org/schemas/sitemap/0.9"
ET.register_namespace("", NS)
SOURCES = {
    "Casos": "caso.html",
    "casos_diarios": "garimpo.html",
    "pericias": "pericia.html",
    "lendas": "lendas.html",
    "creepypastas": "creepypastas.html",
}
MAX_PER_TABLE = 1000
def tag(name: str) -> str:
    return f"{{{NS}}}{name}"

def get_public_rows(table: str) -> list[dict]:
    query = urlencode({
        "select": "id,status_publicacao,created_at,updated_at" + (",publicado_em" if table != "Casos" else ""),
        "status_publicacao": "eq.publicado",
        "order": "id.asc",
        "limit": str(MAX_PER_TABLE),
    })
    request = Request(
        API + table + "?" + query,
        headers={
            "apikey": PUBLIC_KEY,
            "Authorization": "Bearer " + PUBLIC_KEY,
            "Accept": "application/json",
        },
    )
    with urlopen(request, timeout=25) as response:
        if response.status != 200:
            raise RuntimeError(f"Consulta de {table} respondeu {response.status}")
        payload = json.load(response)
    if not isinstance(payload, list):
        raise ValueError(f"Formato de consulta inválido: {table}")
    if len(payload) >= MAX_PER_TABLE:
        raise RuntimeError(f"Consulta de {table} atingiu o limite; paginação necessária")
    for row in payload:
        if not isinstance(row, dict) or row.get("status_publicacao") != "publicado":
            raise ValueError(f"Consulta de {table} retornou item não publicado")
    return payload

def lastmod(row: dict) -> str:
    raw = row.get("updated_at") or row.get("publicado_em") or row.get("created_at")
    if not isinstance(raw, str) or not re.match(r"^\d{4}-\d{2}-\d{2}", raw):
        raise ValueError("Registro publicado sem data válida")
    day = raw[:10]
    dt.date.fromisoformat(day)
    return day

def build(original_xml: bytes, datasets: dict[str, list[dict]]) -> bytes:
    root = ET.fromstring(original_xml)
    if root.tag != tag("urlset"):
        raise ValueError("Sitemap base inválido")
    # Preserva links estáticos e seus metadados editoriais originais.
    static_entries = []
    seen = set()
    for node in root.findall(tag("url")):
        loc = node.findtext(tag("loc"), "").strip()
        if not loc.startswith(BASE):
            raise ValueError("Endereço externo no sitemap")
        if "?id=" in loc:
            continue
        if loc in seen:
            raise ValueError("URL estática duplicada")
        seen.add(loc)
        static_entries.append(node)
    if BASE + "pesquisa.html" not in seen:
        raise ValueError("Página de pesquisa ausente do sitemap base")
    result = ET.Element(tag("urlset"))
    for node in static_entries:
        result.append(node)
    total = 0
    for table, page in SOURCES.items():
        if table not in datasets:
            raise ValueError("Editoria ausente: " + table)
        for row in datasets[table]:
            if row.get("status_publicacao") != "publicado":
                raise ValueError("Publicação não confirmada: " + table)
            ident = str(row.get("id", ""))
            if not ident.isascii() or not ident.isdecimal():
                raise ValueError("ID inválido: " + table)
            loc = f"{BASE}{page}?id={ident}"
            if loc in seen:
                raise ValueError("URL dinâmica duplicada")
            seen.add(loc)
            node = ET.SubElement(result, tag("url"))
            ET.SubElement(node, tag("loc")).text = loc
            ET.SubElement(node, tag("lastmod")).text = lastmod(row)
            total += 1
    if not total:
        raise RuntimeError("Nenhuma publicação pública encontrada; deploy interrompido")
    print(f"Sitemap: {len(static_entries)} URLs estáticas, {total} publicações, {len(seen)} URLs no total")
    return b'<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(result, encoding="utf-8") + b"\n"

def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Uso: build-public-sitemap.py <diretorio-do-deploy>")
    dest = Path(sys.argv[1]) / "sitemap.xml"
    if not dest.is_file():
        raise SystemExit("Sitemap base não encontrado")
    datasets = {table: get_public_rows(table) for table in SOURCES}
    # Escreve somente após TODAS as cinco consultas terem sido confirmadas.
    output = build(dest.read_bytes(), datasets)
    temporary = dest.with_suffix(".xml.tmp")
    temporary.write_bytes(output)
    os.replace(temporary, dest)

if __name__ == "__main__":
    main()
