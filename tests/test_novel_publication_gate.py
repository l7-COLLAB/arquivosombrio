import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
SQL = ROOT / "supabase/migrations/20261102_novel_chapters_restrictive_release_gate.sql"

class NovelChapterReleaseGateTests(unittest.TestCase):
    def test_restrictive_gate_exists(self):
        content = SQL.read_text(encoding="utf-8").lower()
        self.assertRegex(content, r"create\s+policy\s+novel_chapters_restrictive_release_gate")
        self.assertRegex(content, r"as\s+restrictive")
        self.assertRegex(content, r"for\s+select\s+to\s+anon\s*,\s*authenticated")
        self.assertIn("agendado_para <= now()", content)
        self.assertIn("publicado_em <= now()", content)
        self.assertIn("is_arquivo_sombrio_admin()", content)
        self.assertIn("n.status_publicacao = 'publicado'", content)

if __name__ == "__main__":
    unittest.main()
