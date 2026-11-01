"""Add browser protections supported by GitHub Pages without changing hosting.

Run last, after every HTML generator. Inline scripts are authorized by their exact
SHA-256 digest; arbitrary inline scripts are not allowed. HTTP-only directives
(HSTS, frame-ancestors, nosniff) require a future host/proxy configuration.
"""
from pathlib import Path
from html.parser import HTMLParser
from html import escape, unescape
import base64
import hashlib
import re
import sys

def digest(text):
    return "'sha256-"+base64.b64encode(hashlib.sha256(text.encode()).digest()).decode()+"'"

# Existing image fallbacks and reload buttons are fixed event handlers. Authorize
# their exact bodies rather than enabling arbitrary inline event attributes.
EVENT_HASHES={digest('location.reload()'),digest('window.location.reload()')}
for script in [p for directory in ('js','admin-v2') for p in (Path(__file__).resolve().parent.parent/directory).rglob('*.js')]:
    for handler in re.findall(r'\bon(?:error|click|load)="([^"]+)"',script.read_text()):
        EVENT_HASHES.add(digest(unescape(handler.replace("\\'", "'").replace('\\"','"'))))

class InlineScripts(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.inline=False
        self.body=[]
        self.hashes=set()
    def handle_starttag(self,tag,attrs):
        for name,value in attrs:
            if name.startswith('on') and value:self.hashes.add(digest(value))
        if tag=='script':
            attrs=dict(attrs)
            self.inline=not attrs.get('src') and attrs.get('type','').lower() not in ('application/ld+json','application/json')
            self.body=[]
    def handle_data(self,text):
        if self.inline:self.body.append(text)
    def handle_endtag(self,tag):
        if tag=='script' and self.inline:
            text=''.join(self.body)
            if text.strip():self.hashes.add(digest(text))
            self.inline=False

def harden_html(text):
    text=re.sub(r'<meta\b[^>]*\bdata-archive-security="[^"]*"[^>]*>\s*','',text,flags=re.I)
    parser=InlineScripts();parser.feed(text)
    policy="; ".join([
        "default-src 'self'",
        "script-src 'self' 'unsafe-hashes' https://cdn.jsdelivr.net https://challenges.cloudflare.com "+' '.join(sorted(parser.hashes|EVENT_HASHES)),
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
        "font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
        "img-src 'self' data: blob: https:",
        "media-src 'self' blob: https:",
        "connect-src 'self' https: wss:",
        "frame-src 'self' https://challenges.cloudflare.com https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://docs.google.com https://drive.google.com",
        "worker-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "upgrade-insecure-requests",
    ])
    metas='<meta data-archive-security="csp" http-equiv="Content-Security-Policy" content="'+escape(policy,quote=True)+'">\n<meta data-archive-security="referrer" name="referrer" content="strict-origin-when-cross-origin">\n'
    # Keep UTF-8 declaration first; apply CSP before all executable content.
    charset=re.search(r'<meta\s+charset=[^>]+>',text,re.I)
    if charset:
        return text[:charset.end()]+'\n'+metas+text[charset.end():]
    return re.sub(r'(<head\b[^>]*>)',lambda m:m[1]+'\n'+metas,text,count=1,flags=re.I)

def harden_tree(root):
    files=list(Path(root).rglob('*.html'))
    for path in files:path.write_text(harden_html(path.read_text(encoding='utf-8')),encoding='utf-8')
    print(f'Browser security policy applied to {len(files)} HTML pages')

if __name__=='__main__':harden_tree(sys.argv[1])
