#!/usr/bin/env python3
"""Read only already-public Supabase rows via publishable key and create Lite JSON.
No service role. Fail closed if a source cannot be fetched.
Usage: SUPABASE_URL=... SUPABASE_PUBLISHABLE_KEY=... python3 lite/export_public.py
"""
import os,json,re,sys
from datetime import datetime,timezone
from html.parser import HTMLParser
from urllib.request import Request,urlopen
from urllib.parse import urlencode

class Plain(HTMLParser):
 def __init__(self): super().__init__();self.parts=[]
 def handle_starttag(self,tag,attrs):
  if tag in ("p","br","li","h2","h3","h4","div"):self.parts.append("\n")
 def handle_data(self,data):self.parts.append(data)
def plain(v):
 if v is None:return ""
 if isinstance(v,(list,dict)):return json.dumps(v,ensure_ascii=False)
 parser=Plain();parser.feed(str(v));return re.sub(r"\n{3,}","\n\n","".join(parser.parts)).strip()
def entries(v):
 if not v:return []
 if isinstance(v,str):
  try: v=json.loads(v)
  except ValueError:return [plain(x) for x in v.splitlines() if x.strip()]
 if isinstance(v,dict):v=[v]
 if not isinstance(v,list):return [plain(v)]
 return [plain(" | ".join(str(y) for y in x.values() if isinstance(y,(str,int,float)))) if isinstance(x,dict) else plain(x) for x in v if x]
def when(v):
 if not v:return None
 try:
  dt=datetime.fromisoformat(v.replace("Z","+00:00"))
  return dt if dt.tzinfo else None
 except (ValueError,AttributeError):return None
def public(row,field):
 if row.get("status_publicacao")!="publicado":return False
 dt=when(row.get(field))
 # Some older published records have no publication timestamp.
 return dt is None or dt<=datetime.now(timezone.utc)
def fetch(table,fields,filters):
 url=os.environ["SUPABASE_URL"].rstrip("/")+"/rest/v1/"+table
 key=os.environ["SUPABASE_PUBLISHABLE_KEY"]
 rows=[];start=0
 while True:
  query=url+"?"+urlencode({"select":",".join(fields),**filters})
  req=Request(query,headers={"apikey":key,"Range":str(start)+"-"+str(start+499),"Accept":"application/json"})
  with urlopen(req,timeout=30) as response: batch=json.load(response)
  if not isinstance(batch,list):raise RuntimeError("Resposta inesperada de "+table)
  rows+=batch
  if len(batch)<500:break
  start+=len(batch)
 return rows
def slug(v,prefix,identifier):
 v=str(v or "").lower().strip()
 v=re.sub(r"[^a-z0-9-]+","-",v).strip("-")
 return prefix+"-"+(v or str(identifier))
def record(row,category,prefix,date,body,extra=None):
 if not public(row,date):return None
 text="\n\n".join(plain(row.get(k)) for k in body if plain(row.get(k)))
 if not text:return None
 out={"slug":slug(row.get("slug"),prefix,row["id"]),"titulo":row["titulo"],"categoria":category,
 "status_publicacao":"publicado","publicado_em":row.get(date) or row.get("created_at"),
 "resumo":plain(row.get("resumo") or row.get("sinopse")),"conteudo":text,"source_id":row.get("id")}
 if extra:
  for dest,key in extra.items():out[dest]=entries(row.get(key))
 return out
def run():
 results=[]
 configs=[
 ("Casos","dossies","dossie","published_at",["historia"],{"evidencias":"evidencias"},["id","slug","titulo","resumo","historia","evidencias","status_publicacao","published_at","created_at"]),
 ("casos_diarios","garimpo","garimpo","publicado_em",["conteudo","situacao_oficial"],{"cronologia":"cronologia","evidencias":"evidencias","fontes":"fontes"},["id","slug","titulo","resumo","conteudo","situacao_oficial","cronologia","evidencias","fontes","status_publicacao","publicado_em","created_at"]),
 ("pericias","pericia","pericia","publicado_em",["introducao","como_funciona","historia_tecnica","aplicacao_casos_reais","limitacoes_controversias","curiosidades"],{"fontes":"fontes"},["id","titulo","resumo","introducao","como_funciona","historia_tecnica","aplicacao_casos_reais","limitacoes_controversias","curiosidades","fontes","status_publicacao","publicado_em","created_at"]),
 ("lendas","lendas","lenda","publicado_em",["introducao","conteudo","contexto_historico","conclusao_arquivo"],{"cronologia":"cronologia","fontes":"fontes"},["id","slug","titulo","resumo","introducao","conteudo","contexto_historico","conclusao_arquivo","cronologia","fontes","status_publicacao","publicado_em","created_at"]),
 ("creepypastas","lendas","creepypasta","publicado_em",["introducao","conteudo","nota_editorial"],{"fontes":"fontes"},["id","slug","titulo","resumo","introducao","conteudo","nota_editorial","fontes","status_publicacao","publicado_em","created_at"])]
 for table,category,prefix,date,body,extra,fields in configs:
  for row in fetch(table,fields,{"status_publicacao":"eq.publicado"}):
   item=record(row,category,prefix,date,body,extra)
   if item:results.append(item)
 novels=fetch("novels",["id","slug","titulo","sinopse","status_publicacao","publicado_em","created_at"],{"status_publicacao":"eq.publicado"})
 for novel in novels:
  if not public(novel,"publicado_em"):continue
  chapters=fetch("novel_capitulos",["id","novel_id","numero","titulo","conteudo","status_publicacao","publicado_em","created_at"],{"novel_id":"eq."+str(novel["id"]),"status_publicacao":"eq.publicado"})
  for ch in chapters:
   if not public(ch,"publicado_em"):continue
   item=record({"id":ch["id"],"slug":str(novel.get("slug") or novel["id"])+"-capitulo-"+str(ch["numero"]),
    "titulo":novel["titulo"]+" · Capítulo "+str(ch["numero"])+(" · "+ch["titulo"] if ch.get("titulo") else ""),
    "sinopse":novel.get("sinopse"),"conteudo":ch.get("conteudo"),"status_publicacao":"publicado",
    "publicado_em":ch.get("publicado_em") or novel.get("publicado_em"),"created_at":ch.get("created_at")},"biblioteca","novel","publicado_em",["conteudo"])
   if item:
    item["obra_id"]=str(novel["id"])
    item["obra_titulo"]=novel["titulo"]
    item["numero_capitulo"]=ch["numero"]
    item["titulo_capitulo"]=ch.get("titulo") or ("Capítulo "+str(ch["numero"]))
    results.append(item)
 # All requests must succeed before overwriting the reviewed export.
 from pathlib import Path
 target=Path(__file__).with_name("publications.json")
 target.write_text(json.dumps(results,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 print("Exportação pública concluída:",len(results),"registros")
if __name__=="__main__":
 if not os.environ.get("SUPABASE_URL") or not os.environ.get("SUPABASE_PUBLISHABLE_KEY"):sys.exit("Defina URL e chave publicável no ambiente.")
 run()
