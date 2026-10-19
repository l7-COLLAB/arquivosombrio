import importlib.util
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import TestCase, main
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    obj = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(obj)
    return obj
audit = load("seo_audit", ROOT / "scripts/audit-seo-build.py")
pages = load("seo_pages", ROOT / "scripts/build-seo-pages.py")
sitemap = pages.sitemap

class AuditTests(TestCase):
    def setUp(self):
        self.tmp = TemporaryDirectory()
        self.site = Path(self.tmp.name)
        (self.site / "arquivo").mkdir()
        row = {"id": 12, "titulo": "Arquivo fictício para teste", "resumo": "Descrição para SEO", "status_publicacao": "publicado", "historia": "Texto público", "created_at": "2026-10-19T00:00:00Z"}
        self.target = self.site / "arquivo/caso-12.html"
        self.target.write_bytes(pages.render_page("Casos", row))
        data = {table: [] for table in pages.PUBLIC_TABLES}
        data["Casos"] = [row]
        (self.site / "sitemap.xml").write_bytes(sitemap.build((ROOT / "sitemap.xml").read_bytes(), data))
    def tearDown(self): self.tmp.cleanup()
    def test_valid_canonical_and_jsonld(self):
        report = audit.audit(self.site)
        self.assertEqual(report["pages"], 1)
        self.assertEqual(report["errors"], [])
    def test_detects_wrong_canonical(self):
        html = self.target.read_text()
        self.target.write_text(html.replace("rel=\"canonical\" href=\"https://arquivosombrio.net.br/arquivo/caso-12.html\"", "rel=\"canonical\" href=\"https://arquivosombrio.net.br/caso.html?id=12\""))
        self.assertTrue(any("Canonical incorreto" in error for error in audit.audit(self.site)["errors"]))
    def test_detects_orphan_sitemap_entry(self):
        self.target.unlink()
        self.assertTrue(any("Entrada no sitemap sem arquivo" in error for error in audit.audit(self.site)["errors"]))
    def test_detects_missing_description(self):
        html = self.target.read_text()
        self.target.write_text(html.replace('name="description"', 'name="unknown"'))
        self.assertTrue(any("Meta description" in error for error in audit.audit(self.site)["errors"]))

if __name__ == "__main__": main()
