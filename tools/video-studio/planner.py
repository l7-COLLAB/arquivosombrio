"""Convert a brief to an editable, validated storyboard. No implicit paid calls."""
import json
import math
import re
import requests

SYSTEM = '''Você prepara vídeos documentais em português brasileiro. Transforme o pedido em JSON puro.
Não invente fatos, citações ou documentos. Use apenas os fatos do texto recebido; não abra links.
Se o texto só fornecer um link e nenhum fato, peça o conteúdo no campo warnings.
Separe rigorosamente narração de instruções de edição. Nunca narre horários, configurações ou prompts.
Estrutura: {"title":"", "black_white":true, "target_seconds":60,
"fade_seconds":1, "warnings":[], "scenes":[{"text":"narração", "query":"termos em inglês para banco de imagens",
"visual":"descrição", "kind":"illustrative", "image_prompt":"prompt ilustrativo sem texto"}]}.
Entre 1 e 30 cenas. Narração para 60s deve ter aproximadamente 125 a 140 palavras, incluindo CTA.
kind sempre illustrative: bancos não são registros históricos do caso. Não invente URLs de imagens.
Não transforme acusações em fatos. Imagens geradas devem ser identificadas como ilustração.
Preserve o pedido de cor e duração. A duração real será medida após síntese de voz.'''


def validate_plan(data):
    if not isinstance(data, dict):
        raise ValueError('O plano deve ser um objeto JSON.')
    scenes = data.get('scenes')
    if not isinstance(scenes, list) or not 1 <= len(scenes) <= 30:
        raise ValueError('Use entre 1 e 30 cenas.')
    clean = []
    for scene in scenes:
        if not isinstance(scene, dict):
            raise ValueError('Cena inválida.')
        text = str(scene.get('text', '')).strip()
        if not text or len(text) > 3000:
            raise ValueError('Cada cena precisa de narração, com até 3.000 caracteres.')
        clean.append({
            'text': text, 'query': str(scene.get('query', '')).strip()[:250],
            'visual': str(scene.get('visual', ''))[:1500],
            'kind': scene.get('kind') if scene.get('kind') in ('illustrative', 'real') else 'illustrative',
            'image_prompt': str(scene.get('image_prompt', ''))[:2000],
            'asset': str(scene.get('asset', '')), 'source': str(scene.get('source', ''))[:1000],
        })
    seconds = float(data.get('target_seconds', 60))
    fade = float(data.get('fade_seconds', 1))
    if not math.isfinite(seconds) or not 5 <= seconds <= 1800:
        raise ValueError('Duração desejada deve estar entre 5 e 1800 segundos.')
    if not math.isfinite(fade) or not 0 <= fade <= 3:
        raise ValueError('Fade deve estar entre 0 e 3 segundos.')
    warnings = data.get('warnings', [])
    return {'title': str(data.get('title', 'Arquivo Sombrio'))[:150],
            'black_white': bool(data.get('black_white', True)), 'target_seconds': seconds,
            'fade_seconds': fade, 'warnings': [str(w)[:1000] for w in warnings] if isinstance(warnings, list) else [],
            'scenes': clean}


def interpret(brief, base_url, api_key, model):
    if not brief.strip() or len(brief) > 50000:
        raise ValueError('Cole instruções com até 50 mil caracteres.')
    if not base_url.startswith(('https://', 'http://localhost:', 'http://127.0.0.1:')):
        raise ValueError('A API deve usar HTTPS ou um servidor local.')
    response = requests.post(base_url.rstrip('/') + '/chat/completions',
        headers={'Authorization': 'Bearer ' + api_key}, timeout=(10, 180),
        json={'model': model, 'messages': [{'role': 'system', 'content': SYSTEM},
              {'role': 'user', 'content': brief}], 'temperature': 0.2})
    if not response.ok:
        raise ValueError(f'API de planejamento retornou HTTP {response.status_code}. Confira modelo, saldo e chave.')
    content = response.json()['choices'][0]['message']['content'].strip()
    content = re.sub(r'^```(?:json)?\s*|\s*```$', '', content)
    return validate_plan(json.loads(content))


def manual_plan(script, title, seconds=60):
    # Explicitly a narration-only mode: don't silently read a production brief aloud.
    if not script.strip():
        raise ValueError('Cole somente o texto que deve ser narrado.')
    paragraphs = [p.strip() for p in re.split(r'\n\s*\n', script) if p.strip()]
    if len(paragraphs) == 1:
        sentences = re.split(r'(?<=[.!?])\s+', script.strip())
        paragraphs = [' '.join(sentences[i:i+2]) for i in range(0, len(sentences), 2)]
    return validate_plan({'title': title, 'target_seconds': seconds,
                          'scenes': [{'text': p, 'query': '', 'kind': 'illustrative'} for p in paragraphs]})
