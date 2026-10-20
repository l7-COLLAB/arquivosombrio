import importlib.util
import sys
import types
import unittest
from pathlib import Path
from unittest.mock import patch,MagicMock
spec=importlib.util.spec_from_file_location('launcher',Path(__file__).resolve().parents[1]/'moneyprinter-original/iniciar_original.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class LauncherTests(unittest.TestCase):
 def test_original_interface_and_loopback(self):
  original=MagicMock(return_value=0);module=types.ModuleType('app.launcher');module.main=original
  with patch.dict(sys.modules,{'app.launcher':module}),patch.object(m.importlib.metadata,'version',return_value=m.VERSION),patch.object(m.socket,'socket'),patch.object(Path,'mkdir'),patch.object(sys,'argv',['script']),patch.dict(m.os.environ,{},clear=True):
   self.assertEqual(m.main(),0)
  original.assert_called_once_with(['webui','--host','127.0.0.1','--port','8501'])
 def test_private_server_is_not_public_funnel(self):
  with patch.object(m,'tail_executable',return_value='tailscale'),patch.object(m.subprocess,'run',return_value=types.SimpleNamespace(stdout='{"BackendState":"Running","Self":{"DNSName":"pc.tailabc.ts.net."}}')),patch.object(m.subprocess,'call',return_value=0) as call:
   self.assertEqual(m.private_access(),0)
   call.assert_called_once_with(['tailscale','serve','--https=8443','http://127.0.0.1:8501'])
 def test_requires_connected_private_network(self):
  with patch.object(m,'tail_executable',return_value='tailscale'),patch.object(m.subprocess,'run',return_value=types.SimpleNamespace(stdout='{"BackendState":"NeedsLogin"}')):
   with self.assertRaises(RuntimeError):m.private_access()
if __name__=='__main__':unittest.main()
