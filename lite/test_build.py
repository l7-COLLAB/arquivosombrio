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
    assert (out/"lite.js").exists() and (out/"pesquisa.html").exists()
    assert "data-lite-setting" in text and "save-reading" in text
    assert "publico.html" in (out/"pesquisa.html").read_text(encoding="utf-8")
    assert "rascunho.html" not in (out/"pesquisa.html").read_text(encoding="utf-8")
    assert "futuro.html" not in (out/"pesquisa.html").read_text(encoding="utf-8")
print("OK: publicação, embargo, escaping e páginas estáticas.")

with tempfile.TemporaryDirectory() as temp:
    root=Path(temp);source=root/"input.json";out=root/"dist"
    past=(datetime.now(timezone.utc)-timedelta(days=1)).isoformat()
    novel=[{"slug":"livro-capitulo-"+str(i),"titulo":"Livro · Capítulo "+str(i),"categoria":"biblioteca","status_publicacao":"publicado","publicado_em":past,"conteudo":"SEÇÃO DO LIVRO\n\nTexto de teste.","obra_id":"livro1","obra_titulo":"Livro","numero_capitulo":i} for i in range(1,4)]
    source.write_text(json.dumps(novel),encoding="utf-8")
    build(source,out)
    chapter=(out/"arquivos/livro-capitulo-2.html").read_text(encoding="utf-8")
    assert "← Anterior" in chapter and "Próximo →" in chapter
    assert "Sumário" in chapter and "sec-1" in chapter
    assert "Arquivos relacionados" not in chapter
    assert "Livro" in (out/"biblioteca.html").read_text(encoding="utf-8")
print("OK: pesquisa, sumário, navegação e filtros de publicação.")
