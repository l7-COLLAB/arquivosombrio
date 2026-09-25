#!/usr/bin/env python3
"""Build static Lite pages from a reviewed, PUBLIC JSON export. Python stdlib only.
Run: python3 lite/build.py lite/publications.json lite/dist
Never supply database credentials or unreviewed/private rows.
"""
import json, sys, re, html
from pathlib import Path
from datetime import datetime, timezone
from urllib.parse import quote
from collections import defaultdict

CATEGORIES = {"dossies":"Dossiês","garimpo":"Garimpo Sombrio","pericia":"Perícia Forense","biblioteca":"Biblioteca","lendas":"Lendas e Creepypastas"}
PAGE_SIZE = 12
def esc(value): return html.escape(str(value or ""), quote=True)
def slug(value):
    value = re.sub("-+", "-", str(value or ""))
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
    nav=" ".join('<a href="'+root+key+'.html'+'">'+esc(label)+'</a>' for key,label in CATEGORIES.items())
    return ('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">'
      '<meta name="viewport" content="width=device-width,initial-scale=1">'
      '<meta name="robots" content="noindex,nofollow"><title>'+esc(title)+' · Arquivo Sombrio Lite</title>'
      '<link rel="stylesheet" href="'+root+'lite.css?v=4"></head><body><div class="wrap">'
      '<header><p class="eyebrow">EDIÇÃO DE LEITURA</p><h1>ARQUIVO SOMBRIO</h1>'
      '<p>Versão Lite</p></header><nav aria-label="Categorias">'+nav+'</nav><main>'+body+
      '</main><footer><p><a href="'+root+'index.html">Início</a> · Arquivo Sombrio Lite</p></footer></div></body></html>')
def text_blocks(value):
    # Explicit plain-text blocks: never inject arbitrary HTML from editorial fields.
    if isinstance(value,str): value=[value]
    if not isinstance(value,list): raise ValueError("conteudo deve ser texto ou lista de parágrafos")
    parts=[]
    for x in value:
        for p in re.split(r"\n\s*\n",str(x)):
            p=p.strip()
            if not p: continue
            lines=p.splitlines()
            if 4<=len(lines[0])<=95 and lines[0].isupper() and not lines[0].endswith((".",":")):
                parts.append("<h3 class=\"internal-heading\">"+esc(lines[0])+"</h3>")
                p="\n".join(lines[1:]).strip()
            if p: parts.append("<p>"+esc(p).replace("\n","<br>")+"</p>")
    return "".join(parts)
def item_page(item, previous=None, following=None):
    body='<p><a href="../index.html">← Acervo</a></p><h2>'+esc(item["titulo"])+'</h2>'
    if item.get("resumo"): body+='<p>'+esc(item["resumo"])+'</p>'
    body+='<article>'+text_blocks(item["conteudo"])+'</article>'
    for key,label in (("cronologia","Cronologia"),("evidencias","Evidências"),("fontes","Fontes")):
        entries=item.get(key,[])
        if entries:
            if not isinstance(entries,list): raise ValueError(key+" deve ser lista")
            body+='<section><h3>'+label+'</h3><ul>'+''.join('<li>'+esc(x)+'</li>' for x in entries)+'</ul></section>'
    if item.get("obra_id"):
        body += '<p class="chapter-nav">'
        if previous: body += '<a href="'+esc(previous["slug"])+'.html">← Anterior</a> '
        if following: body += '<a href="'+esc(following["slug"])+'.html">Próximo →</a>'
        body += '</p>'
    body += '<p><a href="../'+esc(item["categoria"])+'.html">← Voltar à categoria</a></p>'
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
    pages={}
    groups=defaultdict(list)
    for item in items:
        groups[item["categoria"]].append(item)
    books=defaultdict(list)
    for item in groups["biblioteca"]:
        if item.get("obra_id"): books[str(item["obra_id"])].append(item)
    neighbors={}
    for chapters in books.values():
        chapters.sort(key=lambda x:(int(x.get("numero_capitulo") or 0),x["slug"]))
        for i,chapter in enumerate(chapters):
            neighbors[chapter["slug"]]=(chapters[i-1] if i else None, chapters[i+1] if i+1<len(chapters) else None)
    for item in items:
        before,after=neighbors.get(item["slug"],(None,None))
        pages["arquivos/"+item["slug"]+".html"]=item_page(item,before,after)
    book_entries=[]
    for book_id,chapters in books.items():
        chapters.sort(key=lambda x:(int(x.get("numero_capitulo") or 0),x["slug"]))
        title=chapters[0].get("obra_titulo") or chapters[0]["titulo"].split(" · Capítulo")[0]
        filename="livros/"+slug("livro-"+book_id)+".html"
        links="".join("<li><a href=\"../arquivos/"+esc(c["slug"])+".html\">"+esc(c.get("titulo_capitulo") or c["titulo"])+"</a></li>" for c in chapters)
        pages[filename]=layout(title,"<h2>"+esc(title)+"</h2><ol>"+links+"</ol>",1)
        book_entries.append((title,filename))
    home=[]
    for category,label in CATEGORIES.items():
        if category=="biblioteca":
            entries=book_entries+[(x["titulo"],"arquivos/"+x["slug"]+".html") for x in groups[category] if not x.get("obra_id")]
            entries.sort(key=lambda x:x[0].casefold())
        else:
            groups[category].sort(key=lambda x:x["publicado_em"],reverse=True)
            entries=[(x["titulo"],"arquivos/"+x["slug"]+".html") for x in groups[category]]
        total=max(1,(len(entries)+PAGE_SIZE-1)//PAGE_SIZE)
        for page in range(total):
            subset=entries[page*PAGE_SIZE:(page+1)*PAGE_SIZE]
            listing="".join("<li><a href=\""+esc(path)+"\">"+esc(title)+"</a></li>" for title,path in subset)
            body="<h2>"+esc(label)+"</h2>"+("<ul>"+listing+"</ul>" if subset else "<p>Nenhuma publicação disponível.</p>")
            body+="<p>Página "+str(page+1)+" de "+str(total)+". "
            if page:body+="<a href=\""+(category+".html" if page==1 else category+"-"+str(page)+".html")+"\">Anterior</a> "
            if page+1<total:body+="<a href=\""+category+"-"+str(page+2)+".html\">Próxima</a>"
            body+="</p>"
            name=category+".html" if page==0 else category+"-"+str(page+1)+".html"
            pages[name]=layout(label,body)
        home.append("<section id=\""+category+"\"><h2>"+esc(label)+"</h2><p>"+str(len(entries))+" títulos</p><p><a href=\""+category+".html\">Explorar</a></p></section>")
    pages["index.html"]=layout("Acervo","<h2>Acervo</h2>"+"".join(home))
    css=Path(__file__).with_name("lite.css").read_text(encoding="utf-8")
    pages["lite.css"]=css
    out.mkdir(parents=True,exist_ok=True)
    for name,content in pages.items():
        target=out/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_text(content,encoding="utf-8")
    print("Geradas",len(items),"publicações públicas em",len(pages),"arquivos.")
if __name__=="__main__":
    if len(sys.argv)!=3: sys.exit("Uso: python3 lite/build.py lite/publications.json lite/dist")
    build(Path(sys.argv[1]),Path(sys.argv[2]))
