import importlib.util
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import TestCase, main

ROOT = Path(__file__).resolve().parents[1]
def load(name, location):
    spec = importlib.util.spec_from_file_location(name, ROOT / location)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

audit = load("seo_internal_links", "scripts/audit-internal-links.py")
pages = load("seo_pages", "scripts/build-seo-pages.py")

def record(ident, title):
    return {"id": ident, "titulo": title, "resumo": "Resumo público", "status_publicacao": "publicado",
            "created_at": "2026-10-19T00:00:00Z", "historia": "Narrativa", "conteudo": "Texto",
            "historia_tecnica": "Perícia"}

class LinkGraphTests(TestCase):
    def setUp(self):
        self.folder = TemporaryDirectory()
        self.site = Path(self.folder.name)
        (self.site / "arquivo").mkdir()
        self.datasets = {table: [record(1, table + " A"), record(2, table + " B")]
                         for table in pages.PUBLIC_TABLES}
        generated = pages.build_all(self.site, self.datasets)
        for rel, content in generated.items():
            (self.site / rel).write_bytes(content)
        html = "<html><head></head><body><main></main></body></html>"
        (self.site / "pesquisa.html").write_text(
            pages.insert_index_into_search(html, self.datasets), encoding="utf-8")
        (self.site / "sitemap.xml").write_bytes(
            pages.sitemap.build((ROOT / "sitemap.xml").read_bytes(), self.datasets))

    def tearDown(self):
        self.folder.cleanup()

    def test_all_canonic_pages_are_linked_and_findable(self):
        result = audit.audit(self.site)
        self.assertEqual(result["canonical_pages"], 10)
        self.assertEqual(result["index_links"], 10)
        self.assertEqual(result["orphan_pages"], [])
        self.assertEqual(result["invalid_archive_links"], [])
        self.assertEqual(result["errors"], [])

    def test_detect_page_missing_from_index(self):
        search = self.site / "pesquisa.html"
        search.write_text(search.read_text().replace(
            'href="https://arquivosombrio.net.br/arquivo/caso-1.html"',
            'href="/dossies.html"'), encoding="utf-8")
        result = audit.audit(self.site)
        self.assertIn("https://arquivosombrio.net.br/arquivo/caso-1.html", result["missing_from_index"])

    def test_detect_broken_archive_link(self):
        doc = self.site / "arquivo/caso-1.html"
        doc.write_text(doc.read_text().replace(
            "https://arquivosombrio.net.br/arquivo/caso-2.html",
            "https://arquivosombrio.net.br/arquivo/caso-9999.html"), encoding="utf-8")
        result = audit.audit(self.site)
        self.assertTrue(any("caso-9999.html" in x["target"] for x in result["invalid_archive_links"]))

    def test_detect_duplicate_index_reference(self):
        search = self.site / "pesquisa.html"
        html = search.read_text()
        html = html.replace("</main>",
            '<a href="https://arquivosombrio.net.br/arquivo/caso-1.html">Repetido</a></main>')
        search.write_text(html, encoding="utf-8")
        result = audit.audit(self.site)
        self.assertIn("https://arquivosombrio.net.br/arquivo/caso-1.html", result["duplicate_index_links"])

    def test_detect_orphan_when_index_and_peers_are_removed(self):
        target = "https://arquivosombrio.net.br/arquivo/caso-1.html"
        for doc in [self.site / "pesquisa.html", *(self.site / "arquivo").glob("*.html")]:
            text = doc.read_text()
            text = text.replace(f'href="{target}"', 'href="/index.html"')
            doc.write_text(text, encoding="utf-8")
        result = audit.audit(self.site)
        self.assertIn(target, result["orphan_pages"])

if __name__ == "__main__":
    main()
