import importlib.util
import re
from html.parser import HTMLParser
from pathlib import Path
from unittest import TestCase, main

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("seo_pages", ROOT / "scripts/build-seo-pages.py")
pages = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pages)

def row(ident, title=None, status="publicado"):
    text = title or f"Arquivo {ident}"
    return {"id": ident, "titulo": text, "resumo": "Descrição pública",
            "status_publicacao": status, "created_at": f"2026-10-{int(ident):02d}T12:00:00Z",
            "historia": "Texto documental", "conteudo": "Texto documental",
            "historia_tecnica": "Texto técnico"}

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links=[]
    def handle_starttag(self, tag, attributes):
        if tag=="a":
            self.links.append(dict(attributes).get("href"))

class InternalLinksTests(TestCase):
    def setUp(self):
        self.catalog = {table: [row(1),row(2),row(3),row(4)] for table in pages.PUBLIC_TABLES}

    def test_all_related_links_target_existing_published_same_collection(self):
        output=pages.build_all(ROOT,self.catalog)
        self.assertEqual(len(output),20)
        for rel, content in output.items():
            parser=Links();parser.feed(content.decode().split('<aside class="related-documents"')[1].split("</aside>")[0])
            self.assertIn("Continue explorando esta editoria",content.decode())
            peer_links=[link for link in parser.links if link and "/arquivo/" in link]
            self.assertGreaterEqual(len(peer_links),1)
            self.assertLessEqual(len(peer_links),3)
            self.assertEqual(len(peer_links),len(set(peer_links)))
            for url in peer_links:
                destination=url.removeprefix(pages.sitemap.BASE)
                self.assertIn(destination,output)
                self.assertNotEqual(destination,rel)

    def test_cross_editorial_navigation_is_separate_from_related_readings(self):
        output=pages.build_all(ROOT,self.catalog)
        for rel, content in output.items():
            html=content.decode()
            self.assertIn('aria-label="Descubra outras editorias"',html)
            self.assertIn("não representam vínculo factual",html)
            other=html.split('<aside class="cross-editorial"')[1].split("</aside>")[0]
            reader=Links();reader.feed(other)
            self.assertEqual(len(reader.links),2)
            category=rel.split("/")[1].split("-")[0]
            for url in reader.links:
                target=url.removeprefix(pages.sitemap.BASE)
                self.assertIn(target,output)
                self.assertNotEqual(target.split("/")[1].split("-")[0],category)

    def test_empty_other_editorias_are_not_invented(self):
        data={table:[] for table in pages.PUBLIC_TABLES}
        data["Casos"]=[row(1)]
        result=pages.build_all(ROOT,data)
        self.assertNotIn('class="cross-editorial"',result["arquivo/caso-1.html"].decode())

    def test_index_has_one_link_for_each_published_record(self):
        html=pages.insert_index_into_search("<html><head></head><body><main></main></body></html>",self.catalog)
        links=Links();links.feed(html)
        targets=[link for link in links.links if link and "/arquivo/" in link]
        self.assertEqual(len(targets),20)
        self.assertEqual(len(set(targets)),20)
        self.assertIn('<details class="as-static-index-group">',html)
        self.assertIn("Índice dos arquivos publicados",html)

    def test_drafts_or_duplicate_ids_cannot_enter_index(self):
        self.catalog["Casos"].append(row(5,status="rascunho"))
        with self.assertRaises(ValueError):
            pages.index_links(self.catalog)
        with self.assertRaises(ValueError):
            pages.build_all(ROOT,self.catalog)
        self.catalog["Casos"].pop()
        self.catalog["Casos"].append(row(1))
        with self.assertRaises(ValueError):
            pages.build_all(ROOT,self.catalog)

    def test_untrusted_titles_escape_in_links(self):
        self.catalog["Casos"][0]["titulo"]='<script>alert("x")</script> & dados'
        html=pages.index_links(self.catalog)
        self.assertNotIn('<script>alert',html)
        self.assertIn('&amp; dados',html)
        output=pages.build_all(ROOT,self.catalog)
        self.assertIn('&amp; dados',output['arquivo/caso-2.html'].decode())

    def test_no_fictitious_factual_relationship_claim(self):
        output=pages.build_all(ROOT,self.catalog)
        html=output["arquivo/caso-2.html"].decode()
        self.assertIn("A lista não indica relação factual entre os casos.",html)
        self.assertIn("Abrir leitura interativa completa",html)

if __name__=="__main__":
    main()
