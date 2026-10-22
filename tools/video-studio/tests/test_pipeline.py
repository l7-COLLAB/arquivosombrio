import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import wave
from unittest.mock import patch
from PIL import Image
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from planner import manual_plan,validate_plan
from engine import render,read_srt,make_ass

class PipelineTests(unittest.TestCase):
    def test_imported_audio_renders_with_music_and_crossfade(self):
        with tempfile.TemporaryDirectory() as temp:
            folder=Path(temp)
            for i,color in enumerate(('red','blue')):
                Image.new('RGB',(480,640),color).save(folder/f'{i}.jpg')
            audio=folder/'input.wav'
            with wave.open(str(audio),'wb') as wav:
                wav.setnchannels(1); wav.setsampwidth(2); wav.setframerate(16000)
                wav.writeframes(b'\0\0'*16000*4)
            srt=folder/'input.srt'
            srt.write_text('1\n00:00:00,000 --> 00:00:02,000\nPrimeira cena.\n\n2\n00:00:02,000 --> 00:00:04,000\nSegunda cena.',encoding='utf-8')
            plan=manual_plan('Primeira cena.\n\nSegunda cena.','Teste',5)
            for i,s in enumerate(plan['scenes']): s['asset']=str(folder/f'{i}.jpg')
            result=render(plan,folder/'output',imported=str(audio),srt=str(srt),music=str(audio),preview=True)
            self.assertTrue(Path(result['video']).stat().st_size>1000)
            probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',result['video']]))
            self.assertAlmostEqual(float(probe['format']['duration']),4,delta=.15)
            video=next(s for s in probe['streams'] if s['codec_type']=='video')
            self.assertEqual((video['width'],video['height']),(360,640))
            self.assertTrue(any(s['codec_type']=='audio' for s in probe['streams']))
            self.assertEqual(len(read_srt(result['srt'])),2)
            hd=render(plan,folder/'hd',imported=str(audio),srt=str(srt),preview=False,transition=.25)
            hd_probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-of','json',hd['video']]))
            hd_video=next(s for s in hd_probe['streams'] if s['codec_type']=='video')
            self.assertEqual((hd_video['width'],hd_video['height']),(1080,1920))
            subprocess.run(['ffmpeg','-y','-v','error','-ss','1','-i',hd['video'],'-frames:v','1',str(folder/'qa-frame.jpg')],check=True)
            # Completed cached clips should remain reusable on a second render.
            clips={p.name:p.stat().st_mtime_ns for p in (folder/'output').glob('*.mp4') if len(p.stem)==20}
            render(plan,folder/'output',imported=str(audio),srt=str(srt),preview=True,transition=0)
            for name,mtime in clips.items(): self.assertEqual((folder/'output'/name).stat().st_mtime_ns,mtime)

    def test_narration_mode_and_plan_validation(self):
        plan=manual_plan('Uma frase. Outra frase. Terceira frase.','Teste')
        self.assertEqual(len(plan['scenes']),2)
        with self.assertRaises(ValueError): validate_plan({'scenes':[]})
        with self.assertRaises(ValueError): validate_plan({'scenes':[{'text':'x'}],'target_seconds':float('nan')})

    def test_ass_injection_and_wrapping(self):
        plan=manual_plan('texto','{\\pos(0,0)}Teste')
        ass=make_ass(plan,[(0,2,'{\\pos(0,0)} '+('legenda '*20))],[(0,2)],2,360,640)
        self.assertNotIn('{\\pos',ass)
        self.assertIn('&H0000D4FF',ass)
        for line in ass.splitlines():
            if ',Subtitle,' in line: self.assertLessEqual(line.count('\\N'),1)

if __name__=='__main__': unittest.main()
