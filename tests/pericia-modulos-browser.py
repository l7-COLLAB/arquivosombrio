"""Homologação em navegador real dos módulos de cadeia de custódia e papiloscopia."""
from pathlib import Path
import http.server, socketserver, threading, os, json
import fitz
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"qa-pericia-modulos"
OUT.mkdir(exist_ok=True)

def pdf_check():
    info={}
    for key in ["custodia","papiloscopia"]:
        path=ROOT/"assets"/("guia-pericia-"+key+".pdf")
        doc=fitz.open(path)
        assert 3<=doc.page_count<=9, (key,doc.page_count)
        texts=[page.get_text() for page in doc]
        assert sum(len(t) for t in texts)>2500
        for i,p in enumerate(doc):
            words=p.get_text("words")
            assert words, (key,i)
            assert all(w[0]>=0 and w[2]<=p.rect.width+2 and w[1]>=0 and w[3]<=p.rect.height+2 for w in words), (key,i)
        pix=doc[0].get_pixmap(matrix=fitz.Matrix(1.25,1.25),alpha=False)
        pix.save(OUT/("pdf-"+key+"-capa.png"))
        info[key]={"paginas":doc.page_count,"bytes":path.stat().st_size,"caracteres":sum(map(len,texts))}
        doc.close()
    return info

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args):pass

def test_browser(browser,base,name,width,height,mobile):
    ctx=browser.new_context(viewport={"width":width,"height":height},device_scale_factor=1,is_mobile=mobile,has_touch=mobile)
    page=ctx.new_page()
    errors=[]
    page.on("pageerror",lambda e:errors.append(str(e)))
    def visit(path):
        response=page.goto(base+"/"+path,wait_until="networkidle")
        assert response.status==200,(path,response.status)
        assert page.evaluate("document.documentElement.scrollWidth<=innerWidth+3"), ("overflow",path,width)
    for key in ["custodia","papiloscopia"]:
        visit("guia-pericia-"+key+".html")
        assert page.locator(".m-chapter").count()==4
        assert page.locator('a[href="assets/guia-pericia-'+key+'.pdf"]').count()>=1
        pdf=ctx.request.get(base+"/assets/guia-pericia-"+key+".pdf")
        assert pdf.status==200 and pdf.body().startswith(b"%PDF-1.4")
        page.screenshot(path=str(OUT/(name+"-"+key+"-guia.png")),full_page=True)
    visit("pericia-custodia.html")
    assert page.locator("#estudo").count()==1 and page.locator("#atividade").count()==1
    assert page.evaluate("document.getElementById('estudo').offsetTop < document.getElementById('atividade').offsetTop")
    times=["09h10","09h15","09h40","10h20","10h35"]
    for ix,time in enumerate(times):
        for attempt in range(5):
            rows=page.locator("#custody-events li").all_inner_texts()
            at=next(i for i,s in enumerate(rows) if s.startswith(time))
            if at==ix:break
            assert at>ix
            page.get_by_role("button",name="subir o registro "+time).click()
        else:raise AssertionError("Não foi possível ordenar "+time)
    page.locator("#custody-check-order").click()
    assert page.locator("#custody-check-gap").is_enabled()
    page.locator('input[name="custody-gap"][value="2"]').check()
    page.locator("#custody-check-gap").click()
    assert not page.locator("#custody-award").is_visible()
    page.locator('input[name="custody-gap"][value="1"]').check()
    page.locator("#custody-check-gap").click()
    assert page.locator("#custody-award").is_visible()
    page.locator("#custody-award").screenshot(path=str(OUT/(name+"-custodia-conclusao.png")))
    page.reload(wait_until="networkidle")
    assert page.locator("#custody-award").is_visible()
    visit("pericia-papiloscopia.html")
    assert page.locator("#fp-latent svg").count()==1 and page.locator("#fp-known svg").count()==1
    assert page.evaluate("document.getElementById('estudo').offsetTop < document.getElementById('atividade').offsetTop")
    page.locator("#fp-zoom-in").click()
    page.locator("#fp-show-marks").click()
    assert page.locator("#fp-show-marks").get_attribute("aria-pressed")=="true"
    page.locator("#fp-reference").select_option("r24")
    page.locator("#fp-check-match").click()
    assert not page.locator("#fp-check-conclusion").is_enabled()
    page.locator("#fp-reference").select_option("r17")
    page.locator("#fp-check-match").click()
    assert page.locator("#fp-check-conclusion").is_enabled()
    page.locator('input[name="fp-conclusion"][value="0"]').check()
    page.locator("#fp-check-conclusion").click()
    assert not page.locator("#fp-award").is_visible()
    page.locator('input[name="fp-conclusion"][value="1"]').check()
    page.locator("#fp-check-conclusion").click()
    assert page.locator("#fp-award").is_visible()
    page.locator("#fp-award").screenshot(path=str(OUT/(name+"-papiloscopia-conclusao.png")))
    page.reload(wait_until="networkidle")
    assert page.locator("#fp-award").is_visible()
    visit("laboratorio-forense.html")
    assert page.locator('a[href="pericia-custodia.html"]').count()==1
    assert page.locator('a[href="pericia-papiloscopia.html"]').count()==1
    assert page.locator('a[href="guia-pericia.html"]').count()>=1
    assert page.locator("#trilha").count()==1
    assert not errors,errors
    ctx.close()
    return {"perfil":name,"largura":width,"altura":height,"modulos":2,"selos":2,"erros":errors}

def main():
    pdf=pdf_check()
    class Server(socketserver.ThreadingMixIn,http.server.HTTPServer):
        daemon_threads=True
        allow_reuse_address=True
    handler=lambda *args,**kwargs:Quiet(*args,directory=str(ROOT),**kwargs)
    server=Server(("127.0.0.1",0),handler)
    threading.Thread(target=server.serve_forever,daemon=True).start()
    base="http://127.0.0.1:"+str(server.server_port)
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True,executable_path=os.environ.get("CHROME_PATH") or None,args=["--no-sandbox"])
        try:
            r1=test_browser(browser,base,"desktop",1365,900,False)
            r2=test_browser(browser,base,"mobile",390,844,True)
        finally:browser.close()
    server.shutdown()
    report={"pdfs":pdf,"navegadores":[r1,r2]}
    (OUT/"resultado.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
    print("PERICIA_MODULOS_QA_OK "+json.dumps(report,ensure_ascii=False))
if __name__=="__main__":main()
