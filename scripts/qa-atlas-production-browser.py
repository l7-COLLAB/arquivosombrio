#!/usr/bin/env python3
"""Homologação visual read-only do Atlas publicado (Chromium mobile e desktop).

Captura screenshots e JSON mesmo em caso de falha; sem autenticação, sem escrita.
"""
import argparse
import datetime
import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright, expect


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--origin", default="https://arquivosombrio.net.br")
    parser.add_argument("--output", default="artifacts/atlas-production-browser")
    args = parser.parse_args()
    folder = Path(args.output)
    folder.mkdir(parents=True, exist_ok=True)
    root = args.origin.rstrip("/")
    report = {"site": root, "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
              "result": "failed", "checks": [], "errors": []}

    def check(label, predicate, detail):
        entry = {"name": label, "passed": bool(predicate), "detail": detail}
        report["checks"].append(entry)
        if not predicate:
            raise AssertionError(f"{label}: {detail}")

    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True, args=["--no-sandbox"])
            for width, height, label in [(390, 844, "mobile"), (1440, 900, "desktop")]:
                context = browser.new_context(
                    viewport={"width": width, "height": height},
                    is_mobile=width < 600,
                    has_touch=width < 600,
                    reduced_motion="reduce",
                )
                page = context.new_page()
                errors = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                try:
                    response = page.goto(root + "/atlas.html",
                                         wait_until="domcontentloaded", timeout=45000)
                    check(label + "_http", response is not None and response.status == 200,
                          f"status={response.status if response else '?'}")
                    expect(page.locator("#atlas-map")).to_be_visible(timeout=15000)
                    page.wait_for_function("""() => {
                       const node=document.getElementById('atlas-count');
                       return node && /\\d+ casos?/.test(node.textContent)
                    }""", timeout=45000)
                    case_count = page.locator(".case").count()
                    check(label + "_list", case_count >= 1,
                          f"{case_count} casos renderizados")
                    check(label + "_leaflet", page.locator("#atlas-map.leaflet-container").count() == 1,
                          "Leaflet inicializou o mapa")
                    metrics = page.evaluate("""() => ({
                        width: window.innerWidth,
                        scrollWidth: document.documentElement.scrollWidth,
                        bodyWidth: document.body.scrollWidth
                    })""")
                    check(label + "_no_overflow",
                          metrics["scrollWidth"] <= width + 2 and metrics["bodyWidth"] <= width + 2,
                          json.dumps(metrics))
                    check(label + "_case_links", all(
                        (link.get_attribute("href") or "").startswith("/arquivo/")
                        for link in page.locator(".case-body a").all()
                    ), "Links para registros internos devem apontar para /arquivo/")
                    page.screenshot(path=str(folder / (label + ".png")),
                                    full_page=True, animations="disabled")
                    page.locator("#atlas-search").fill("Bogotá")
                    expect(page.locator("#atlas-count")).to_have_text("1 caso", timeout=15000)
                    check(label + "_search", page.locator(".case").count() == 1,
                          "Pesquisa Bogotá retorna um caso")
                    page.locator("#atlas-clear").click()
                    page.locator("#atlas-country").select_option("Brasil")
                    page.wait_for_timeout(250)
                    check(label + "_country_filter",
                          page.locator(".case").count() >= 1,
                          "Seleção Brasil filtra sem erro")
                    check(label + "_js_errors", len(errors) == 0, "; ".join(errors[:5]))
                finally:
                    if (folder / (label + ".png")).exists() is False:
                        try:
                            page.screenshot(path=str(folder / (label + "-failure.png")),
                                            full_page=True, timeout=5000)
                        except Exception:
                            pass
                    context.close()
            browser.close()
        report["result"] = "passed"
    except Exception as exc:
        report["errors"].append(str(exc))
    finally:
        result = json.dumps(report, indent=2, ensure_ascii=False)
        (folder / "report.json").write_text(result + "\n", encoding="utf-8")
        print(result)
    return 0 if report["result"] == "passed" else 1


if __name__ == "__main__":
    sys.exit(main())
