"""Arquivo Sombrio Studio — local UI, no keys in project exports."""
import hashlib
import io
import json
from pathlib import Path
import shutil
import time
import uuid
import zipfile
import streamlit as st
from engine import render, prepare_audio, ffmpeg
from media import search_photos, download_photo, generate_image, save_image_bytes
from planner import interpret, manual_plan, validate_plan

ROOT=Path(__file__).resolve().parent
PROJECTS=ROOT/'projects'; PROJECTS.mkdir(exist_ok=True)
st.set_page_config(page_title='Arquivo Sombrio Studio',page_icon='🎬',layout='wide')
st.markdown('''<style>.stApp{background:#101317} h1,h2,h3{color:#dfc79c}
div.stButton>button[kind=primary]{background:#a07b44;border:0} </style>''',unsafe_allow_html=True)
st.title('Arquivo Sombrio · Studio')
st.caption('Do roteiro ao MP4 • Projetos locais • Cenas que você pode revisar e substituir')

if 'project_id' not in st.session_state:
    st.session_state.project_id=uuid.uuid4().hex
folder=PROJECTS/st.session_state.project_id; folder.mkdir(exist_ok=True)
assets=folder/'assets'; assets.mkdir(exist_ok=True)


def save_plan():
    plan=st.session_state.plan
    (folder/'projeto.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')


def export_project():
    save_plan(); plan=json.loads(json.dumps(st.session_state.plan))
    data=io.BytesIO()
    with zipfile.ZipFile(data,'w',zipfile.ZIP_DEFLATED) as z:
        for i,s in enumerate(plan['scenes']):
            if s.get('asset') and Path(s['asset']).is_file():
                name=f'assets/cena-{i+1}.jpg'; z.write(s['asset'],name); s['asset']=name
        for name in ('imported_audio','imported_srt','music'):
            file=st.session_state.get(name)
            if file and Path(file).is_file():
                dest='imports/'+Path(file).name; z.write(file,dest); plan[name]=dest
        z.writestr('projeto.json',json.dumps(plan,ensure_ascii=False,indent=2))
    return data.getvalue()


def import_project(data):
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        if len(z.infolist())>150 or sum(i.file_size for i in z.infolist())>500_000_000:
            raise ValueError('Projeto grande demais.')
        raw=json.loads(z.read('projeto.json'))
        plan=validate_plan(raw)
        for i,s in enumerate(plan['scenes']):
            name=s.get('asset','')
            if name:
                dest=assets/f'import-{i}.jpg'
                save_image_bytes(z.read(name),dest); s['asset']=str(dest.resolve())
        for name in ('imported_audio','imported_srt','music'):
            entry=raw.get(name)
            if entry:
                suffix=Path(entry).suffix.lower()
                if suffix not in ('.wav','.mp3','.m4a','.flac','.ogg','.aac','.srt'):
                    raise ValueError('Arquivo de projeto não suportado.')
                dest=folder/(name+suffix); dest.write_bytes(z.read(entry))
                st.session_state[name]=str(dest.resolve())
        st.session_state.plan=plan
    save_plan()

with st.sidebar:
    st.header('Serviços e voz')
    st.caption('Chaves ficam apenas nesta sessão. Projetos e ZIPs não incluem credenciais.')
    base=st.text_input('API de planejamento · URL base',value='https://api.openai.com/v1')
    key=st.text_input('Chave da API de planejamento',type='password')
    model=st.text_input('Modelo de planejamento',placeholder='Nome exato do seu provedor')
    st.caption('Aceita API compatível com OpenAI e Ollama local. Usar Claude exige um gateway compatível; assinatura de chat não inclui API.')
    provider=st.selectbox('Banco de fotografias',['Pexels','Pixabay'])
    photo_key=st.text_input('Chave do banco de imagens',type='password')
    st.markdown('[Pexels API](https://www.pexels.com/api/) · [Pixabay API](https://pixabay.com/api/docs/)')
    st.caption('Imagens de banco são ilustrativas. A busca por palavras não comprova pessoas, locais ou documentos de um caso.')
    voice=st.selectbox('Voz online',['pt-BR-FranciscaNeural','pt-BR-AntonioNeural'])
    st.caption('A voz usa Edge TTS via internet; disponibilidade depende do serviço. Também pode importar seu MP3 do Kokoro.')
    with st.expander('Imagens geradas por IA · opcional'):
        image_base=st.text_input('URL base da API de imagens',value='https://api.openai.com/v1')
        image_key=st.text_input('Chave de imagens',type='password')
        image_model=st.text_input('Modelo de imagem',placeholder='Modelo com /images/generations')
        st.caption('A API pode cobrar por imagem. Cada geração exige um clique explícito.')
    st.divider()
    available=sorted(PROJECTS.glob('*/projeto.json'),key=lambda p:p.stat().st_mtime,reverse=True)
    mapping={}
    for p in available:
        try:
            saved=json.loads(p.read_text(encoding='utf-8'))
            mapping[f'{saved["title"]} · {p.parent.name[:6]}']=p
        except (ValueError,KeyError):
            pass
    chosen=st.selectbox('Projetos salvos',['Selecione…',*mapping])
    if st.button('Abrir projeto') and chosen in mapping:
        p=mapping[chosen]; st.session_state.project_id=p.parent.name
        st.session_state.plan=validate_plan(json.loads(p.read_text(encoding='utf-8')))
        for k in ('result','imported_audio','imported_srt','music'):
            st.session_state.pop(k,None)
        for k in ('imported_audio','imported_srt','music'):
            for file in p.parent.glob(k+'.*'):
                st.session_state[k]=str(file.resolve())
        st.rerun()
    imported_project=st.file_uploader('Importar projeto ZIP',type=['zip'])
    if st.button('Carregar ZIP') and imported_project:
        try:
            import_project(imported_project.getvalue()); st.rerun()
        except Exception as e:
            st.error(str(e))
    if st.button('Novo projeto'):
        for k in list(st.session_state.keys()):
            del st.session_state[k]
        st.rerun()

tab1,tab2,tab3=st.tabs(['1 · Pedido e roteiro','2 · Cenas e imagens','3 · Áudio e vídeo'])
with tab1:
    mode=st.radio('Como começar?',['Colar instruções completas · com API','Colar somente narração · sem API'],horizontal=True)
    brief=st.text_area('Cole o pedido ou a narração',height=250,placeholder='Cole aqui o pedido do Claude, com roteiro, duração e orientações visuais…')
    title=st.text_input('Nome do caso',value='Caso Escola Base')
    seconds=st.number_input('Duração desejada em segundos',5,1800,60)
    st.caption('A duração desejada orienta o planejamento. A exportação acompanha o áudio inteiro; confira o tempo medido antes de finalizar.')
    if st.button('Carregar exemplo · Escola Base'):
        st.session_state.plan=validate_plan(json.loads((ROOT/'examples'/'escola-base.json').read_text(encoding='utf-8')))
        st.session_state.scene_revision=st.session_state.get('scene_revision',0)+1
        st.session_state.pop('result',None)
        save_plan(); st.rerun()
    if st.button('Preparar cenas',type='primary'):
        try:
            with st.spinner('Preparando roteiro…'):
                if mode.startswith('Colar instruções'):
                    if not model:
                        raise ValueError('Informe o modelo da API na barra lateral, ou use o modo de narração sem API.')
                    plan=interpret(brief,base,key,model)
                else:
                    plan=manual_plan(brief,title,seconds)
                st.session_state.plan=plan; st.session_state.pop('result',None); save_plan()
            st.success('Roteiro preparado. Revise as cenas na próxima aba.')
        except Exception as e:
            st.error(str(e))
    if mode.startswith('Colar instruções'):
        st.caption('Atalho automático: usa a API de planejamento e o banco de fotografias configurados, com voz online. Gera uma prévia para revisão.')
        if st.button('Preparar e gerar automaticamente · prévia'):
            try:
                if not model or not photo_key:
                    raise ValueError('Configure modelo de planejamento e chave Pexels/Pixabay na barra lateral.')
                with st.status('Planejando e gerando prévia…',expanded=True) as status:
                    plan=interpret(brief,base,key,model)
                    st.session_state.plan=plan; save_plan()
                    used=set()
                    for i,scene in enumerate(plan['scenes']):
                        status.write(f'Buscando imagem da cena {i+1}…')
                        options=search_photos(provider,photo_key,scene['query'])
                        for item in options:
                            asset=download_photo(item,assets)
                            if asset not in used:
                                scene.update(asset=asset,source=item['source']+' | '+item['credit'],kind='illustrative')
                                used.add(asset); break
                        else:
                            save_plan()
                            raise ValueError(f'Cena {i+1} sem imagem única. O projeto foi salvo; complete na aba de cenas.')
                    save_plan()
                    st.session_state.result=render(plan,folder,voice=voice,preview=True,progress=status.write)
                    status.update(label='Prévia gerada. Abra a aba Áudio e vídeo.',state='complete')
            except Exception as e:
                st.error(str(e))
    if 'plan' in st.session_state:
        plan=st.session_state.plan
        plan['title']=st.text_input('Título fixo no vídeo',value=plan['title'],key='plan_title_'+st.session_state.project_id)
        plan['black_white']=st.checkbox('Fotografias em preto e branco',value=plan['black_white'])
        plan['fade_seconds']=st.slider('Fade de entrada e saída · segundos',0.,3.,float(plan['fade_seconds']),.25)
        for warning in plan.get('warnings',[]):
            st.warning(warning)
        st.write(f"{len(plan['scenes'])} cenas · {sum(len(s['text'].split()) for s in plan['scenes'])} palavras")
        if st.button('Salvar projeto'):
            save_plan(); st.success('Projeto salvo.')
        st.download_button('Baixar projeto editável ZIP',export_project(),file_name='projeto-arquivo-sombrio.zip')

with tab2:
    if 'plan' not in st.session_state:
        st.info('Prepare ou abra um projeto para editar as cenas.')
    else:
        plan=st.session_state.plan
        st.caption('Selecione imagens de banco, gere ilustrações ou importe fotos reais. Você pode trocar apenas a cena que precisar.')
        if st.button('Buscar e preencher cenas vazias automaticamente'):
            errors=[]; done=0
            with st.spinner('Buscando imagens de banco…'):
                used={s.get('asset') for s in plan['scenes'] if s.get('asset')}
                for i,s in enumerate(plan['scenes']):
                    if s.get('asset'):
                        continue
                    try:
                        candidates=search_photos(provider,photo_key,s['query'])
                        for item in candidates:
                            asset=download_photo(item,assets)
                            if asset not in used:
                                s.update(asset=asset,source=item['source']+' | '+item['credit'],kind='illustrative')
                                used.add(asset); done+=1; break
                        else:
                            errors.append(f'Cena {i+1}: não encontrou imagem única; importe ou procure outros termos.')
                    except Exception as e:
                        errors.append(f'Cena {i+1}: {e}')
                save_plan()
            st.success(f'{done} cenas preenchidas com imagens ilustrativas.')
            for error in errors:
                st.warning(error)
        for i,s in enumerate(plan['scenes']):
            tag=f'{st.session_state.project_id}_{st.session_state.get("scene_revision",0)}_{i}'
            with st.expander(f'Cena {i+1} · {s["text"][:85]}',expanded=i==0):
                left,right=st.columns([2,1])
                with left:
                    s['text']=st.text_area('Narração desta cena',s['text'],key='text_'+tag)
                    s['query']=st.text_input('Termos de busca',s['query'],key='query_'+tag)
                    s['visual']=st.text_input('Orientação visual',s['visual'],key='visual_'+tag)
                    kind=st.selectbox('Tipo de imagem',['Ilustrativa','Registro real verificado'],index=0 if s['kind']=='illustrative' else 1,key='kind_'+tag)
                    s['kind']='real' if kind.startswith('Registro') else 'illustrative'
                    s['source']=st.text_input('Fonte / crédito',s['source'],key='source_'+tag)
                    uploaded=st.file_uploader('Importar fotografia',type=['jpg','jpeg','png','webp'],key='upload_'+tag)
                    if uploaded and st.session_state.get('applied_'+tag) != hashlib.sha256(uploaded.getvalue()).hexdigest():
                        st.session_state['applied_'+tag]=hashlib.sha256(uploaded.getvalue()).hexdigest()
                        digest=hashlib.sha256(uploaded.getvalue()).hexdigest()[:20]
                        s['asset']=save_image_bytes(uploaded.getvalue(),assets/(digest+'.jpg'))
                    if st.button('Buscar opções',key='search_'+tag):
                        try:
                            st.session_state['candidates_'+tag]=search_photos(provider,photo_key,s['query'])
                        except Exception as e:
                            st.error(str(e))
                    candidates=st.session_state.get('candidates_'+tag,[])
                    for j,item in enumerate(candidates):
                        col1,col2=st.columns([1,3])
                        col1.image(item['preview'],width=120)
                        col2.caption(item['credit'])
                        if col2.button('Usar esta imagem',key=f'pick_{tag}_{j}'):
                            try:
                                s.update(asset=download_photo(item,assets),kind='illustrative',source=item['source']+' | '+item['credit'])
                                st.session_state.scene_revision=st.session_state.get('scene_revision',0)+1
                                save_plan(); st.rerun()
                            except Exception as e:
                                st.error(str(e))
                    with st.expander('Gerar imagem ilustrativa por API'):
                        s['image_prompt']=st.text_area('Prompt da imagem',s['image_prompt'],key='prompt_'+tag)
                        if st.button('Gerar imagem · pode consumir créditos',key='generate_'+tag):
                            try:
                                if not image_model or not s['image_prompt'].strip():
                                    raise ValueError('Informe modelo e prompt da imagem.')
                                with st.spinner('Gerando imagem…'):
                                    asset=generate_image(s['image_prompt'],image_base,image_key,image_model,assets/(uuid.uuid4().hex+'.jpg'))
                                s.update(asset=asset,kind='illustrative',source='Gerada por IA: '+image_model)
                                st.session_state.scene_revision=st.session_state.get('scene_revision',0)+1
                                save_plan(); st.rerun()
                            except Exception as e:
                                st.error(str(e))
                    a,b=st.columns(2)
                    if a.button('↑ Mover para cima',disabled=i==0,key='up_'+tag):
                        plan['scenes'][i-1],plan['scenes'][i]=plan['scenes'][i],plan['scenes'][i-1]
                        st.session_state.scene_revision=st.session_state.get('scene_revision',0)+1
                        save_plan(); st.rerun()
                    if b.button('Remover cena',disabled=len(plan['scenes'])==1,key='delete_'+tag):
                        plan['scenes'].pop(i)
                        st.session_state.scene_revision=st.session_state.get('scene_revision',0)+1
                        save_plan(); st.rerun()
                with right:
                    if Path(s.get('asset','')).is_file():
                        st.image(s['asset'],caption='Imagem selecionada',use_container_width=True)
                    else:
                        st.info('Imagem pendente')
        if st.button('Adicionar cena',disabled=len(plan['scenes'])>=30):
            plan['scenes'].append({'text':'Nova narração','query':'','visual':'','kind':'illustrative','source':'','image_prompt':'','asset':''})
            save_plan(); st.rerun()
        save_plan()

with tab3:
    if 'plan' not in st.session_state:
        st.info('Prepare ou abra um projeto primeiro.')
    else:
        st.subheader('Narração e trilha')
        audio_mode=st.radio('Origem da narração',['Gerar com a voz selecionada','Importar áudio'],horizontal=True)
        if audio_mode=='Importar áudio':
            imported=st.file_uploader('Áudio de narração · inclusive Kokoro',type=['mp3','wav','m4a','flac','ogg'])
            subtitles=st.file_uploader('SRT correspondente · opcional com Whisper instalado',type=['srt'])
            for upload,name in ((imported,'imported_audio'),(subtitles,'imported_srt')):
                if upload:
                    dest=folder/(name+Path(upload.name).suffix.lower()); dest.write_bytes(upload.getvalue())
                    st.session_state[name]=str(dest.resolve())
            st.caption('Sem SRT, a transcrição usa Whisper local e pode baixar um modelo na primeira execução.')
        music=st.file_uploader('Música de fundo opcional',type=['mp3','wav','m4a'])
        if music:
            dest=folder/('music'+Path(music.name).suffix.lower()); dest.write_bytes(music.getvalue())
            st.session_state.music=str(dest.resolve())
        include_music=st.checkbox('Usar música importada',value=bool(st.session_state.get('music')))
        volume=st.slider('Volume da música',0.,.5,.10,.01)
        transition=st.slider('Dissolução entre cenas · segundos',0.,1.,.35,.05)
        preview=st.checkbox('Prévia rápida · 360 × 640',value=True)
        st.caption('Desmarque a prévia para exportar em 1080 × 1920. As legendas são amarelas, com contorno preto e posição central inferior.')
        audiofile=st.session_state.get('imported_audio') if audio_mode=='Importar áudio' else None
        srtfile=st.session_state.get('imported_srt') if audio_mode=='Importar áudio' else None
        if st.button('Gerar apenas áudio e legendas'):
            try:
                if audio_mode=='Importar áudio' and not audiofile:
                    raise ValueError('Importe o áudio primeiro.')
                with st.status('Preparando áudio…',expanded=True) as status:
                    audio,lengths,cues=prepare_audio(validate_plan(st.session_state.plan),folder,voice,audiofile,srtfile,status.write)
                    status.update(label=f'Áudio pronto · {sum(lengths):.1f} segundos',state='complete')
                st.audio(audio)
                st.download_button('Baixar narração',Path(audio).read_bytes(),file_name='narracao.wav')
                st.download_button('Baixar SRT', (folder/'legendas.srt').read_bytes(),file_name='legendas.srt')
            except Exception as e:
                st.error(str(e))
        if st.button('GERAR VÍDEO MP4',type='primary'):
            try:
                if audio_mode=='Importar áudio' and not audiofile:
                    raise ValueError('Importe o áudio primeiro.')
                checked=validate_plan(st.session_state.plan); save_plan()
                with st.status('Gerando vídeo. Mantenha esta janela e o terminal abertos.',expanded=True) as status:
                    result=render(checked,folder,voice,audiofile,srtfile,
                        st.session_state.get('music') if include_music else None,volume,transition,preview,status.write)
                    st.session_state.result=result
                    status.update(label='MP4 gerado',state='complete')
            except Exception as e:
                st.error(str(e))
        result=st.session_state.get('result')
        if result and Path(result['video']).is_file():
            st.video(result['video'])
            st.success(f"Duração medida: {result['seconds']:.1f} s · meta: {result['target_seconds']:.0f} s")
            if abs(result['seconds']-result['target_seconds'])>3:
                st.warning('A narração ultrapassou ou ficou abaixo da meta. Edite o texto para ajustar; o vídeo preserva toda a fala.')
            if result.get('warning'):
                st.warning(result['warning'])
            for label,file,name in [('Baixar MP4',result['video'],Path(result['video']).name),('Baixar SRT',result['srt'],'legendas.srt'),('Baixar áudio',result['audio'],'narracao.wav')]:
                st.download_button(label,Path(file).read_bytes(),file_name=name)
            st.download_button('Baixar fontes das imagens',(folder/'fontes.json').read_bytes(),file_name='fontes.json')
