import importlib.util
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import TestCase, main
from xml.etree import ElementTree as ET

path=Path(__file__).resolve().parent.parent/"scripts/build-novels-seo.py"
spec=importlib.util.spec_from_file_location("novels_seo",path)
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

def book(status="publicado",slug="a-mulher-de-branco"):
    return {"id":"book-1","slug":slug,"titulo":"A Mulher de Branco","sinopse":"Mistério & segredo.","autor_nome":"Wilkie Collins","status_publicacao":status}

class NovelSeoTests(TestCase):
    def test_published_book_and_chapter(self):
        with TemporaryDirectory() as d:
            site=Path(d)
            site.joinpath("sitemap.xml").write_text('<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',encoding="utf-8")
            count=mod.build(site,[book()],[{"novel_id":"book-1","numero":1,"titulo":"A chegada","status_publicacao":"publicado"}])
            self.assertEqual(count,1)
            html=(site/"novels/a-mulher-de-branco.html").read_text()
            self.assertIn("application/ld+json",html)
            self.assertIn("A Mulher de Branco",html)
            self.assertIn("capitulo=1",html)
            self.assertIn("Mistério &amp; segredo.",html)
            root=ET.parse(site/"sitemap.xml").getroot()
            self.assertEqual(len(root),1)
    def test_rejects_draft_book_and_chapter(self):
        with TemporaryDirectory() as d:
            site=Path(d)
            site.joinpath("sitemap.xml").write_text('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>')
            with self.assertRaises(ValueError):mod.build(site,[book(status="rascunho")],[])
            with self.assertRaises(ValueError):mod.build(site,[book()],[{"novel_id":"book-1","numero":2,"status_publicacao":"rascunho"}])
    def test_rejects_invalid_slug(self):
        with self.assertRaises(ValueError):mod.valid_slug("../admin")
    def test_json_ld_cannot_close_script(self):
        html=mod.render({**book(),"titulo":"</script><script>alert(1)</script>"},[]).decode()
        self.assertNotIn('</script><script>alert(1)</script>',html)
        self.assertIn('\\u003c/script>',html)
    def test_escapes_metadata(self):
        html=mod.render({**book(),"titulo":"<script>bad</script> & teste"},[]).decode()
        self.assertNotIn("<script>bad</script>",html)
        self.assertIn("&amp; teste",html)

if __name__=="__main__":main()
