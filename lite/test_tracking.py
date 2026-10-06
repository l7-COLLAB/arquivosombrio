import tempfile,json
from pathlib import Path
from build import build,tracking_header,tracking_timeline
item={"slug":"acompanhamento-teste","titulo":"Teste de acompanhamento","categoria":"garimpo","status_publicacao":"publicado","publicado_em":"2026-10-01T12:00:00Z","conteudo":"Texto documental para testes.","acompanhamento_status":"ativo","case_updates":[{"id":"1","update_date":"2026-10-02","title":"Anterior","body":"Texto anterior","information_type":"hipotese","sources":[{"titulo":"Fonte","url":"javascript:alert(1)"}],"position":0},{"id":"2","update_date":"2026-10-06","title":"Mais recente","body":"<script>inseguro</script>","information_type":"fato_confirmado","sources":[{"titulo":"Fonte oficial","url":"https://example.org"}],"position":0}]}
with tempfile.TemporaryDirectory() as folder:
    src=Path(folder)/'input.json';out=Path(folder)/'out';src.write_text(json.dumps([item]),encoding='utf-8');build(src,out)
    page=(out/'arquivos/acompanhamento-teste.html').read_text()
    assert 'EM ACOMPANHAMENTO' in page and 'caso em desenvolvimento' in page
    assert page.index('Mais recente')<page.index('Anterior')
    assert 'Publicado em 2026-10-01' in page and 'Atualizado em 2026-10-06' in page
    assert 'href="javascript:' not in page and '<script>inseguro' not in page
    assert 'Fontes desta atualização' in page
    assert 'EM ACOMPANHAMENTO' in (out/'garimpo.html').read_text()
    assert 'EM ACOMPANHAMENTO' in (out/'pesquisa.html').read_text()
    item['acompanhamento_status']='encerrado';item['acompanhamento_encerrado_em']='2026-10-06T15:00:00Z'
    assert 'EM ACOMPANHAMENTO' not in tracking_header(item)
    assert 'Acompanhamento encerrado' in tracking_header(item)
    assert 'Mais recente' in tracking_timeline(item)
print('OK: Lite, selo, datas, fontes, escaping, busca e encerramento com histórico.')
