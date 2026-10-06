"""Refresh existing canonical case URLs without changing slugs or static entries."""
import os,json,urllib.request,urllib.parse,xml.etree.ElementTree as ET
from pathlib import Path
API=os.environ.get('SUPABASE_URL','https://iuhotznurbyujzbyhizf.supabase.co')
KEY=os.environ['SUPABASE_PUBLISHABLE_KEY']
NS='http://www.sitemaps.org/schemas/sitemap/0.9'
ET.register_namespace('',NS)
def fetch(offset):
    url=API+'/rest/v1/case_tracking_summary?select=*&order=content_type.asc,id.asc&offset='+str(offset)+'&limit=500'
    request=urllib.request.Request(url,headers={'apikey':KEY,'Authorization':'Bearer '+KEY})
    with urllib.request.urlopen(request,timeout=30) as response:return json.load(response)
def refresh(path=Path('sitemap.xml')):
    tree=ET.parse(path);root=tree.getroot();entries={x.findtext('{'+NS+'}loc'):x for x in root.findall('{'+NS+'}url')}
    rows=[];offset=0
    while True:
        batch=fetch(offset);rows+=batch
        if len(batch)<500:break
        offset+=500
    for row in rows:
        if not row.get('published_at'):continue
        page='caso.html' if row['content_type']=='dossie' else 'garimpo.html'
        url='https://arquivosombrio.net.br/'+page+'?id='+str(row['id'])
        element=entries.get(url)
        if element is None:
            element=ET.SubElement(root,'{'+NS+'}url');ET.SubElement(element,'{'+NS+'}loc').text=url
        modified=element.find('{'+NS+'}lastmod')
        if modified is None:modified=ET.SubElement(element,'{'+NS+'}lastmod')
        dates=[row.get(k) for k in ('published_at','content_modified_at','updates_modified_at','acompanhamento_encerrado_em') if row.get(k)]
        modified.text=max(dates)[:10]
    ET.indent(tree,space='  ');tree.write(path,encoding='UTF-8',xml_declaration=True)
if __name__=='__main__':refresh()
