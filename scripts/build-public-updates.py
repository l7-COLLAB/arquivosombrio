#!/usr/bin/env python3
"""Build public updates and RSS from the same published snapshot as canonical articles."""
from __future__ import annotations
from datetime import date, datetime, timezone
from email.utils import format_datetime
from html import escape, unescape
from pathlib import Path
import json
import re
from urllib.parse import urlencode
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET
from zoneinfo import ZoneInfo

BASE = "https://arquivosombrio.net.br/"
API = "https://iuhotznurbyujzbyhizf.supabase.co/rest/v1/"
PUBLIC_KEY = "sb_publishable_bpAZ5EhYLIuVoE4Q97s_-A_XQwwRxUj"
RSS_URL, HUB_URL = BASE+"rss.xml", BASE+"atualizacoes.html"
START, END = "<!-- ARQUIVO_PUBLIC_UPDATES_START -->", "<!-- ARQUIVO_PUBLIC_UPDATES_END -->"
MAX_UPDATES, FEED_LIMIT, PAGE_LIMIT = 1000, 60, 150
BRAZIL = ZoneInfo("America/Sao_Paulo")
KINDS = {
    "fato_confirmado": "Atualização documental",
    "testemunho": "Testemunho registrado",
    "hipotese": "Hipótese identificada",
    "controversia": "Controvérsia documentada",
    "nao_confirmado": "Informação não confirmada",
    "correcao": "Correção editorial",
}

def parse_timestamp(raw):
    if not isinstance(raw, str) or not raw.strip():
        raise ValueError("Timestamp editorial ausente")
    stamp = datetime.fromisoformat(raw.replace("Z", "+00:00"))
    if stamp.tzinfo is None:
        raise ValueError("Timestamp editorial sem fuso")
    return stamp.astimezone(timezone.utc)

def public_updates():
    """Anonymous REST read; on failure abort build rather than publish stale partial data."""
    q = urlencode({
        "select": "id,dossier_id,daily_id,update_date,title,body,information_type,created_at,updated_at,deleted_at",
        "deleted_at": "is.null", "order": "created_at.desc", "limit": str(MAX_UPDATES),
    })
    request = Request(API+"case_updates?"+q, headers={
        "apikey": PUBLIC_KEY, "Authorization": "Bearer "+PUBLIC_KEY, "Accept": "application/json"
    })
    with urlopen(request, timeout=30) as response:
        if response.status != 200:
            raise RuntimeError("Erro na API pública de atualizações")
        rows = json.load(response)
    if not isinstance(rows, list) or len(rows) >= MAX_UPDATES:
        raise ValueError("Atualizações truncadas ou inválidas")
    if any(not isinstance(row, dict) or not row.get("id") for row in rows):
        raise ValueError("Atualização pública inválida")
    return rows

def plain(value, limit=360):
    text = str(value or "").replace("\r", "\n")
    text = re.sub(r"<[^>]*>", " ", text)
    text = unescape(text)
    text = re.sub(r"(?m)^\s*#{1,6}\s*", "", text)
    text = re.sub(r"(?m)^\s*(?:[-*•]\s+|\d{1,3}[.)]\s+)", "", text)
    text = re.sub(r"(?<!\w)[*_]+", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) <= limit:
        return text
    clipped = text[:limit].rsplit(" ", 1)[0] or text[:limit]
    return clipped.rstrip(".,;:") + "…"

def is_garimpo(row):
    # Do not reclassify the independent Especial editorial route as Garimpo.
    value = str(row.get("categoria") or "").strip().casefold()
    return not (value.startswith("especial") or value.startswith("perícia") or value.startswith("pericia"))

def collect(datasets, updates, routes, now=None):
    now = now or datetime.now(timezone.utc)
    if now.tzinfo is None:
        raise ValueError("Relógio sem fuso horário")
    today = now.astimezone(BRAZIL).date()
    catalog, events = {}, []
    for table, (page, section, narrative, _image) in routes.items():
        for row in datasets[table]:
            if row.get("status_publicacao") != "publicado":
                raise ValueError("Rascunho nos dados públicos")
            ident = str(row.get("id") or "")
            if not ident.isascii() or not ident.isdecimal():
                raise ValueError("ID de arquivo inválido")
            raw = (row.get("published_at") if table == "Casos" else row.get("publicado_em")) or row.get("created_at")
            published = parse_timestamp(raw)
            if published > now:
                continue
            catalog[(table, ident)] = row, published
            if table == "casos_diarios" and not is_garimpo(row):
                continue
            url = BASE+"arquivo/"+page.removesuffix(".html")+"-"+ident+".html"
            events.append({
                "id": "publicacao:"+table+":"+ident,
                "anchor": "publicacao-"+page.removesuffix(".html")+"-"+ident,
                "kind": "publicacao", "type": "Nova publicação", "section": section,
                "title": str(row.get("titulo") or "").strip(),
                "description": plain(row.get("resumo") or row.get(narrative) or row.get("titulo")),
                "url": url, "reader": url, "timestamp": published,
                "editorial_date": None, "parent": "",
            })
    seen = set()
    for item in updates:
        if item.get("deleted_at"):
            continue
        uid = str(item.get("id") or "")
        if not re.fullmatch(r"[a-zA-Z0-9_-]{1,90}", uid):
            raise ValueError("ID inválido da atualização")
        if uid in seen:
            raise ValueError("Atualização repetida")
        seen.add(uid)
        dossier_id, daily_id = item.get("dossier_id"), item.get("daily_id")
        if (dossier_id is None) == (daily_id is None):
            raise ValueError("Atualização sem um arquivo associado")
        table = "Casos" if dossier_id is not None else "casos_diarios"
        ident = str(dossier_id if dossier_id is not None else daily_id)
        parent = catalog.get((table, ident))
        if not parent:
            continue  # Parent is draft, absent or embargoed; never expose update.
        row, published = parent
        if table == "casos_diarios" and not is_garimpo(row):
            continue
        nature = str(item.get("information_type") or "")
        if nature not in KINDS:
            raise ValueError("Natureza de informação desconhecida")
        editorial = date.fromisoformat(str(item.get("update_date") or ""))
        if editorial > today:
            continue
        timestamp = max(parse_timestamp(item.get("created_at")), published)
        if timestamp > now:
            continue
        reader = BASE+("caso.html" if table == "Casos" else "garimpo.html")+"?id="+ident+"#atualizacoes-do-caso"
        events.append({
            "id": "atualizacao:"+uid, "anchor": "atualizacao-"+uid,
            "kind": "atualizacao", "type": KINDS[nature],
            "section": "Dossiês" if table == "Casos" else "Garimpo Sombrio",
            "title": str(item.get("title") or "").strip() or "Atualização do arquivo",
            "description": plain(item.get("body"), 380),
            "url": HUB_URL+"#atualizacao-"+uid, "reader": reader,
            "timestamp": timestamp, "editorial_date": editorial,
            "parent": str(row.get("titulo") or ""),
        })
    if not events:
        raise RuntimeError("Nenhuma publicação pública verificada")
    events.sort(key=lambda x:(x["timestamp"], x["id"]), reverse=True)
    return events

def render_hub(template, events):
    if template.count(START) != 1 or template.count(END) != 1:
        raise ValueError("Marcadores de página inválidos")
    cards = []
    for ev in events[:PAGE_LIMIT]:
        e = lambda v: escape(str(v or ""), quote=True)
        stamp = ev["timestamp"]
        date_line = ('<time datetime="'+e(stamp.isoformat())+'">Registrado em '
                     +e(stamp.astimezone(BRAZIL).strftime("%d/%m/%Y"))+'</time>')
        context = '<p class="context">Arquivo relacionado: '+e(ev["parent"])+'</p>' if ev["parent"] else ""
        editorial = ('<p class="context">Data editorial: <time datetime="'
                     +e(ev["editorial_date"].isoformat())+'">'+e(ev["editorial_date"].strftime("%d/%m/%Y"))
                     +'</time></p>') if ev["editorial_date"] else ""
        label = "Abrir caso e atualizações" if ev["kind"] == "atualizacao" else "Ler arquivo completo"
        cards.append('<article class="entry" id="'+e(ev["anchor"])+'">'
            '<div class="meta"><span>'+e(ev["type"])+'</span><span>'+e(ev["section"])
            +'</span>'+date_line+'</div><h2>'+e(ev["title"])+'</h2>'+context+editorial
            +'<p class="summary">'+e(ev["description"])+'</p>'
            +'<a class="read" href="'+e(ev["reader"])+'">'+label+' →</a></article>')
    markup = '<section class="entries" aria-label="Publicações e atualizações recentes">'+''.join(cards)+'</section>'
    a, b = template.index(START), template.index(END)+len(END)
    return (template[:a]+START+'\n'+markup+'\n'+END+template[b:]).encode("utf-8")

def render_rss(events, now=None):
    now = now or datetime.now(timezone.utc)
    ET.register_namespace("atom", "http://www.w3.org/2005/Atom")
    root = ET.Element("rss", version="2.0")
    ch = ET.SubElement(root, "channel")
    for name, value in (
        ("title", "Atualizações do Arquivo Sombrio"),
        ("link", HUB_URL),
        ("description", "Novas publicações, atualizações documentais e correções editoriais do Arquivo Sombrio."),
        ("language", "pt-BR"),
        ("lastBuildDate", format_datetime(now.astimezone(timezone.utc), usegmt=True)),
        ("ttl", "360"),
    ):
        ET.SubElement(ch, name).text = value
    ET.SubElement(ch, "{http://www.w3.org/2005/Atom}link", href=RSS_URL,
                  rel="self", type="application/rss+xml")
    for event in events[:FEED_LIMIT]:
        item = ET.SubElement(ch, "item")
        for name, value in (
            ("title", event["type"]+" · "+event["title"]),
            ("link", event["url"]),
            ("guid", "arquivo-sombrio:"+event["id"]),
            ("description", event["section"]+" — "
             +(event["parent"]+". " if event["parent"] else "")+event["description"]),
            ("pubDate", format_datetime(event["timestamp"].astimezone(timezone.utc), usegmt=True)),
            ("category", event["type"]),
        ):
            child = ET.SubElement(item, name)
            child.text = value
            if name == "guid":
                child.set("isPermaLink", "false")
    return b'<?xml version="1.0" encoding="UTF-8"?>\n'+ET.tostring(root, encoding="utf-8")+b"\n"

def generate(template_file:Path, datasets, updates, routes, now=None):
    now = now or datetime.now(timezone.utc)
    events = collect(datasets, updates, routes, now)
    return render_hub(template_file.read_text(encoding="utf-8"), events), render_rss(events, now), len(events)
