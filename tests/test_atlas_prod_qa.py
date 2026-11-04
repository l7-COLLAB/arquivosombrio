"""Ensaios do verificador de produção: HTTP/API, isolamento e falha visível."""
import contextlib
import importlib.util
import io
import json
import pathlib
import sys
import tempfile
import unittest
from unittest.mock import patch


MODULE_PATH = pathlib.Path(__file__).resolve().parents[1] / "scripts" / "qa-atlas-production.py"
spec = importlib.util.spec_from_file_location("atlas_prod_qa", MODULE_PATH)
qa = importlib.util.module_from_spec(spec)
spec.loader.exec_module(qa)


class AtlasProductionQATests(unittest.TestCase):
    PUBLIC_HTML = '<div id="atlas-map"></div><script src="/js/atlas-criminal.js?v=2"></script>'
    ADMIN_HTML = '<meta name="robots" content="noindex,nofollow"><form id="location-form"></form><script src="./js/atlas-admin.js?v=2"></script>'
    PUBLIC_JS = "const API = '/rest/v1/case_atlas_public'; const KEY = 'sb_publishable_fixture_123';"
    ADMIN_JS = "const T = 'case_atlas_locations'; function updateReferenceLink() {}"

    def simulate(self, private_status=403, public_status=200, num_rows=53):
        rows = [
            {
                "source_type": "garimpo", "source_id": i + 1,
                "country": "Brasil", "city": "Cidade " + str(i),
                "latitude": -23.5, "longitude": -46.6, "event_year": 2000
            }
            for i in range(num_rows)
        ]

        def fake_request(url, headers=None, attempts=3):
            if "/rest/v1/case_atlas_locations" in url:
                return private_status, '{"code":"42501","message":"permission denied"}'
            if "/rest/v1/case_atlas_public" in url:
                return public_status, json.dumps(rows)
            if url.endswith("/atlas.html"):
                return 200, self.PUBLIC_HTML
            if url.endswith("/admin-v2/atlas.html"):
                return 200, self.ADMIN_HTML
            if "atlas-criminal.js?v=2" in url:
                return 200, self.PUBLIC_JS
            if "atlas-admin.js?v=2" in url:
                return 200, self.ADMIN_JS
            raise AssertionError("Consulta não simulada: " + url)

        with tempfile.TemporaryDirectory() as folder:
            path = pathlib.Path(folder) / "report.json"
            argv = ["qa-atlas-production.py", "--report", str(path)]
            with patch.object(sys, "argv", argv), patch.object(qa, "request", side_effect=fake_request):
                with contextlib.redirect_stdout(io.StringIO()):
                    code = qa.main()
            return code, json.loads(path.read_text(encoding="utf-8"))

    def test_publication_and_access_passing(self):
        code, report = self.simulate()
        self.assertEqual(code, 0, report)
        self.assertEqual(report["result"], "passed")
        self.assertEqual(report["public_rows"], 53)
        self.assertEqual(report["cities"], 53)
        self.assertTrue(all(check["ok"] for check in report["checks"]))

    def test_private_notes_exposed_fails(self):
        code, report = self.simulate(private_status=200)
        self.assertEqual(code, 1)
        self.assertEqual(report["result"], "failed")
        self.assertIn("private_editorial_notes", report["error"])

    def test_api_denied_fails(self):
        code, report = self.simulate(public_status=403)
        self.assertEqual(code, 1)
        self.assertIn("public_api_http", report["error"])

    def test_missing_public_rows_fails(self):
        code, report = self.simulate(num_rows=30)
        self.assertEqual(code, 1)
        self.assertIn("public_records", report["error"])


if __name__ == "__main__":
    unittest.main()
