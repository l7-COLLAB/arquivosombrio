"""Local MP4 renderer. SRT reader reused from MoneyPrinterTurbo (MIT)."""
import asyncio
import hashlib
import json
import math
import os
from pathlib import Path
import re
import shutil
import subprocess
import textwrap
import wave
from PIL import Image, ImageOps
from vendor.subtitle_reader import file_to_subtitles


def ffmpeg():
    binary = shutil.which('ffmpeg')
    if binary:
        return binary
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


def run(args, cwd=None):
    result = subprocess.run([str(a) for a in args], cwd=cwd, capture_output=True, text=True,
                            encoding='utf-8', errors='replace')
    if result.returncode:
        raise RuntimeError('Falha de processamento: ' + result.stderr[-3500:])
    return result.stdout


def duration(path):
    # Decode to PCM: works even when bundled FFmpeg has no ffprobe sibling.
    result = subprocess.run([ffmpeg(), '-v', 'error', '-i', str(path), '-vn', '-ac', '1',
                             '-ar', '16000', '-f', 's16le', '-'], capture_output=True)
    if result.returncode:
        raise ValueError('Não foi possível ler o áudio. Importe MP3, WAV ou M4A válido.')
    seconds = len(result.stdout) / 32000
    if seconds < .2 or seconds > 1800:
        raise ValueError('O áudio deve durar entre 0,2 segundos e 30 minutos.')
    return seconds


def stamp(seconds, ass=False):
    unit = 100 if ass else 1000
    n = max(0, round(seconds * unit))
    h, n = divmod(n, 3600 * unit)
    m, n = divmod(n, 60 * unit)
    s, frac = divmod(n, unit)
    return f'{h}:{m:02}:{s:02}.{frac:02}' if ass else f'{h:02}:{m:02}:{s:02},{frac:03}'


def parse_stamp(value):
    h, m, s = value.strip().replace(',', '.').split(':')
    return int(h)*3600 + int(m)*60 + float(s)


def read_srt(path):
    cues = []
    for _, header, text in file_to_subtitles(str(path)):
        parts = header.split('-->')
        if len(parts) != 2:
            raise ValueError('Linha de tempo SRT inválida.')
        start, end = parse_stamp(parts[0]), parse_stamp(parts[1].strip().split()[0])
        if end <= start:
            raise ValueError('SRT contém um trecho sem duração.')
        cues.append((start, end, text))
    if not cues:
        raise ValueError('O arquivo SRT não possui legendas válidas.')
    return cues


def write_srt(cues, path):
    Path(path).write_text('\n\n'.join(f'{i}\n{stamp(a)} --> {stamp(b)}\n{t}'
                         for i, (a,b,t) in enumerate(cues, 1))+'\n', encoding='utf-8')


def grouped_cues(events):
    cues, group = [], []
    for start, end, word in events:
        if group and (len(' '.join(x[2] for x in group)) + len(word) > 62 or len(group) >= 10):
            cues.append((group[0][0], group[-1][1], ' '.join(x[2] for x in group)))
            group = []
        group.append((start, end, word))
    if group:
        cues.append((group[0][0], group[-1][1], ' '.join(x[2] for x in group)))
    return cues


async def synthesize(text, voice, path):
    import edge_tts
    events = []
    communicator = edge_tts.Communicate(text, voice, boundary='WordBoundary')
    with open(path, 'wb') as audio:
        async for event in communicator.stream():
            if event['type'] == 'audio':
                audio.write(event['data'])
            elif event['type'] == 'WordBoundary':
                events.append((event['offset']/1e7, (event['offset']+event['duration'])/1e7, event['text']))
    if not events:
        raise ValueError('O serviço de voz não devolveu tempos de legenda. Tente novamente ou importe áudio e SRT.')
    return grouped_cues(events)


def transcribe(audio, model='base'):
    try:
        from faster_whisper import WhisperModel
    except ImportError as exc:
        raise ValueError('Para áudio importado, forneça um SRT ou instale a transcrição opcional pelo INSTALAR_TRANSCRICAO.bat.') from exc
    recognizer = WhisperModel(model, device='cpu', compute_type='int8')
    segments, _ = recognizer.transcribe(str(audio), language='pt', word_timestamps=True, vad_filter=True)
    words = [(w.start, w.end, w.word.strip()) for segment in segments for w in (segment.words or []) if w.word.strip()]
    if not words:
        raise ValueError('Nenhuma fala identificada no áudio importado.')
    return grouped_cues(words)


def ass_text(text):
    text = re.sub(r'<[^>]*>', '', text).replace('\\', ' ').replace('{', '(').replace('}', ')')
    return text.replace('\r', '').replace('\n', '\\N')


def make_ass(plan, cues, times, target, w, h):
    size = round(w*.047)
    header = f'''[Script Info]
ScriptType: v4.00+
PlayResX: {w}
PlayResY: {h}
WrapStyle: 0
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Subtitle,Arial,{size},&H0000D4FF,&H0000D4FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,{max(2,round(w*.005))},0,2,{round(w*.07)},{round(w*.12)},{round(h*.25)},1
Style: Title,Arial,{round(w*.029)},&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,2,0,9,{round(w*.06)},{round(w*.12)},{round(h*.12)},1
Style: Label,Arial,{round(w*.023)},&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,1,0,7,{round(w*.06)},{round(w*.12)},{round(h*.17)},1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
'''
    lines = [header]
    def line(a,b,style,text):
        lines.append(f'Dialogue: 0,{stamp(a,True)},{stamp(b,True)},{style},,0,0,0,,{ass_text(text)}')
    line(0,target,'Title',plan['title'].upper())
    for a,b,t in cues:
        wrapped = textwrap.wrap(t.replace('\n',' '), width=30, break_long_words=False)
        # Long imported cues are split in time rather than producing 3+ lines.
        chunks = ['\n'.join(wrapped[i:i+2]) for i in range(0,len(wrapped),2)]
        for i, chunk in enumerate(chunks):
            start = a+(b-a)*i/len(chunks)
            end = min(target,a+(b-a)*(i+1)/len(chunks))
            if start < end:
                line(start,end,'Subtitle',chunk)
    for scene, (a,b) in zip(plan['scenes'],times):
        if scene.get('kind') != 'real':
            line(a,b,'Label','IMAGEM ILUSTRATIVA')
    return '\n'.join(lines)


def prepare_audio(plan, folder, voice, imported=None, srt=None, progress=lambda x: None):
    folder=Path(folder); folder.mkdir(parents=True,exist_ok=True)
    lengths, cues = [], []
    if imported:
        progress('Lendo áudio importado e sincronizando legendas…')
        total=duration(imported)
        cues=read_srt(srt) if srt else transcribe(imported)
        if max(b for _,b,_ in cues)>total+.5:
            raise ValueError('O SRT ultrapassa a duração do áudio. Importe a legenda correspondente.')
        weights=[len(s['text'].split()) for s in plan['scenes']]
        lengths=[total*n/sum(weights) for n in weights]
        audio=folder/'narracao.wav'
        run([ffmpeg(),'-y','-v','error','-i',imported,'-vn','-ar','48000','-ac','2',audio])
    else:
        offset=0; wavs=[]
        for i,scene in enumerate(plan['scenes']):
            progress(f'Gerando voz: cena {i+1}/{len(plan["scenes"])}…')
            identity=hashlib.sha256((voice+'\n'+scene['text']).encode()).hexdigest()[:20]
            mp3=folder/(identity+'.mp3'); meta=folder/(identity+'.json'); wav=folder/(identity+'.wav')
            if not (mp3.exists() and meta.exists()):
                try:
                    items=asyncio.run(synthesize(scene['text'],voice,mp3))
                    meta.write_text(json.dumps(items,ensure_ascii=False),encoding='utf-8')
                except Exception as exc:
                    mp3.unlink(missing_ok=True)
                    raise ValueError('A voz online falhou. Confira internet e certificado do Windows, tente novamente ou importe um áudio com SRT. Detalhe: '+type(exc).__name__) from exc
            items=json.loads(meta.read_text(encoding='utf-8'))
            run([ffmpeg(),'-y','-v','error','-i',mp3,'-ar','48000','-ac','2',wav])
            length=duration(wav); lengths.append(length); wavs.append(wav)
            cues.extend((a+offset,min(b,length)+offset,t) for a,b,t in items)
            offset+=length
        audio=folder/'narracao.wav'
        # Paths are controlled hex filenames, never untrusted concat directives.
        (folder/'audio-list.txt').write_text('\n'.join(f"file '{p.name}'" for p in wavs),encoding='utf-8')
        run([ffmpeg(),'-y','-v','error','-f','concat','-safe','1','-i','audio-list.txt','-c','copy',audio.name],cwd=folder)
    write_srt(cues,folder/'legendas.srt')
    return str(audio),lengths,cues


def render(plan, folder, voice='pt-BR-FranciscaNeural', imported=None, srt=None, music=None,
           music_volume=.1, transition=.35, preview=False, progress=lambda x: None):
    folder=Path(folder).resolve(); folder.mkdir(parents=True,exist_ok=True)
    for i,scene in enumerate(plan['scenes']):
        if not Path(scene.get('asset','')).is_file():
            raise ValueError(f'A cena {i+1} ainda não tem imagem. Selecione ou importe antes de gerar.')
    w,h=(360,640) if preview else (1080,1920)
    audio,lengths,cues=prepare_audio(plan,folder,voice,imported,srt,progress)
    total=sum(lengths)
    fade=min(float(plan.get('fade_seconds',1)),total/3)
    cross=min(float(transition),min(lengths)/4)
    clips=[]; timeline=[]; start=0
    for i,(scene,length) in enumerate(zip(plan['scenes'],lengths)):
        timeline.append((start,start+length))
        # Extra tail overlaps the next scene; narration duration stays unchanged.
        clip_length=length+(cross if i<len(lengths)-1 else 0)
        # Version the cache so old cropped/animated clips are never reused.
        identity=hashlib.sha256(Path(scene['asset']).read_bytes()+str(('contain-static-v2',clip_length,w,h,plan['black_white'])).encode()).hexdigest()[:20]
        clip=folder/(identity+'.mp4'); clips.append(clip)
        if not clip.exists():
            progress(f'Renderizando cena {i+1}/{len(lengths)}…')
            with Image.open(scene['asset']) as im:
                im=ImageOps.contain(ImageOps.exif_transpose(im).convert('RGB'),(w,h),method=Image.Resampling.LANCZOS)
                if plan['black_white']:
                    im=ImageOps.grayscale(im).convert('RGB')
                canvas=Image.new('RGB',(w,h),(16,19,23))
                canvas.paste(im,((w-im.width)//2,(h-im.height)//2))
                im=canvas
                still=folder/(identity+'.jpg'); im.save(still,quality=95)
            # Static frames avoid zoompan's integer-pixel stepping on archival photos.
            vf='setsar=1,format=yuv420p'
            partial=folder/(identity+'.partial.mp4')
            run([ffmpeg(),'-y','-v','error','-threads','2','-loop','1','-framerate','30','-i',still,'-vf',vf,'-t',f'{clip_length:.6f}',
                 '-an','-c:v','libx264','-threads','2','-preset','ultrafast','-pix_fmt','yuv420p',partial])
            partial.replace(clip)
        start+=length
    progress('Combinando cenas e transições…')
    base=folder/('preview-base.mp4' if preview else 'base.mp4')
    inputs=[]
    for clip in clips:
        inputs+=['-i',str(clip)]
    if len(clips)==1:
        shutil.copyfile(clips[0],base)
    elif cross>0:
        filters=[]; current='0:v'; offset=0
        for i in range(1,len(clips)):
            offset+=lengths[i-1]
            label=f'x{i}'
            filters.append(f'[{current}][{i}:v]xfade=transition=fade:duration={cross:.6f}:offset={offset:.6f}[{label}]')
            current=label
        run([ffmpeg(),'-y','-v','error','-filter_complex_threads','1',*inputs,'-filter_complex',';'.join(filters),
             '-map',f'[{current}]','-t',f'{total:.6f}','-an','-c:v','libx264','-threads','2','-preset','ultrafast',base])
    else:
        (folder/'video-list.txt').write_text('\n'.join(f"file '{p.name}'" for p in clips),encoding='utf-8')
        run([ffmpeg(),'-y','-v','error','-f','concat','-safe','1','-i','video-list.txt','-c','copy',base.name],cwd=folder)
    (folder/'legendas.ass').write_text(make_ass(plan,cues,timeline,total,w,h),encoding='utf-8')
    progress('Aplicando legendas, título, música e acabamento…')
    inputs=['-i',base.name,'-i',str(audio)]
    af=f'atrim=duration={total},afade=t=in:d={fade},afade=t=out:st={total-fade}:d={fade}'
    if music:
        inputs+=['-stream_loop','-1','-i',str(Path(music).resolve())]
        audio_filter=f'[1:a]asplit=2[voice][control];[2:a]volume={float(music_volume)}[music];[music][control]sidechaincompress=threshold=0.03:ratio=8[duck];[voice][duck]amix=inputs=2:duration=first:normalize=0,{af}[a]'
    else:
        audio_filter=f'[1:a]{af}[a]'
    vf=f"subtitles=legendas.ass,fade=t=in:d={fade},fade=t=out:st={total-fade}:d={fade}"
    output=folder/('previa.mp4' if preview else 'video.mp4'); partial=output.with_suffix('.partial.mp4')
    run([ffmpeg(),'-y','-v','error','-filter_complex_threads','1',*inputs,'-filter_complex',
         f'[0:v]{vf}[v];'+audio_filter,'-map','[v]','-map','[a]','-t',f'{total:.6f}',
         '-c:v','libx264','-threads','2','-preset','veryfast','-crf','21','-pix_fmt','yuv420p',
         '-c:a','aac','-b:a','192k','-movflags','+faststart',partial.name],cwd=folder)
    partial.replace(output)
    (folder/'fontes.json').write_text(json.dumps([{'scene':i+1,'kind':s['kind'],'source':s.get('source',''),
          'query':s.get('query','')} for i,s in enumerate(plan['scenes'])],ensure_ascii=False,indent=2),encoding='utf-8')
    return {'video':str(output),'audio':str(audio),'srt':str(folder/'legendas.srt'),
            'seconds':total,'target_seconds':plan['target_seconds'],
            'warning':'Com áudio importado, a troca das cenas é proporcional ao roteiro; revise a prévia.' if imported else ''}

