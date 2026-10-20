import importlib.util
import unittest
from pathlib import Path
from unittest.mock import patch
import tempfile
import asyncio
import sys

spec=importlib.util.spec_from_file_location('studio_host',Path(__file__).resolve().parents[1]/'host/hospedeiro.py')
host=importlib.util.module_from_spec(spec)
spec.loader.exec_module(host)

def fixture():
 return {'id':'00000000-0000-4000-8000-000000000001','lease':'00000000-0000-4000-8000-000000000002','payload':{'text':'Uma pista mudou a investigação.','voice':host.VOICE,'style':'dossie'}}
class HostTests(unittest.TestCase):
 def test_job_restricts_voice_and_size(self):
  self.assertEqual(host.validate_job(fixture())['style'],'dossie')
  for key,value in [('voice','other'),('text',''),('text','a'*15001),('style','invalid')]:
   f=fixture();f['payload'][key]=value
   with self.assertRaises(ValueError):host.validate_job(f)
 def test_job_rejects_invalid_id(self):
  f=fixture();f['id']='../../file'
  with self.assertRaises(ValueError):host.validate_job(f)
 def test_tts_writes_audio_and_subtitles(self):
  class Stream:
   def __init__(self,*args,**kwargs):self.options=kwargs
   async def stream(self):
    yield {'type':'audio','data':b'x'*200}
    yield {'type':'SentenceBoundary','offset':0,'duration':10000000,'text':'Uma pista.'}
  with tempfile.TemporaryDirectory() as d:
   p=Path(d)/'voice.mp3'
   with patch('edge_tts.Communicate',Stream):srt=asyncio.run(host.narrate(fixture()['payload'],p))
   self.assertEqual(p.stat().st_size,200)
   self.assertIn('Uma pista.',srt)
 def test_upload_before_finish(self):
  calls=[]
  async def fake(payload,path):path.write_bytes(b'x'*200);return 'legenda'
  with patch.object(host,'narrate',fake),patch.object(host,'request',lambda *a,**kw:calls.append((a,kw))):
   host.run_job(fixture(),'a'*48)
  self.assertEqual(calls[0][1]['audio'],b'x'*200)
  self.assertEqual(calls[1][0][0],'finish')
if __name__=='__main__':unittest.main()
