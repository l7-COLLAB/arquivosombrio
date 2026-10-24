import json
import sys
import unittest
from pathlib import Path
import importlib.util

FILE = Path(__file__).resolve().parents[1] / "scripts" / "audit-dossiers.py"
spec = importlib.util.spec_from_file_location("audit_dossiers", FILE)
module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = module
spec.loader.exec_module(module)

class DossierAuditTests(unittest.TestCase):
    def test_legacy_record_detects_missing_fields(self):
        result = module.run([{"id": 1, "titulo": "Caso", "historia": "Narrativa"}])
        codes = {x["code"] for x in result["results"][0]["issues"]}
        self.assertIn("missing_sources", codes)
        self.assertIn("missing_evidence", codes)
        self.assertNotIn("missing_narrative", codes)

    def test_blocks_are_supported(self):
        case = {
            "titulo": "Caso", "resumo": "Resumo", "local": "Brasil", "ano": "2001",
            "conteudo_blocos": [{"tipo": t, "dados": {"texto": "Conteúdo"}} for t in
                                ("paragrafo", "evidencias", "cronologia", "fontes", "documento", "situacao_oficial")]
        }
        self.assertEqual(module.audit(case)["counts"]["review"], 0)
        self.assertEqual(module.audit(case)["counts"]["advisory"], 0)

    def test_wrapped_exports_and_validation(self):
        self.assertEqual(module.run({"data": [{"titulo": "Teste"}]})["total"], 1)
        with self.assertRaises(ValueError):
            module.run({"unsupported": []})

    def test_does_not_modify_input(self):
        record = {"titulo": "X", "evidencias": ["registro"], "conteudo_blocos": []}
        original = json.dumps(record)
        module.audit(record)
        self.assertEqual(json.dumps(record), original)

if __name__ == "__main__":
    unittest.main()
