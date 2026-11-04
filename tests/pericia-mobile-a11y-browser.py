"""QA responsivo e acessibilidade dos dois módulos do Arquivo Sombrio.
Simulação de navegadores, não substitui teste em dispositivo físico ou leitor de tela.
"""
import http.server
import json
import os
from pathlib import Path
import socketserver
import threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "qa-pericia-mobile"
OUT.mkdir(exist_ok=True)


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        return


def viewport_ok(page, name):
    result = page.evaluate("""() => ({
      viewport: window.innerWidth,
      scroll: document.documentElement.scrollWidth,
      bodyScroll: document.body.scrollWidth
    })""")
    assert result["scroll"] <= result["viewport"] + 3, (name, result)
    assert result["bodyScroll"] <= result["viewport"] + 3, (name, result)


def buttons_ok(page, name):
    # Apenas controles ativos do módulo, não links decorativos.
    invalid = page.evaluate("""() => [...document.querySelectorAll('#atividade button')]
        .filter(e => !e.disabled && e.getClientRects().length)
        .map(e => {
          const b=e.getBoundingClientRect();
          return {text: e.getAttribute('aria-label') || e.textContent.trim(), w: b.width, h: b.height}
        })
        .filter(b => b.w < 44 || b.h < 44)""")
    assert not invalid, (name, invalid)


def mobile_run(browser, base, engine, width):
    label = f"{engine}-{width}"
    context = browser.new_context(viewport={"width":width,"height":844},
                                  device_scale_factor=1,
                                  is_mobile=True, has_touch=True)
    page = context.new_page()
    page.on("dialog", lambda dialog: dialog.accept())
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    response = page.goto(base + "/pericia-custodia.html", wait_until="networkidle")
    assert response.status == 200
    viewport_ok(page, label+"-custodia")
    buttons_ok(page,label+"-custodia")
    page.locator("#custodia-ordem").screenshot(path=str(OUT / (label+"-custodia-ordem.png")))
    assert page.locator("#custody-move-status").get_attribute("aria-live") == "polite"

    # Testa toque, reordenação e preservação do foco no mesmo registro.
    start = page.locator("#custody-events li").all_inner_texts()
    assert start[0].startswith("10h20"), (label,start)
    page.get_by_role("button", name="subir o registro 09h10").tap()
    assert "09h10" in page.locator("#custody-move-status").inner_text()
    assert page.evaluate("document.activeElement && document.activeElement.tagName") in ("BUTTON","LI")

    # Ordena a sequência e confere a transição para a etapa documental.
    times = ["09h10","09h15","09h40","10h20","10h35"]
    for position, time in enumerate(times):
        for _ in range(5):
            rows = page.locator("#custody-events li").all_inner_texts()
            index = next(i for i,t in enumerate(rows) if t.startswith(time))
            if index == position: break
            assert index > position, (label,time,rows)
            page.get_by_role("button",name="subir o registro "+time).click()
        else: raise AssertionError("Não foi possível ordenar "+time)
    page.locator("#custody-check-order").click()
    assert page.evaluate("document.activeElement.id") == "ficha-titulo"
    assert page.locator("#custody-choices").is_enabled()
    page.locator('input[name="custody-gap"][value="1"]').check()
    page.locator("#custody-check-gap").click()
    assert page.locator("#custody-award").is_visible()
    assert page.evaluate("document.activeElement.id") == "custody-award"
    page.locator("#custody-award").screenshot(path=str(OUT / (label+"-custodia-selo.png")))
    page.reload(wait_until="networkidle")
    assert page.locator("#custody-award").is_visible()
    page.locator("#custody-reset").click()
    assert page.locator("#custody-check-order").is_enabled()
    assert page.locator("#custody-award").is_hidden()
    viewport_ok(page,label+"-custodia-fim")

    response = page.goto(base+"/pericia-papiloscopia.html",wait_until="networkidle")
    assert response.status == 200
    viewport_ok(page,label+"-papi")
    buttons_ok(page,label+"-papi")
    assert page.locator("#fp-reset").count() == 1
    assert page.locator("#fp-reference").is_enabled()
    assert page.locator("#fp-zoom-out").is_disabled()
    page.locator("#fp-zoom-in").tap()
    assert "125%" in page.locator("#fp-zoom-status").inner_text()
    page.locator("#fp-show-marks").tap()
    assert page.locator("#fp-show-marks").get_attribute("aria-pressed") == "true"
    page.locator("#fp-reference").select_option("r24")
    page.locator("#fp-check-match").click()
    assert page.locator("#fp-conclusion-choices").is_disabled()
    page.locator("#fp-reference").select_option("r17")
    page.locator("#fp-check-match").click()
    assert page.locator("#fp-reference").is_disabled()
    assert page.locator("#fp-conclusion-choices").is_enabled()
    assert page.evaluate("document.activeElement.id") == "finger-limit-title"
    page.locator('input[name="fp-conclusion"][value="1"]').check()
    page.locator("#fp-check-conclusion").click()
    assert page.locator("#fp-award").is_visible()
    assert page.evaluate("document.activeElement.id") == "fp-award"
    page.locator("#fp-award").screenshot(path=str(OUT/(label+"-papiloscopia-selo.png")))
    page.reload(wait_until="networkidle")
    assert page.locator("#fp-award").is_visible()
    page.locator("#fp-reset").click()
    assert page.locator("#fp-award").is_hidden()
    assert page.locator("#fp-reference").is_enabled()
    assert "100%" in page.locator("#fp-zoom-status").inner_text()
    buttons_ok(page,label+"-papi-final")
    viewport_ok(page,label+"-papi-final")
    assert not errors,(label,errors)
    context.close()
    return {"browser":engine,"viewport":width,"custodia":"ok","papiloscopia":"ok","console_errors":0}


def keyboard_run(browser,base):
    ctx=browser.new_context(viewport={"width":1365,"height":900})
    p=ctx.new_page()
    p.goto(base+"/pericia-custodia.html",wait_until="networkidle")
    first=p.get_by_role("button",name="subir o registro 09h10")
    first.focus()
    first.press("Enter")
    focused=p.evaluate("document.activeElement?.getAttribute('aria-label')")
    assert focused and "09h10" in focused, focused
    assert p.locator("#custody-move-status").inner_text().startswith("09h10")
    p.goto(base+"/pericia-papiloscopia.html",wait_until="networkidle")
    p.locator("#fp-zoom-in").focus()
    p.keyboard.press("Enter")
    assert "125%" in p.locator("#fp-zoom-status").inner_text()
    p.locator("#fp-zoom-out").focus()
    p.keyboard.press("Space")
    assert "100%" in p.locator("#fp-zoom-status").inner_text()
    ctx.close()
    return {"keyboard":"foco e atalhos Enter/Espaço aprovados"}


def main():
    class Server(socketserver.ThreadingMixIn,http.server.HTTPServer):
        daemon_threads=True
        allow_reuse_address=True
    httpd=Server(("127.0.0.1",0),
                 lambda *args,**kw:Quiet(*args,directory=str(ROOT),**kw))
    threading.Thread(target=httpd.serve_forever,daemon=True).start()
    base="http://127.0.0.1:"+str(httpd.server_port)
    results=[]
    with sync_playwright() as pw:
        for name in ("chromium","webkit"):
            browser_type=getattr(pw,name)
            path=os.environ.get("CHROME_PATH") if name=="chromium" else None
            launch={"headless":True}
            if path: launch["executable_path"]=path
            if name=="chromium": launch["args"]=["--no-sandbox"]
            browser=browser_type.launch(**launch)
            try:
                for width in (320,390,428):
                    results.append(mobile_run(browser,base,name,width))
                if name=="chromium":
                    results.append(keyboard_run(browser,base))
            finally: browser.close()
    httpd.shutdown()
    (OUT/"relatorio.json").write_text(json.dumps(results,indent=2,ensure_ascii=False),encoding="utf-8")
    print("MOBILE_ACCESSIBILITY_QA_OK "+json.dumps(results,ensure_ascii=False))


if __name__=="__main__": main()
