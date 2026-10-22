import io
import json
from pathlib import Path
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch
import wave
import math
from array import array

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import voice_profiles as profiles
import voice_backend as backend
from voice_worker import split_text, make_cues, synthesize_scene
from engine import prepare_audio
from planner import manual_plan
from atualizar_estudio import update, FILES


def recording(seconds=10, silent=False):
    output=io.BytesIO()
    with wave.open(output,'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000)
        samples=array('h',(0 if silent else round(5000*math.sin(2*math.pi*220*i/24000)) for i in range(round(seconds*24000))))
        w.writeframes(samples.tobytes())
    return output.getvalue()


class VoiceTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(); self.root=Path(self.temp.name)
        self.patches=[patch.object(profiles,'VOICES',self.root/'voices'),
                      patch.object(profiles,'DEFAULTS',self.root/'voices'/'defaults.json')]
        for p in self.patches: p.start()

    def tearDown(self):
        for p in self.patches: p.stop()
        self.temp.cleanup()

    def test_profile_validation_and_default_survive_reload(self):
        p=profiles.save_profile('Minha voz',recording(),'.wav')
        profiles.save_defaults('chatterbox',p['id'])
        self.assertEqual(profiles.read_defaults()['profile_id'],p['id'])
        self.assertEqual(profiles.list_profiles()[0]['sha256'],p['sha256'])
        with self.assertRaises(ValueError): profiles.get_profile('../outside')
        with self.assertRaises(ValueError): profiles.save_profile('Silêncio',recording(silent=True),'.wav')
        with self.assertRaises(ValueError): profiles.save_profile('Curta',recording(seconds=1),'.wav')
        self.assertEqual(len(profiles.list_profiles()),1)

    def test_clone_cache_includes_text_and_reference_and_syncs_scenes(self):
        p=profiles.save_profile('Voz 1',recording(),'.wav')
        plan=manual_plan('Cena inicial.\n\nCena final.','Teste',5)
        calls=[]
        def worker(job,progress):
            calls.append(job)
            for s in job['scenes']:
                Path(s['wav']).write_bytes(recording(seconds=1))
                Path(s['srt']).write_text('1\n00:00:00,000 --> 00:00:01,000\n'+s['text'],encoding='utf-8')
        folder=self.root/'project'
        with patch.object(backend,'run_worker',worker):
            _,lengths,cues=prepare_audio(plan,folder,'chatterbox:'+p['id'])
            self.assertEqual(lengths,[1.,1.]); self.assertEqual(cues[1][0],1.)
            prepare_audio(plan,folder,'chatterbox:'+p['id']); self.assertEqual(len(calls),1)
            plan['scenes'][1]['text']='Texto corrigido.'
            prepare_audio(plan,folder,'chatterbox:'+p['id'])
            self.assertEqual(len(calls[1]['scenes']),1)
            ref=Path(p['reference']);ref.write_bytes(recording(seconds=11))
            prepare_audio(plan,folder,'chatterbox:'+p['id'])
            self.assertEqual(len(calls[2]['scenes']),2)

    def test_imported_audio_overrides_selected_cloned_voice(self):
        wav=self.root/'import.wav'; wav.write_bytes(recording(seconds=1))
        srt=self.root/'in.srt';srt.write_text('1\n00:00:00,000 --> 00:00:01,000\nImportado.')
        with patch.object(backend,'prepare_cloned_audio') as clone:
            prepare_audio(manual_plan('Teste.','Teste'),self.root/'out','chatterbox:missing',str(wav),str(srt))
            clone.assert_not_called()

    def test_long_script_chunks_preserve_all_words(self):
        text=('O documento precisa de revisão cuidadosa. '*80).strip()
        chunks=split_text(text)
        self.assertEqual(' '.join(chunks),text)
        self.assertTrue(all(len(c)<=200 for c in chunks))
        with self.assertRaises(ValueError): split_text('x'*201)

    def test_subtitles_use_recognized_times(self):
        words=[SimpleNamespace(word='Uma',start=.2,end=.5),SimpleNamespace(word='história.',start=.6,end=1.1)]
        cues=make_cues([SimpleNamespace(words=words)],2)
        self.assertEqual(cues,[(.2,1.1,'Uma história.')])
        with self.assertRaises(ValueError): make_cues([],1)

    def test_worker_writes_wav_and_retries_asr_without_regenerating_voice(self):
        import numpy as np
        from unittest.mock import MagicMock
        model=MagicMock(); model.sr=24000
        model.generate.return_value.detach.return_value.cpu.return_value.numpy.return_value=np.sin(np.arange(24000)*.1).astype('float32')*.1
        recognizer=MagicMock()
        segment=SimpleNamespace(words=[SimpleNamespace(word='Teste.',start=.1,end=.9)])
        recognizer.transcribe.side_effect=[RuntimeError('download interrupted'),([segment],None)]
        torch=MagicMock();torch.cuda.is_available.return_value=False
        scene={'text':'Teste.','wav':str(self.root/'scene.wav'),'srt':str(self.root/'scene.srt')}
        with self.assertRaises(RuntimeError): synthesize_scene(model,recognizer,scene,'reference.wav',torch,np)
        self.assertTrue(Path(scene['wav']).exists())
        self.assertFalse(Path(scene['srt']).exists())
        synthesize_scene(model,recognizer,scene,'reference.wav',torch,np)
        self.assertEqual(model.generate.call_count,1)
        self.assertEqual(model.generate.call_args.kwargs['language_id'],'pt')
        self.assertIn('00:00:00,100 --> 00:00:00,900',Path(scene['srt']).read_text())

    def test_updater_preserves_private_data_and_backs_up_code(self):
        target=self.root/'old';target.mkdir()
        (target/'studio.py').write_text('previous code')
        (target/'INICIAR.bat').write_text('previous launcher')
        for name in ('projects/user.json','voices/sample.wav','.venv/keep.txt'):
            p=target/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text('keep')
        backup=update(target)
        self.assertEqual((backup/'studio.py').read_text(),'previous code')
        for name in ('projects/user.json','voices/sample.wav','.venv/keep.txt'):
            self.assertEqual((target/name).read_text(),'keep')


class VoiceUITests(unittest.TestCase):
    def test_app_renders_voice_tab_and_handles_missing_install(self):
        from streamlit.testing.v1 import AppTest
        app=AppTest.from_file(str(Path(__file__).resolve().parents[1]/'studio.py')).run(timeout=15)
        self.assertEqual(len(app.exception),0)
        self.assertIn('4 · Minha voz',[t.label for t in app.tabs])
        provider=next(s for s in app.selectbox if s.label=='Modelo de narração')
        provider.select('chatterbox').run()
        self.assertEqual(len(app.exception),0)
        next(b for b in app.button if b.label=='Gerar teste com minha voz').click().run()
        self.assertTrue(any('Selecione Minha voz' in e.value for e in app.error))


if __name__=='__main__': unittest.main()
