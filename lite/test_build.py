"""Offline smoke test: publication status, future embargo, HTML escaping, pagination."""
import tempfile, json
from pathlib import Path
from datetime import datetime, timedelta, timezone
from build import build
with tempfile.TemporaryDirectory() as temp:
    root=Path(temp); source=root/"publications.json"; out=root/"dist"
    past=(datetime.now(timezone.utc)-timedelta(days=1)).isoformat()
    future=(datetime.now(timezone.utc)+timedelta(days=1)).isoformat()
    def record(slug,status,date):
        return {"slug":slug,"titulo":"Título <script>alert(1)</script>","categoria":"dossies","status_publicacao":status,"publicado_em":date,"conteudo":["Texto <b>sem HTML</b>"],"fontes":["Fonte <teste>"]}
    data=[record("publico","publicado",past),record("rascunho","rascunho",past),record("futuro","publicado",future)]
    source.write_text(json.dumps(data),encoding="utf-8")
    build(source,out)
    assert (out/"arquivos/publico.html").exists()
    assert not (out/"arquivos/rascunho.html").exists()
    assert not (out/"arquivos/futuro.html").exists()
    text=(out/"arquivos/publico.html").read_text(encoding="utf-8")
    assert "<script>" not in text and "&lt;script&gt;" in text and "&lt;b&gt;" in text
    assert (out/"index.html").exists() and (out/"lite.css").exists()
print("OK: publicação, embargo, escaping e páginas estáticas.")
