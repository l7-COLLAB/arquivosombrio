import json,math,pathlib,subprocess,wave,struct
root=pathlib.Path('.')
segments=[(0,5),(1,5),(2,7),(3,3)]
files=[]
for i,seconds in segments:
    source=f'voice-{i}.wav'
    probe=json.loads(subprocess.check_output(['ffprobe','-v','quiet','-show_format','-of','json',source]))
    length=float(probe['format']['duration'])
    speed=max(1.0,length/(seconds-.3))
    if speed>1.6: raise RuntimeError(f'Narração extensa no segmento {i}: {length}')
    target=f'fit-{i}.wav'
    subprocess.run(['ffmpeg','-y','-v','error','-i',source,'-af',f'atempo={speed:.6f},loudnorm=I=-18:TP=-2:LRA=7,apad,atrim=duration={seconds},afade=t=out:st={seconds-.12}:d=0.12','-ar','48000','-ac','1',target],check=True)
    files.append(f"file '{target}'")
pathlib.Path('concat.txt').write_text('\n'.join(files))
subprocess.run(['ffmpeg','-y','-v','error','-f','concat','-safe','0','-i','concat.txt','-c:a','pcm_s16le','narration.wav'],check=True)
