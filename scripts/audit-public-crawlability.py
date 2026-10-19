#!/usr/bin/env python3
"""Read-only public crawlability audit. Does NOT determine Google indexation."""
from __future__ import annotations
import argparse
from collections import defaultdict
from html.parser import HTMLParser
import json
import re
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

ORIGIN = "https://arquivosombrio.net.br"
SITEMAP = ORIGIN + "/sitemap.xml"
CATEGORIES = ("caso", "garimpo", "pericia", "lendas", "creepypastas")
NS = {"s":"http://www.sitemaps.org/schemas/sitemap/0.9"}

class Head(HTMLParser):
    def __init__(self):
        super().__init__()
        self.canonicals = []
        self.robot_meta = []
        self.og_url = []
        self.title = ""
        self.title_active = False
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "link" and attrs.get("rel", "").lower() == "canonical":
            self.canonicals.append(attrs.get("href", ""))
        if tag == "meta":
            key = (attrs.get("name") or attrs.get("property") or "").lower()
            if key == "robots": self.robot_meta.append(attrs.get("content", ""))
            if key == "og:url": self.og_url.append(attrs.get("content", ""))
        if tag == "title": self.title_active = True
    def handle_endtag(self, tag):
        if tag == "title": self.title_active = False
    def handle_data(self, data):
        if self.title_active: self.title += data

def get(url):
    req = Request(url, headers={"User-Agent":"ArquivoSombrio-SEO-QA/1.0 (+https://arquivosombrio.net.br/robots.txt)", "Accept":"text/html,application/xml,text/xml,*/*"})
    with urlopen(req, timeout=20) as response:
        return response.geturl(), response.status, dict(response.headers.items()), response.read(1_300_000)

def pick_urls(urls):
    grouped = defaultdict(list)
    for url in urls:
        m = re.fullmatch(re.escape(ORIGIN) + r"/arquivo/(caso|garimpo|pericia|lendas|creepypastas)-(\d+)\.html", url)
        if m: grouped[m.group(1)].append((int(m.group(2)),url))
    samples=[]
    for category in CATEGORIES:
        group=sorted(grouped[category])
        if group: samples.append(group[0][1])
        if len(group)>1: samples.append(group[-1][1])
    return grouped,samples

def audit(fetch=get):
    report={"generated_at":datetime.now(timezone.utc).isoformat(),"data_source":"public website HTTP only","google_indexation":"not assessed","sitemap":SITEMAP,"category_counts":{},"checked":[],"errors":[]}
    try:
        final,status,headers,body=fetch(SITEMAP)
        if status != 200: raise ValueError("Sitemap HTTP "+str(status))
        root=ET.fromstring(body)
        urls=[el.text for el in root.findall("s:url/s:loc",NS)]
        if len(urls)!=len(set(urls)):report["errors"].append("Sitemap contém URLs duplicadas")
        grouped,samples=pick_urls(urls)
        report["sitemap_url_count"]=len(urls)
        report["category_counts"]={category:len(grouped[category]) for category in CATEGORIES}
        for category in CATEGORIES:
            if not grouped[category]:report["errors"].append("Editoria sem URLs: "+category)
    except (HTTPError,URLError,TimeoutError,ValueError,ET.ParseError) as e:
        report["errors"].append("Falha ao ler sitemap público: "+str(e))
        return report
    for url in samples:
        item={"url":url,"status":None,"canonical":None,"issue":None}
        try:
            final,status,headers,body=fetch(url)
            item["status"]=status
            parser=Head();parser.feed(body.decode("utf-8","replace"))
            item["canonical"]=parser.canonicals
            problems=[]
            if status!=200:problems.append("HTTP "+str(status))
            if final!=url:problems.append("Redirecionamento para "+final)
            if parser.canonicals!=[url]:problems.append("Canonical ausente, duplicado ou divergente")
            if parser.og_url!=[url]:problems.append("og:url ausente ou divergente")
            if not parser.title.strip():problems.append("title vazio")
            if any("noindex" in value.lower() for value in parser.robot_meta):problems.append("meta noindex")
            if "noindex" in headers.get("X-Robots-Tag","").lower():problems.append("X-Robots-Tag noindex")
            if problems:item["issue"]="; ".join(problems)
        except (HTTPError,URLError,TimeoutError,ValueError) as e:
            item["issue"]=str(e)
        if item["issue"]:report["errors"].append(url+": "+item["issue"])
        # The canonical static page must point readers to the original interactive file.
        # The original route must remain reachable. Do not demand a canonical in the
        # raw HTML of legacy ?id= routes: that metadata is inserted by JavaScript.
        matched=re.fullmatch(re.escape(ORIGIN)+r"/arquivo/(caso|garimpo|pericia|lendas|creepypastas)-(\d+)\.html",url)
        if matched and item["status"]==200:
            category,ident=matched.groups()
            legacy=f"{ORIGIN}/{category}.html?id={ident}"
            item["legacy_url"]=legacy
            try:
                if legacy not in body.decode("utf-8","replace"):
                    issue="Página SEO não aponta para o leitor interativo"
                    report["errors"].append(url+": "+issue)
                    item["legacy_issue"]=issue
                redirected,old_status,old_headers,old_html=fetch(legacy)
                item["legacy_status"]=old_status
                if old_status!=200 or redirected!=legacy:
                    issue="Rota legada inacessível ou redirecionada"
                    report["errors"].append(legacy+": "+issue)
                    item["legacy_issue"]=issue
            except (HTTPError,URLError,TimeoutError,ValueError) as err:
                item["legacy_issue"]=str(err)
                report["errors"].append(legacy+": "+str(err))
        report["checked"].append(item)
    return report

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--report",type=Path,required=True)
    args=parser.parse_args()
    result=audit()
    args.report.parent.mkdir(parents=True,exist_ok=True)
    args.report.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"sitemap_urls":result.get("sitemap_url_count"),"category_counts":result["category_counts"],"sampled_urls":len(result["checked"]),"issues":result["errors"],"google_indexation":"not assessed"},ensure_ascii=False,indent=2))
    if result["errors"]:raise SystemExit(1)

if __name__=="__main__":
    main()
