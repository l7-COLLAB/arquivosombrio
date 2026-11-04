#!/usr/bin/env python3
"""Homologação visual e funcional da Perícia Forense sem dados reais."""
import contextlib
import http.server
import json
import os
from pathlib import Path
import socketserver
import threading
import urllib.error
import urllib.request

import fitz
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "qa-pericia-artifacts"
OUT.mkdir(exist_ok=True)
PDF = ROOT / "assets/apostila-pericia-forense.pdf"
EXPECTED_CORRECT = [0, 2, 1, 3, 0, 2, 1, 3, 0]


class NoLogs(http.server.SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        return


def inspect_pdf():
    doc = fitz.open(PDF)
    assert doc.page_count == 7, f"PDF deve ter 7 páginas: {doc.page_count}"
    cover = doc[0].get_text("text")
    assert "Perícia Forense" in cover and "exercícios" in cover, "Acentuação da capa do PDF incorreta"
    stats = []
    for i, page in enumerate(doc):
        txt = page.get_text("text")
        words = page.get_text("words")
        assert len(txt.strip()) > 85, f"Página {i+1} sem conteúdo relevante"
        # Títulos da página e rodapé pertencem à área segura, longe das bordas.
        offenders = [(w[4], tuple(round(c, 1) for c in w[:4])) for w in words
                     if w[0] < 0 or w[2] > page.rect.width + 2 or w[1] < 0 or w[3] > page.rect.height + 2]
        assert not offenders, f"Texto fora da página {i+1}: {offenders[:6]}"
        stats.append({"pagina": i+1, "palavras": len(words), "caracteres": len(txt),
                      "y_max": round(max((w[3] for w in words),default=0))})
        if i in (0, 2, 6):
            pix = page.get_pixmap(matrix=fitz.Matrix(1.5,1.5), alpha=False)
            pix.save(str(OUT / f"pdf-pagina-{i+1}.png"))
    assert "ABO" in "".join(p.get_text() for p in doc), "Falta tema ABO"
    print("PDF:", json.dumps(stats, ensure_ascii=False))
    doc.close()


def wait_links(page):
    page.wait_for_load_state("networkidle")
    return page.locator("a[href]").count()


def check_html(base_url, browser, width, height, label, is_mobile):
    context = browser.new_context(viewport={"width":width,"height":height},
                                  device_scale_factor=1, is_mobile=is_mobile,
                                  has_touch=is_mobile)
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("response", lambda response: errors.append(f"HTTP {response.status}: {response.url}")
            if response.status >= 400 and response.url.startswith(base_url) else None)

    guide = page.goto(base_url + "/guia-pericia.html", wait_until="networkidle")
    assert guide.status == 200
    assert page.get_by_role("heading", name="Fundamentos para os exercícios de Perícia Forense").count() == 1
    assert page.get_by_role("link", name="Baixar apostila em PDF").count() == 1
    pdf_resp = context.request.get(base_url + "/assets/apostila-pericia-forense.pdf")
    assert pdf_resp.status == 200 and pdf_resp.body()[:8] == b"%PDF-1.4"
    assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 2"), "Apostila transborda na largura"
    page.screenshot(path=str(OUT / f"{label}-apostila.png"), full_page=True)

    response = page.goto(base_url + "/laboratorio-forense.html", wait_until="networkidle")
    assert response.status == 200
    assert page.locator("#apostila").count() == 1
    assert page.locator("#trilha").count() == 1
    assert page.locator("#padroes").count() == 1
    positions = page.evaluate("""() => ['apostila','trilha','padroes','tipagem'].map(id=>document.getElementById(id).offsetTop)""")
    assert positions == sorted(positions), "Estudo deve vir antes das atividades"
    assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 2"), "Laboratório transborda na largura"
    page.locator("#apostila").screenshot(path=str(OUT / f"{label}-estudo.png"))
    page.locator("#trilha").scroll_into_view_if_needed()
    page.locator("#trilha").screenshot(path=str(OUT / f"{label}-questao.png"))

    # A consulta preserva o progresso e aponta sempre ao capítulo correto.
    hrefs = ["metodo","manchas","manchas","comparacao","comparacao","hemacias","hipoteses","custodia","hipoteses"]
    for i, expected in enumerate(EXPECTED_CORRECT):
        assert page.locator("#quest-study-link").get_attribute("href") == "guia-pericia.html#" + hrefs[i]
        if i == 0:
            page.locator("#quest-hint").click()
            assert page.locator("#quest-hint-text").is_visible()
        # Primeiro erro intencional: possibilita validar revisão ao finalizar.
        choice = (expected+1)%4 if i==0 else expected
        page.locator(f'#quest-options input[value="{choice}"]').check()
        page.locator("#quest-answer").click()
        assert page.locator("#quest-feedback").is_visible()
        assert page.locator("#quest-next").is_visible()
        if i == 2:
            assert "Selo de Observação" in page.locator("#quest-feedback").inner_text()
        if i == 5:
            assert "Selo de Comparação" in page.locator("#quest-feedback").inner_text()
        if i == 3:
            page.reload(wait_until="networkidle")
            assert page.locator("#quest-next").is_visible(), "Respostas não persistiram"
        page.locator("#quest-next").click()
    assert page.locator("#quest-finish").is_visible()
    assert "80 pontos" in page.locator("#quest-final-score").inner_text()
    page.locator("#quest-review-toggle").click()
    assert page.locator("#quest-review-panel").is_visible()
    assert page.locator("#quest-review-list li").count() == 1
    page.locator("#quest-finish").screenshot(path=str(OUT / f"{label}-resultado.png"))
    # Voltar para o PDF (abre em outra aba) não é condição de dependência para continuar.
    page.on("dialog", lambda dialog: dialog.accept())
    page.locator("#quest-restart").click()
    assert "0 / 9" in page.locator("#quest-counter").inner_text()

    pericia = page.goto(base_url + "/pericia.html", wait_until="domcontentloaded")
    assert pericia.status == 200
    assert page.locator(".forensic-exercises-link").count() == 0
    assert page.locator(".forensic-interactive-card").count() == 0
    assert page.locator('a[href="laboratorio-forense.html"]').count() == 0
    assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 2"), "Listagem de perícia transborda na largura"
    assert not errors, "Erros de console ou rede: " + repr(errors)
    context.close()
    return {"perfil":label,"viewport":f"{width}x{height}","questoes":9,"resultado":80,"capturas":4}


def check_production():
    root = os.environ.get("PUBLIC_BASE", "https://arquivosombrio.net.br")
    checks = [
      ("/guia-pericia.html", "Fundamentos para os exercícios de Perícia Forense"),
      ("/laboratorio-forense.html", 'id="apostila"'),
      ("/assets/apostila-pericia-forense.pdf", "%PDF-1.4"),
      ("/pericia.html", "EXERCÍCIOS INTERATIVOS")
    ]
    out = []
    for path, token in checks:
        url = root+path
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent":"ArquivoSombrio-QA/1.0"}),timeout=24) as r:
                body = r.read()
                decoded = body.decode("utf-8",errors="ignore")
                if path.endswith(".pdf"):
                    try:
                        remote_pdf = fitz.open(stream=body, filetype="pdf")
                        cover = remote_pdf[0].get_text("text")
                        valid = remote_pdf.page_count == 7 and "Perícia Forense" in cover and "exercícios" in cover
                        remote_pdf.close()
                    except Exception:
                        valid = False
                else:
                    valid = token not in decoded if path == "/pericia.html" else token in decoded
                out.append({"url":url, "status":r.status, "bytes":len(body),
                            "content_type":r.headers.get("Content-Type"),"conteudo_confere":valid})
        except Exception as e:
            out.append({"url":url,"erro":str(e)})
    (OUT / "producao.json").write_text(json.dumps(out,indent=2,ensure_ascii=False), encoding="utf-8")
    print("PRODUÇÃO:",json.dumps(out,ensure_ascii=False))
    return all(a.get("status")==200 and a.get("conteudo_confere") for a in out)


def main():
    inspect_pdf()
    class ReusableServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
        daemon_threads = True
        allow_reuse_address = True
    handler=lambda *args,**kwargs: NoLogs(*args,directory=str(ROOT),**kwargs)
    httpd = ReusableServer(("127.0.0.1",0), handler)
    threading.Thread(target=httpd.serve_forever,daemon=True).start()
    base_url=f"http://127.0.0.1:{httpd.server_port}"
    reports=[]
    with sync_playwright() as pw:
        chrome_path = os.environ.get("CHROME_PATH") or None
        browser = pw.chromium.launch(headless=True,executable_path=chrome_path, args=["--no-sandbox"])
        try:
            reports.append(check_html(base_url,browser,1365,900,"desktop",False))
            reports.append(check_html(base_url,browser,390,844,"mobile",True))
        finally:
            browser.close()
    httpd.shutdown()
    (OUT / "homologacao.json").write_text(json.dumps(reports,ensure_ascii=False,indent=2),encoding="utf-8")
    ok=check_production()
    print("BROWSER_QA_OK",json.dumps(reports,ensure_ascii=False))
    print("PUBLIC_DOMAIN_OK" if ok else "PUBLIC_DOMAIN_UNVERIFIED")
    if os.environ.get("REQUIRE_PRODUCTION")=="1" and not ok: raise AssertionError("Domínio público não validado")


if __name__=="__main__":
    main()
