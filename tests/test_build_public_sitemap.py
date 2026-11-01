import importlib.util
import io
import json
from pathlib import Path
from unittest import TestCase, main
from unittest.mock import patch
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("sitemap_generator", ROOT / "scripts/build-public-sitemap.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
BASE = (ROOT / "sitemap.xml").read_bytes()

def entry(ident, date="2026-10-18", status="publicado"):
    return {"id": ident, "created_at": date, "updated_at": date, "status_publicacao": status}

class SitemapTests(TestCase):
    def test_publications_change_without_code_edits(self):
        data = {table: [entry(1)] for table in module.SOURCES}
        result = module.build(BASE, data)
        doc = ET.fromstring(result)
        locs = [x.text for x in doc.iter(module.tag("loc"))]
        self.assertEqual(len(locs), 29)  # 24 páginas estáticas + cinco publicações
        self.assertIn("https://arquivosombrio.net.br/arquivo/caso-1.html", locs)
        self.assertNotIn("https://arquivosombrio.net.br/arquivo/caso-26.html", locs)
        self.assertEqual(len(locs), len(set(locs)))
        self.assertIn("https://arquivosombrio.net.br/pesquisa.html", locs)
        self.assertIn("https://arquivosombrio.net.br/atualizacoes.html", locs)
        self.assertIn("https://arquivosombrio.net.br/indices.html", locs)
        self.assertIn("https://arquivosombrio.net.br/participar.html", locs)

    def test_draft_or_missing_editorial_stops_build(self):
        data = {table: [entry(1)] for table in module.SOURCES}
        data["Casos"].append(entry(44, status="rascunho"))
        with self.assertRaises(ValueError):
            module.build(BASE, data)
        del data["Casos"]
        with self.assertRaises(ValueError):
            module.build(BASE, data)

    def test_invalid_date_and_id_stop_build(self):
        data = {table: [entry(1)] for table in module.SOURCES}
        data["Casos"] = [entry(42, date="2026-13-18")]
        with self.assertRaises(ValueError):
            module.build(BASE, data)
        data["Casos"] = [entry("../draft")]
        with self.assertRaises(ValueError):
            module.build(BASE, data)

    def test_public_api_is_filtered(self):
        class Response(io.BytesIO):
            status = 200
            def __enter__(self): return self
            def __exit__(self, *args): self.close()
        response = json.dumps([entry(7)]).encode()
        def mock_open(request, timeout=0):
            self.assertIn("status_publicacao=eq.publicado", request.full_url)
            self.assertIn("id%2Cstatus_publicacao", request.full_url)
            self.assertIn("apikey", {name.lower() for name in request.headers})
            self.assertEqual(timeout,25)
            return Response(response)
        with patch.object(module, "urlopen", side_effect=mock_open):
            self.assertEqual(module.get_public_rows("Casos")[0]["id"], 7)

    def test_network_error_cannot_silently_publish_partial_sitemap(self):
        with patch.object(module, "urlopen", side_effect=TimeoutError("offline")):
            with self.assertRaises(TimeoutError):
                module.get_public_rows("Casos")

if __name__ == "__main__":
    main()
