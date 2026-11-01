import importlib.util
from pathlib import Path
import unittest
from html import unescape

spec=importlib.util.spec_from_file_location('security',Path(__file__).resolve().parents[1]/'scripts/harden-static-html.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)

class StaticSecurityTests(unittest.TestCase):
    def test_hashes_authorize_only_existing_inline_scripts(self):
        script='window.allowed = true;'
        source='<html><head><meta charset="utf-8"><script>'+script+'</script></head></html>'
        output=unescape(module.harden_html(source))
        self.assertIn(module.digest(script),output)
        self.assertNotIn(module.digest('window.attacker = true;'),output)
        self.assertNotIn("script-src 'self' 'unsafe-inline'",output)
        self.assertLess(output.index('Content-Security-Policy'),output.index('<script>'))
        self.assertIn("object-src 'none'",output)

    def test_rebuild_updates_hashes_without_duplicating_policies(self):
        source='<html><head><meta charset="utf-8"><script>one()</script></head></html>'
        output=unescape(module.harden_html(module.harden_html(source).replace('one()','two()')))
        self.assertEqual(output.count('data-archive-security="csp"'),1)
        self.assertIn(module.digest('two()'),output)
        self.assertNotIn(module.digest('one()'),output)

if __name__=='__main__':unittest.main()
