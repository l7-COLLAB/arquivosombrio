import unittest
from preparation import prepare, revision_hash

class PreparationTests(unittest.TestCase):
    def test_original_names_are_not_guessed(self):
        result = prepare("Dennis Rader investigou BTK em Wichita.")
        self.assertIn("Dennis Rader", result["script"])
        self.assertIn("BTK", result["needs_review"])

    def test_only_approved_replacements(self):
        result = prepare("BTK foi citado.", {"BTK": "B, T, K"})
        self.assertIn("B, T, K", result["script"])

    def test_dates_and_source_revision(self):
        result = prepare("Em 24/09/2026, houve revisão.")
        self.assertIn("24 de setembro de 2026", result["script"])
        self.assertNotEqual(revision_hash("dossie", 1, "A", "A", "v1"),
                            revision_hash("dossie", 1, "B", "B", "v1"))

    def test_empty_text_rejected(self):
        with self.assertRaises(ValueError):
            prepare(" ")
if __name__ == "__main__":
    unittest.main()
