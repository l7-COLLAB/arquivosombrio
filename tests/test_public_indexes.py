import importlib.util
from pathlib import Path
from unittest import TestCase, main

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("public_indexes",ROOT/"scripts/build-public-indexes.py")
indexes=importlib.util.module_from_spec(spec)
spec.loader.exec_module(indexes)
page_spec=importlib.util.spec_from_file_location("seo_pages",ROOT/"scripts/build-seo-pages.py")
pages=importlib.util.module_from_spec(page_spec)
page_spec.loader.exec_module(pages)

def row(ident,title="Arquivo documental",**extra):
 value={"id":ident,"titulo":title,"status_publicacao":"publicado",
        "created_at":"2026-10-25T18:00:00Z","resumo":"Resumo documental"}
 value.update(extra)
 return value

def fixture():
 rows={table:[] for table in pages.PUBLIC_TABLES}
 rows["Casos"]=[
   row(1,"Árvore no escuro",ano="1992",local="América do Sul"),
   row(2,"Zeta: análise",ano="1992 e 1994"),
   row(3,"Sem ano"),
 ]
 rows["casos_diarios"]=[
   row(1,"Arquivo da madrugada",data_caso="outubro de 2018",categoria="GARIMPO SOMBRIO"),
   row(2,"Especial de Halloween",data_caso="1992",categoria="ESPECIAL DE HALLOWEEN"),
 ]
 rows["lendas"]=[row(7,"Corpo-Seco",pais="Brasil",periodo="século XX"),
                 row(8,"Caminho sombrio",pais="",periodo="")]
 rows["creepypastas"]=[row(9,"Mistério digital",periodo_origem="2008")]
 rows["pericias"]=[row(11,"Entomologia forense")]
 return rows

class IndexTests(TestCase):
 def test_exact_country_metadata_only(self):
  records=indexes.build_entries(fixture(),pages.PUBLIC_TABLES)
  self.assertEqual(len(records),9)
  self.assertEqual([x["country"] for x in records if x["country"]],["Brasil"])
  for item in records:
   if item["section"]=="Dossiês":
    self.assertEqual(item["country"],"")
 def test_year_is_unambiguous_and_from_editorial_fields(self):
  rec=indexes.build_entries(fixture(),pages.PUBLIC_TABLES)
  year={x["title"]:x["period"] for x in rec}
  self.assertEqual(year["Árvore no escuro"],"1992")
  self.assertEqual(year["Zeta: análise"],"")
  self.assertEqual(year["Sem ano"],"")
  self.assertEqual(year["Arquivo da madrugada"],"2018")
  self.assertEqual(year["Corpo-Seco"],"século XX")
  self.assertEqual(year["Mistério digital"],"2008")
  self.assertEqual(year["Entomologia forense"],"")
 def test_az_index_has_every_published_item_once(self):
  source=(ROOT/"indices.html").read_text()
  html=indexes.render(source,fixture(),pages.PUBLIC_TABLES).decode()
  az=html.split('id="indice-az"')[1].split('id="indice-pais"')[0]
  self.assertEqual(az.count('class="index-item"'),9)
  self.assertEqual(az.count('href="/arquivo/'),9)
  self.assertEqual(html.count(indexes.START),1)
  self.assertIn('id="indice-periodo"',html)
  self.assertIn('id="indice-pais"',html)
  self.assertIn("9 registros públicos",html)
  self.assertIn("1 de 9 registros possuem país",html)
 def test_follow_only_documented_dossier_and_garimpo(self):
  records=indexes.build_entries(fixture(),pages.PUBLIC_TABLES)
  follow={x["title"]:x["follow_type"] for x in records}
  self.assertEqual(follow["Árvore no escuro"],"dossie")
  self.assertEqual(follow["Arquivo da madrugada"],"garimpo")
  self.assertEqual(follow["Especial de Halloween"],"")
  self.assertEqual(follow["Entomologia forense"],"")
  html=indexes.render((ROOT/"indices.html").read_text(),fixture(),pages.PUBLIC_TABLES).decode()
  self.assertIn('data-watch-type="dossie"',html)
  self.assertIn('data-watch-type="garimpo"',html)
 def test_no_injected_markup_or_urls(self):
  data=fixture()
  data["lendas"][0]["titulo"]='Título <img src=x onerror=alert(1)> & Terra'
  data["lendas"][0]["pais"]='<script>RUIM</script>'
  html=indexes.render((ROOT/"indices.html").read_text(),data,pages.PUBLIC_TABLES).decode()
  self.assertNotIn('<img src=x',html)
  self.assertNotIn('<script>RUIM</script>',html)
  self.assertIn('&lt;script&gt;RUIM&lt;/script&gt;',html)
 def test_rejects_drafts_invalid_ids_and_missing_categories(self):
  data=fixture()
  data["Casos"][0]["status_publicacao"]="rascunho"
  with self.assertRaises(ValueError): indexes.build_entries(data,pages.PUBLIC_TABLES)
  data=fixture();data["Casos"][0]["id"]="../admin"
  with self.assertRaises(ValueError): indexes.build_entries(data,pages.PUBLIC_TABLES)
  data=fixture();del data["lendas"]
  with self.assertRaises(ValueError): indexes.build_entries(data,pages.PUBLIC_TABLES)
 def test_canonical_dossier_follow_action_and_literary_exclusion(self):
  html=pages.render_page("Casos",row(3,"Dossiê inédito")).decode()
  self.assertIn('data-watch-type="dossie"',html)
  self.assertIn('data-watch-id="3"',html)
  self.assertIn('js/watchlist-public.js',html)
  special=pages.render_page("casos_diarios",row(12,"Especial",categoria="ESPECIAL HALLOWEEN")).decode()
  self.assertNotIn('data-watch-type="garimpo"',special)
  lenda=pages.render_page("lendas",row(2,"Lenda")).decode()
  self.assertNotIn('data-watch-type="dossie"',lenda)

if __name__=="__main__":main()
