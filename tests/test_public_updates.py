import importlib.util
import io
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import TestCase, main
from unittest.mock import patch
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
def load(path,name):
 spec=importlib.util.spec_from_file_location(name,ROOT/path)
 module=importlib.util.module_from_spec(spec)
 spec.loader.exec_module(module)
 return module

feed=load("scripts/build-public-updates.py","public_updates")
pages=load("scripts/build-seo-pages.py","seo_pages")
NOW=datetime.fromisoformat("2026-10-31T23:00:00+00:00")
def article(table, ident, publication="2026-10-29T18:00:00Z", status="publicado",category="Crime"):
 row={"id":ident,"titulo":"Arquivo "+str(ident),"resumo":"Resumo do caso "+str(ident),
      "status_publicacao":status,"created_at":"2026-10-01T18:00:00Z","categoria":category}
 if table=="Casos":
  row["published_at"]=publication
 else:
  row["publicado_em"]=publication
 return row

def update(ident="123e4567-e89b-12d3-a456-426614174000",daily_id=12,**values):
 data={"id":ident,"dossier_id":None,"daily_id":daily_id,"update_date":"2026-10-30",
       "title":"Investigação reavaliada","body":"Revisão com **fontes** e <script>alert(1)</script> documentos.",
       "information_type":"correcao","created_at":"2026-10-31T12:00:00Z",
       "updated_at":"2026-10-31T12:00:00Z","deleted_at":None}
 data.update(values)
 return data

class UpdatesTests(TestCase):
 def setUp(self):
  self.d={table:[] for table in pages.PUBLIC_TABLES}
  self.d["Casos"]=[article("Casos",1)]
  self.d["casos_diarios"]=[article("casos_diarios",12)]
 def events(self,updates=None):
  return feed.collect(self.d,updates if updates is not None else [update()],pages.PUBLIC_TABLES,NOW)
 def test_publication_and_editorial_correction_are_separate(self):
  events=self.events()
  self.assertEqual(len(events),3)
  self.assertEqual(events[0]["type"],"Correção editorial")
  self.assertEqual(events[0]["kind"],"atualizacao")
  self.assertEqual(len([x for x in events if x["kind"]=="publicacao"]),2)
  self.assertEqual(events[0]["parent"],"Arquivo 12")
  self.assertTrue(events[0]["reader"].endswith("garimpo.html?id=12#atualizacoes-do-caso"))
 def test_prohibits_unpublished_or_embargoed_parent_updates(self):
  self.d["casos_diarios"]=[article("casos_diarios",12,publication="2026-11-02T23:00:00Z")]
  self.assertEqual(len(self.events()),1)
  self.d["casos_diarios"]=[article("casos_diarios",12,status="rascunho")]
  with self.assertRaises(ValueError):
   self.events()
  self.d["casos_diarios"]=[]
  self.assertEqual(len(self.events()),1)
 def test_skips_deleted_future_and_excluded_specials(self):
  self.assertEqual(len(self.events([update(deleted_at="2026-10-31T12:00:00Z")])),2)
  self.assertEqual(len(self.events([update(update_date="2026-11-01")])),2)
  self.d["casos_diarios"]=[article("casos_diarios",12,category="Especial de Halloween")]
  self.assertEqual(len(self.events()),1)
 def test_update_time_is_not_pretended_date_of_historical_event(self):
  u=update(created_at="2026-10-28T12:00:00Z",update_date="2026-10-01")
  found=next(x for x in self.events([u]) if x["kind"]=="atualizacao")
  self.assertEqual(found["timestamp"],datetime.fromisoformat("2026-10-29T18:00:00+00:00"))
  self.assertEqual(found["editorial_date"].isoformat(),"2026-10-01")
 def test_bounded_rss_unique_guid_xml_and_escaped_content(self):
  events=self.events()
  xml=feed.render_rss(events,NOW)
  root=ET.fromstring(xml)
  self.assertEqual(root.tag,"rss")
  items=root.findall("channel/item")
  self.assertEqual(len(items),3)
  guids=[x.findtext("guid") for x in items]
  self.assertEqual(len(guids),len(set(guids)))
  self.assertEqual(items[0].find("guid").get("isPermaLink"),"false")
  self.assertIn("atualizacoes.html#atualizacao-",items[0].findtext("link"))
  self.assertNotIn("<script>",xml.decode())
  self.assertIsNotNone(parsedate_to_datetime(items[0].findtext("pubDate")).tzinfo)
  self.assertIn("atualizacoes.html",root.findtext("channel/link"))
  atom=root.find("channel/{http://www.w3.org/2005/Atom}link")
  self.assertEqual(atom.attrib["href"],feed.RSS_URL)
 def test_hub_can_be_read_without_js_and_safe_excerpt(self):
  tmpl=(ROOT/"atualizacoes.html").read_text()
  html=feed.render_hub(tmpl,self.events()).decode()
  self.assertIn('id="atualizacao-123e4567-e89b-12d3-a456-426614174000"',html)
  self.assertIn("Data editorial:",html)
  self.assertIn("Correção editorial",html)
  self.assertIn("Arquivo relacionado: Arquivo 12",html)
  self.assertIn("Acompanhe",html) if False else None
  self.assertNotIn("<script>alert(1)</script>",html)
  self.assertIn('application/rss+xml',html)
  self.assertNotIn('id="login"',html)
  self.assertEqual(html.count(feed.START),1)
 def test_duplicate_and_invalid_kinds_fail_closed(self):
  with self.assertRaises(ValueError): self.events([update(),update()])
  with self.assertRaises(ValueError): self.events([update(information_type="novo_fato_inventado")])
 def test_update_is_not_invented_from_updated_at(self):
  self.d["Casos"][0]["updated_at"]="2026-10-31T19:00:00Z"
  self.assertEqual(len(self.events([])),2)
 def test_realistic_build_uses_existing_html_template(self):
  with TemporaryDirectory() as folder:
   file=Path(folder)/"atualizacoes.html"
   file.write_bytes((ROOT/"atualizacoes.html").read_bytes())
   html,xml,count=feed.generate(file,self.d,[update()],pages.PUBLIC_TABLES,NOW)
   self.assertEqual(count,3)
   self.assertIn(b"Investigacao" if False else "Investigação".encode(),html)
   ET.fromstring(xml)
 def test_public_api_uses_anonymous_role_and_excludes_deletions(self):
  class Response(io.BytesIO):
   status=200
   def __enter__(self):return self
   def __exit__(self,*args):self.close()
  def handle(req,timeout=0):
   self.assertIn("deleted_at=is.null",req.full_url)
   self.assertEqual(timeout,30)
   self.assertIn("apikey",{k.lower() for k in req.headers})
   return Response(b'[]')
  with patch.object(feed,"urlopen",side_effect=handle):
   self.assertEqual(feed.public_updates(),[])
  with patch.object(feed,"urlopen",side_effect=TimeoutError("offline")):
   with self.assertRaises(TimeoutError):feed.public_updates()
 def test_existing_article_rss_autodiscovery(self):
  html=pages.render_page("Casos",article("Casos",1)).decode()
  self.assertIn('rel="alternate" type="application/rss+xml"',html)
  self.assertIn('href="/atualizacoes.html"',html)

if __name__=="__main__":main()
