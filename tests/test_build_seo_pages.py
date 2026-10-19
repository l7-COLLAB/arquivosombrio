import importlib.util
from pathlib import Path
from unittest import TestCase,main
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parent.parent
path=ROOT/"scripts/build-seo-pages.py"
spec=importlib.util.spec_from_file_location("seo_pages",path)
pages=importlib.util.module_from_spec(spec)
spec.loader.exec_module(pages)

def record(identifier,title="Arquivo publicado",status="publicado",text="Narrativa documental"):
 return {"id":identifier,"titulo":title,"resumo":"Descrição pública do registro","historia":text,"conteudo":text,"historia_tecnica":text,"status_publicacao":status,"created_at":"2026-10-19T00:00:00Z"}
class SeoPagesTests(TestCase):
 def test_five_static_html_pages_and_original_links(self):
  data={table:[record(1,title=f"Teste {table}")] for table in pages.PUBLIC_TABLES}
  output=pages.build_all(ROOT,data)
  self.assertEqual(len(output),5)
  for table,(route,_,__,___) in pages.PUBLIC_TABLES.items():
   name="arquivo/"+route.replace(".html","")+"-1.html"
   html=output[name].decode("utf-8")
   self.assertIn('<script type="application/ld+json">',html)
   self.assertIn('<link rel="canonical" href="https://arquivosombrio.net.br/'+name+'">',html)
   self.assertIn(route+"?id=1",html)
 def test_escape_untrusted_editorial_html_and_script(self):
  value='Texto <script>alert("x")</script> & detalhes'
  html=pages.render_page("Casos",record(1,title='Título <x> & y',text=value)).decode()
  self.assertNotIn('<script>alert("x")</script>',html)
  self.assertIn('&lt;x&gt;',html)
  self.assertIn('&amp;',html)
  self.assertIn('Texto alert',html)
 def test_no_drafts_or_invalid_ids_in_generator(self):
  data={table:[record(1)] for table in pages.PUBLIC_TABLES}
  data['Casos']=[record(1,status='rascunho')]
  with self.assertRaises(ValueError):pages.build_all(ROOT,data)
  data['Casos']=[record('../admin')]
  with self.assertRaises(ValueError):pages.build_all(ROOT,data)
 def test_bad_catalog_aborts_generation(self):
  data={table:[record(1)] for table in pages.PUBLIC_TABLES}
  del data['pericias']
  with self.assertRaises(ValueError):pages.build_all(ROOT,data)
if __name__=="__main__":main()
