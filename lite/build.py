#!/usr/bin/env python3
"""Build static Lite pages from a reviewed, PUBLIC JSON export. Python stdlib only.
Run: python3 lite/build.py lite/publications.json lite/dist
Never supply database credentials or unreviewed/private rows.
"""
import json, sys, re, html
from pathlib import Path
from datetime import datetime, timezone
from urllib.parse import quote

CATEGORIES = {"dossies":"Dossiês","garimpo":"Garimpo Sombrio","pericia":"Perícia Forense","biblioteca":"Biblioteca","lendas":"Lendas e Creepypastas"}
PAGE_SIZE = 12
def esc(value): return html.escape(str(value or ""), quote=True)
def slug(value):
    value = str(value or "")
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*",value): raise ValueError("Slug inválido: "+repr(value))
    return value
def published(item, now):
    if item.get("status_publicacao") != "publicado": return False
    date=item.get("publicado_em")
    if not date: return False
    try: dt=datetime.fromisoformat(date.replace("Z","+00:00"))
    except ValueError: raise ValueError("Data inválida em "+str(item.get("slug")))
    if dt.tzinfo is None: raise ValueError("Data sem fuso em "+str(item.get("slug")))
    return dt <= now
def layout(title,body,depth=0):
    root="../"*depth
    nav=" ".join('<a href="'+root+'index.html#'+key+'">'+esc(label)+'</a>' for key,label in CATEGORIES.items())
    return ('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">'
      '<meta name="viewport" content="width=device-width,initial-scale=1">'
      '<meta name="robots" content="noindex,nofollow"><title>'+esc(title)+' · Arquivo Sombrio Lite</title>'
      '<link rel="stylesheet" href="'+root+'lite.css"></head><body><div class="wrap">'
      '<header><p class="eyebrow">EDIÇÃO DE LEITURA</p><h1>ARQUIVO SOMBRIO</h1>'
      '<p>Versão Lite</p></header><nav aria-label="Categorias">'+nav+'</nav><main>'+body+
      '</main><footer><p><a href="'+root+'index.html">Início</a> · Arquivo Sombrio Lite</p></footer></div></body></html>')
def text_blocks(value):
    # Explicit plain-text blocks: never inject arbitrary HTML from editorial fields.
    if isinstance(value,str): value=[value]
    if not isinstance(value,list): raise ValueError("conteudo deve ser texto ou lista de parágrafos")
    return "".join("<p>"+esc(x).replace("\n","<br>")+"</p>" for x in value if str(x).strip())
def item_page(item):
    body='<p><a href="../index.html">← Acervo</a></p><h2>'+esc(item["titulo"])+'</h2>'
    if item.get("resumo"): body+='<p>'+esc(item["resumo"])+'</p>'
    body+='<article>'+text_blocks(item["conteudo"])+'</article>'
    for key,label in (("cronologia","Cronologia"),("evidencias","Evidências"),("fontes","Fontes")):
        entries=item.get(key,[])
        if entries:
            if not isinstance(entries,list): raise ValueError(key+" deve ser lista")
            body+='<section><h3>'+label+'</h3><ul>'+''.join('<li>'+esc(x)+'</li>' for x in entries)+'</ul></section>'
    return layout(item["titulo"],body,1)
def build(src,out):
    records=json.loads(src.read_text(encoding="utf-8"))
    if not isinstance(records,list): raise ValueError("A raiz JSON deve ser uma lista")
    now=datetime.now(timezone.utc)
    items=[]; seen=set()
    for item in records:
        if not isinstance(item,dict) or not published(item,now): continue
        category=item.get("categoria")
        if category not in CATEGORIES: raise ValueError("Categoria desconhecida: "+str(category))
        key=slug(item.get("slug"))
        if key in seen: raise ValueError("Slug duplicado: "+key)
        seen.add(key)
        if not isinstance(item.get("titulo"),str) or not item["titulo"].strip(): raise ValueError("Título ausente")
        if not item.get("conteudo"): raise ValueError("Conteúdo ausente: "+key)
        items.append(item)
    # Render everything before touching output to avoid partially built releases.
    pages={}
    for item in items: pages["arquivos/"+item["slug"]+".html"]=item_page(item)
    items.sort(key=lambda x:x["publicado_em"],reverse=True)
    total=max(1,(len(items)+PAGE_SIZE-1)//PAGE_SIZE)
    for page in range(total):
        current=items[page*PAGE_SIZE:(page+1)*PAGE_SIZE]
        sections=[]
        for key,label in CATEGORIES.items():
            subset=[x for x in current if x["categoria"]==key]
            listing=''.join('<p><a href="arquivos/'+quote(x["slug"])+'.html">'+esc(x["titulo"])+'</a><br>'+esc(x.get("resumo",""))+'</p>' for x in subset)
            sections.append('<section id="'+key+'"><h3>'+label+'</h3>'+(listing or '<p>Nenhuma publicação nesta página.</p>')+'</section>')
        pagination='<p> Página '+str(page+1)+' de '+str(total)+'. '
        if page: pagination+='<a href="'+("index.html" if page==1 else "pagina-"+str(page)+".html")+'">Anterior</a> '
        if page+1<total: pagination+='<a href="pagina-'+str(page+2)+'.html">Próxima</a>'
        pagination+='</p>'
        name="index.html" if page==0 else "pagina-"+str(page+1)+".html"
        pages[name]=layout("Acervo",'<h2>Acervo</h2>'+''.join(sections)+pagination)
    css=Path(__file__).with_name("lite.css").read_text(encoding="utf-8")
    pages["lite.css"]=css
    out.mkdir(parents=True,exist_ok=True)
    for name,content in pages.items():
        target=out/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_text(content,encoding="utf-8")
    print("Geradas",len(items),"publicações públicas em",len(pages),"arquivos.")
if __name__=="__main__":
    if len(sys.argv)!=3: sys.exit("Uso: python3 lite/build.py lite/publications.json lite/dist")
    build(Path(sys.argv[1]),Path(sys.argv[2]))
