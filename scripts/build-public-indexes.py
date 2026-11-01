"""Static browse indexes: A–Z, verified country and editorial period.

Does not derive countries from location or prose, and never uses publication
timestamps as historical dates. All values are escaped before entering HTML.
"""
from __future__ import annotations
from collections import defaultdict
from html import escape
import re
import unicodedata

START = "<!-- ARQUIVO_INDICES_START -->"
END = "<!-- ARQUIVO_INDICES_END -->"
BASE = "https://arquivosombrio.net.br/"
ROOT_PAGE = "/indices.html"

def e(v):
    return escape(str(v or ""), quote=True)

def clean(v, limit=160):
    return re.sub(r"\s+", " ", str(v or "")).strip()[:limit]

def collation(v):
    return ''.join(c for c in unicodedata.normalize("NFD", clean(v)) if not unicodedata.combining(c)).casefold()

def initial(v):
    title = collation(v)
    if not title:
        return "#"
    first = title[0].upper()
    return first if first.isascii() and first.isalpha() else "#"

def year_or_editorial_period(table, row):
    if table == "Casos":
        raw = clean(row.get("ano"), 70)
    elif table == "casos_diarios":
        raw = clean(row.get("data_caso"), 70)
    elif table == "lendas":
        raw = clean(row.get("periodo"), 70)
    elif table == "creepypastas":
        raw = clean(row.get("periodo_origem"), 70)
    else:
        return ""
    if not raw:
        return ""
    # For true-crime records, accept only one explicit, unique historical year.
    if table in ("Casos", "casos_diarios"):
        years = re.findall(r"(?<!\d)(?:1[5-9]\d{2}|20\d{2})(?!\d)", raw)
        return years[0] if len(years) == 1 else ""
    # For legends and internet folklore keep the editorial label literally.
    return raw if len(raw) <= 70 else ""

def build_entries(datasets, table_routes):
    if set(datasets) != set(table_routes):
        raise ValueError("Coleções do índice incompletas")
    all_entries = []
    seen = set()
    for table, (page, section, _narrative, _image) in table_routes.items():
        for row in datasets[table]:
            ident = str(row.get("id") or "")
            if row.get("status_publicacao") != "publicado" or not ident.isascii() or not ident.isdecimal():
                raise ValueError("Registro não publicado ou com ID inválido no índice")
            path = "/arquivo/" + page.removesuffix(".html") + "-" + ident + ".html"
            if path in seen:
                raise ValueError("Rota duplicada no índice")
            seen.add(path)
            title = clean(row.get("titulo"), 220)
            if not title:
                raise ValueError("Título vazio no índice")
            country = clean(row.get("pais"), 90) if table == "lendas" else ""
            period = year_or_editorial_period(table, row)
            follow_type = ""
            if table == "Casos":
                follow_type = "dossie"
            elif table == "casos_diarios":
                # Never put Especial/Perícia records under the Garimpo watch action.
                category = collation(row.get("categoria"))
                if not (category.startswith("especial") or category.startswith("pericia")):
                    follow_type = "garimpo"
            all_entries.append(dict(
                title=title, url=path, section=section, country=country,
                period=period, follow_type=follow_type, id=ident,
                initial=initial(title)
            ))
    return sorted(all_entries, key=lambda x:(collation(x["title"]),x["url"]))

def entry_html(item):
    action = ''
    if item["follow_type"]:
        action = ('<div><button type="button" class="watch-button" '
                  'data-watch-type="'+e(item["follow_type"])+'" '
                  'data-watch-id="'+e(item["id"])+'" '
                  'data-watch-title="'+e(item["title"])+'">Acompanhar</button>'
                  '<p class="watch-feedback" role="status" aria-live="polite"></p></div>')
    return ('<li class="index-item"><div><a href="'+e(item["url"])+'">'+e(item["title"])+'</a>'
            '<small>'+e(item["section"])+((' · '+e(item["period"])) if item["period"] else '')+'</small>'
            '</div>'+action+'</li>')

def render_groups(items, key):
    groups = defaultdict(list)
    for item in items:
        k = item[key]
        if k:
            groups[k].append(item)
    result = []
    for label in sorted(groups,key=collation):
        rows = groups[label]
        result.append('<details class="index-group"><summary>'+e(label)+' ('+str(len(rows))+')</summary>'
                      '<ul>'+''.join(entry_html(item) for item in rows)+'</ul></details>')
    return ''.join(result)

def render(template, datasets, table_routes):
    if template.count(START)!=1 or template.count(END)!=1:
        raise ValueError("Marcadores do índice ausentes ou duplicados")
    records = build_entries(datasets, table_routes)
    if not records:
        raise ValueError("Índice vazio")
    az = render_groups(records, "initial")
    by_country = [i for i in records if i["country"]]
    by_period = [i for i in records if i["period"]]
    blocks = [
        '<section class="index" id="indice-az" aria-labelledby="indice-az-titulo">',
        '<h2 id="indice-az-titulo">Índice A–Z</h2>',
        '<p class="index-intro">'+str(len(records))+' registros públicos em ordem alfabética.</p>',az,'</section>',
        '<section class="index" id="indice-pais" aria-labelledby="indice-pais-titulo">',
        '<h2 id="indice-pais-titulo">Por país cadastrado</h2>',
        '<p class="index-intro">'+str(len(by_country))+' de '+str(len(records))+' registros possuem país explícito no cadastro. '
        'Ausência aqui não indica ausência de localização no conteúdo.</p>',
        render_groups(by_country,"country") if by_country else '<p>Nenhum país está cadastrado em um campo próprio.</p>','</section>',
        '<section class="index" id="indice-periodo" aria-labelledby="indice-periodo-titulo">',
        '<h2 id="indice-periodo-titulo">Por período registrado</h2>',
        '<p class="index-intro">'+str(len(by_period))+' de '+str(len(records))+' registros têm ano ou período editorial identificado. '
        'O período se refere ao assunto, não à publicação no site.</p>',
        render_groups(by_period,"period") if by_period else '<p>Nenhum período foi identificado.</p>','</section>',
    ]
    fragment = "\n".join(blocks)
    a = template.index(START)
    b = template.index(END,a)+len(END)
    return (template[:a]+START+"\n"+fragment+"\n"+END+template[b:]).encode("utf-8")
