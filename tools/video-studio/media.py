"""Pexels/Pixabay photo search and optional OpenAI-compatible image generation."""
import base64
import hashlib
import io
from pathlib import Path
import requests
from PIL import Image, ImageOps


def search_photos(provider, key, query):
    if not key.strip() or not query.strip():
        raise ValueError('Informe uma chave e termos de busca para a cena.')
    if provider == 'Pexels':
        r = requests.get('https://api.pexels.com/v1/search', headers={'Authorization': key},
                         params={'query': query, 'per_page': 8, 'orientation': 'portrait'}, timeout=(10, 40))
        if not r.ok:
            raise ValueError(f'Pexels retornou HTTP {r.status_code}.')
        return [{'url': p['src']['large2x'], 'preview': p['src']['medium'], 'source': p['url'],
                 'credit': p['photographer'], 'provider': provider} for p in r.json().get('photos', [])]
    r = requests.get('https://pixabay.com/api/', params={'key': key, 'q': query,
                     'image_type': 'photo', 'safesearch': 'true', 'per_page': 8}, timeout=(10, 40))
    if not r.ok:
        raise ValueError(f'Pixabay retornou HTTP {r.status_code}.')
    return [{'url': p['largeImageURL'], 'preview': p['webformatURL'], 'source': p['pageURL'],
             'credit': p['user'], 'provider': provider} for p in r.json().get('hits', [])]


def save_image_bytes(data, destination):
    if len(data) > 25 * 1024 * 1024:
        raise ValueError('Imagem excede 25 MB.')
    with Image.open(io.BytesIO(data)) as im:
        if im.width * im.height > 40_000_000:
            raise ValueError('Imagem grande demais.')
        im = ImageOps.exif_transpose(im).convert('RGB')
        im.thumbnail((2560, 2560))
        im.save(destination, 'JPEG', quality=94)
    return str(Path(destination).resolve())


def download_photo(item, folder):
    url = item['url']
    if not url.startswith('https://'):
        raise ValueError('A imagem deve usar HTTPS.')
    with requests.get(url, timeout=(10, 60), stream=True) as r:
        r.raise_for_status()
        data = bytearray()
        for chunk in r.iter_content(65536):
            data.extend(chunk)
            if len(data) > 25 * 1024 * 1024:
                raise ValueError('Imagem excede 25 MB.')
    path = Path(folder) / (hashlib.sha256(data).hexdigest()[:20] + '.jpg')
    return save_image_bytes(bytes(data), path)


def generate_image(prompt, base_url, key, model, destination):
    if not base_url.startswith(('https://', 'http://127.0.0.1:', 'http://localhost:')):
        raise ValueError('URL de API inválida.')
    r = requests.post(base_url.rstrip('/') + '/images/generations',
        headers={'Authorization': 'Bearer ' + key}, timeout=(10, 240),
        json={'model': model, 'prompt': prompt, 'n': 1, 'size': '1024x1536'})
    if not r.ok:
        raise ValueError(f'API de imagens retornou HTTP {r.status_code}.')
    item = r.json()['data'][0]
    if item.get('b64_json'):
        return save_image_bytes(base64.b64decode(item['b64_json']), destination)
    path = download_photo({'url': item['url']}, Path(destination).parent)
    return path
