import importlib.util
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import TestCase, main
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("readiness", ROOT / "scripts/audit-mobile-seo-readiness.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

def page(url, viewport=True, alt=True):
    vp = '<meta name="viewport" content="width=device-width,initial-scale=1">' if viewport else ""
    img = '<img src="/icon-512.png" alt="Ilustração">' if alt else '<img src="/icon-512.png">'
    return f'<html lang="pt-BR"><head>{vp}<title>Arquivo</title><link rel="canonical" href="{url}"></head><body><main><h1>Título</h1>{img}</main></body></html>'

class ReadinessTests(TestCase):
    def setUp(self):
        self.tmp=TemporaryDirectory()
        self.site=Path(self.tmp.name)
        (self.site/"arquivo").mkdir()
        sitemap_urls=[mod.BASE] + [mod.BASE + x for x in mod.MAIN_ROUTES if x != "index.html"]
        sitemap_urls += [mod.BASE+"arquivo/caso-1.html"]
        namespace="http://www.sitemaps.org/schemas/sitemap/0.9"
        top=ET.Element("urlset",xmlns=namespace)
        for url in sitemap_urls:
            item=ET.SubElement(top,"url")
            ET.SubElement(item,"loc").text=url
        ET.ElementTree(top).write(self.site/"sitemap.xml",encoding="utf-8",xml_declaration=True)
        for route in mod.MAIN_ROUTES:
            url=mod.BASE if route=="index.html" else mod.BASE + route
            (self.site/route).write_text(page(url),encoding="utf-8")
        (self.site/"arquivo/caso-1.html").write_text(page(mod.BASE+"arquivo/caso-1.html"),encoding="utf-8")
    def tearDown(self):
        self.tmp.cleanup()
    def test_good_mobile_and_seo_baseline(self):
        result=mod.check(self.site)
        self.assertEqual(result["pages_checked"],8)
        self.assertEqual(result["canonical_articles_checked"],1)
        self.assertEqual(result["errors"],[])
    def test_missing_mobile_viewport_blocks(self):
        target=self.site/"garimpo.html"
        target.write_text(page(mod.BASE+"garimpo.html",viewport=False),encoding="utf-8")
        self.assertTrue(any("Viewport móvel" in e for e in mod.check(self.site)["errors"]))
    def test_wrong_canonical_blocks(self):
        target=self.site/"arquivo/caso-1.html"
        target.write_text(page(mod.BASE+"arquivo/caso-2.html"),encoding="utf-8")
        self.assertTrue(any("Canonical" in e for e in mod.check(self.site)["errors"]))
    def test_missing_alt_is_warning_not_unrelated_publication_block(self):
        target=self.site/"index.html"
        target.write_text(page(mod.BASE,alt=False),encoding="utf-8")
        result=mod.check(self.site)
        self.assertEqual(result["errors"],[])
        self.assertTrue(any("imagens sem alt" in e for e in result["warnings"]))

if __name__=="__main__":
    main()
