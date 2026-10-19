import importlib.util
from pathlib import Path
from unittest import TestCase, main
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("crawl",ROOT/"scripts/audit-public-crawlability.py")
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

class LiveAuditTests(TestCase):
 def urls(self):
  return [mod.ORIGIN+f"/arquivo/{c}-1.html" for c in mod.CATEGORIES]
 def fixture(self,broken=""):
  urls=self.urls()
  xml='<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join(f'<url><loc>{url}</loc></url>' for url in urls)+'</urlset>'
  def fetch(url):
   if url==mod.SITEMAP:return url,200,{},xml.encode()
   canonical="https://wrong.example/test" if url==broken else url
   html=f'<html><head><title>Arquivo</title><link rel="canonical" href="{canonical}"><meta property="og:url" content="{url}"></head></html>'
   return url,200,{},html.encode()
  return fetch
 def test_canonical_and_editorial_coverage(self):
  report=mod.audit(self.fixture())
  self.assertEqual(report["errors"],[])
  self.assertEqual(len(report["checked"]),5)
  self.assertEqual(report["google_indexation"],"not assessed")
 def test_wrong_canonical_detected(self):
  report=mod.audit(self.fixture(self.urls()[0]))
  self.assertTrue(any("Canonical" in x for x in report["errors"]))
 def test_failure_does_not_claim_indexation(self):
  def fail(_):raise TimeoutError("unreachable")
  report=mod.audit(fail)
  self.assertTrue(report["errors"])
  self.assertEqual(report["google_indexation"],"not assessed")
 def test_sitemap_duplicates_detected(self):
  urls=self.urls()
  def fetch(url):
   if url==mod.SITEMAP:
    values=urls+[urls[0]]
    xml='<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join(f'<url><loc>{x}</loc></url>' for x in values)+'</urlset>'
    return url,200,{},xml.encode()
   return self.fixture()(url)
  report=mod.audit(fetch)
  self.assertTrue(any("duplicadas" in x for x in report["errors"]))

if __name__=="__main__":main()
