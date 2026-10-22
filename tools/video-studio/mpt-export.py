"""Export a Studio project as an official MoneyPrinterTurbo batch manifest."""
import json
from pathlib import Path
import sys
from planner import validate_plan

if __name__=='__main__':
    project=Path(sys.argv[1]).resolve()
    plan=validate_plan(json.loads(project.read_text(encoding='utf-8')))
    assets=[]
    for s in plan['scenes']:
        p=Path(s['asset'])
        if not p.is_absolute(): p=project.parent/p
        if not p.is_file(): raise ValueError('Imagem ausente: '+str(p))
        assets.append({'provider':'local','url':str(p.resolve())})
    manifest=[{'video_subject':plan['title'],'video_script':'\n\n'.join(s['text'] for s in plan['scenes']),
       'video_terms':[s['query'] for s in plan['scenes'] if s['query']],
       'video_source':'local','video_materials':assets,'video_concat_mode':'sequential',
       'voice_name':'pt-BR-FranciscaNeural','video_language':'pt-BR',
       'subtitle_enabled':True,'subtitle_position':'custom','custom_position':72,
       'text_fore_color':'#FFD400','stroke_color':'#000000','stroke_width':5,'bgm_type':''}]
    destination=project.parent/'moneyprinter-batch.json'
    destination.write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
    print(destination)
