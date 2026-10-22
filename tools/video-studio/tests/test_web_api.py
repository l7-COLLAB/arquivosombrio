import base64
import io
import json
from pathlib import Path
import sys
import tempfile
import threading
import time
import unittest
import wave
from unittest.mock import patch
import requests
from PIL import Image
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import web_api as api

OWNER = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
def data(raw, mime):
    return 'data:'+mime+';base64,'+base64.b64encode(raw).decode()

class WebTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.config = patch.object(api, 'DATA', Path(self.temp.name)); self.config.start()
    def tearDown(self):
        self.config.stop(); self.temp.cleanup()
    def test_reject_filesystem_and_invalid_voice(self):
        plan={'scenes':[{'text':'Texto', 'asset':'/etc/passwd'}]}
        with self.assertRaises(ValueError): api.submit(OWNER, {'plan':plan})
        self.assertEqual(list(Path(self.temp.name).glob('*/*')), [])
        with self.assertRaises(ValueError): api.submit(OWNER, {'plan':plan,'voice':'unknown'})
        with self.assertRaises(ValueError): api.read_job(OWNER, '../escape')
    def test_queue_auth_and_real_mp4(self):
        img=io.BytesIO(); Image.new('RGB',(120,180),'#302016').save(img,'JPEG')
        audio=io.BytesIO()
        with wave.open(audio,'wb') as f:
            f.setnchannels(1);f.setsampwidth(2);f.setframerate(16000);f.writeframes(b'\0\0'*32000)
        payload={'plan':{'title':'Teste web','scenes':[{'text':'Uma pista.', 'asset':data(img.getvalue(),'image/jpeg')}]},
                 'narration':{'name':'audio.wav','src':data(audio.getvalue(),'audio/wav')},
                 'subtitles':{'name':'captions.srt','src':data(b'1\n00:00:00,000 --> 00:00:02,000\nUma pista.\n','text/plain')},'preview':True}
        job=api.submit(OWNER,payload)
        deadline=time.monotonic()+45
        while time.monotonic()<deadline:
            folder,status=api.read_job(OWNER,job['id'])
            if status['state'] in ('completed','failed'): break
            time.sleep(.1)
        self.assertEqual(status['state'],'completed',status)
        self.assertGreater((folder/status['files']['video']).stat().st_size,1000)
        with self.assertRaises(FileNotFoundError): api.read_job('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',job['id'])
        server=api.ThreadingHTTPServer(('127.0.0.1',0),api.Handler)
        thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
        url='http://127.0.0.1:'+str(server.server_port)
        try:
            self.assertEqual(requests.get(url+'/health').status_code,403)
            with patch.object(api.requests,'get') as get:
                get.return_value.status_code=200;get.return_value.json.return_value={'id':OWNER,'app_metadata':{'role':'reader'},'user_metadata':{'role':'admin'}}
                with self.assertRaises(PermissionError):
                    # Exercise server-side authority, not editable user metadata.
                    handler=object.__new__(api.Handler);handler.headers={'Authorization':'Bearer token'};handler.user()
            with patch.object(api.Handler,'user',return_value=OWNER):
                result=requests.get(url+'/jobs/'+job['id']);self.assertEqual(result.status_code,200)
                self.assertEqual(requests.get(url+'/jobs/'+job['id']+'/files/video').headers['Content-Type'],'video/mp4')
            with patch.object(api.Handler,'user',return_value='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'):
                self.assertEqual(requests.get(url+'/jobs/'+job['id']).status_code,404)
        finally:
            server.shutdown();server.server_close()

if __name__=='__main__': unittest.main()
