"""Teste de interface do Atlas em Chromium, sem depender de CDN, tiles ou dados privados.

Executar na raiz: python3 -m unittest tests/test_atlas_browser.py -v
No GitHub Actions as capturas ficam em artifacts/atlas-browser.
"""
import functools
import http.server
import json
import os
from pathlib import Path
import threading
import unittest

from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
CAPTURES = ROOT / "artifacts" / "atlas-browser"
API_PATTERN = "https://iuhotznurbyujzbyhizf.supabase.co/rest/v1/case_atlas_public**"

FIXTURE = [
    dict(source_type="dossie", source_id=4, title="Lizzie Borden",
         summary="Fall River, 1892.", country="Estados Unidos",
         state_region="Massachusetts", city="Fall River", neighborhood=None,
         latitude=41.7, longitude=-71.15, event_year=1892, location_precision="city"),
    dict(source_type="garimpo", source_id=39, title="Família em Setagaya",
         summary="Tóquio, 2000.", country="Japão",
         state_region="Tóquio", city="Tóquio", neighborhood="Setagaya",
         latitude=35.676, longitude=139.65, event_year=2000, location_precision="city"),
    dict(source_type="garimpo", source_id=66, title="Luis Andrés Colmenares",
         summary="Bogotá, 2010.", country="Colômbia", state_region="Bogotá D.C.",
         city="Bogotá", neighborhood=None, latitude=4.71, longitude=-74.07,
         event_year=2010, location_precision="city"),
    dict(source_type="garimpo", source_id=29, title="Sherri Papini",
         summary="Redding, 2016.", country="Estados Unidos",
         state_region="Califórnia", city="Redding", neighborhood=None,
         latitude=40.58, longitude=-122.39, event_year=2016, location_precision="city"),
    dict(source_type="garimpo", source_id=99, title="Outro registro histórico",
         summary="Redding, 2017.", country="Estados Unidos",
         state_region="Califórnia", city="Redding", neighborhood=None,
         latitude=40.58, longitude=-122.39, event_year=2017, location_precision="city"),
]

# Simula somente a interface Leaflet; não afirma que tiles externos carregaram.
# O teste de produção em scripts/qa-atlas-production.py cobre HTTP real.
FAKE_LEAFLET = r"""
(() => {
  window.__atlasCalls = [];
  window.__atlasMarkers = [];
  const map = {
    setView(coords, zoom) {
      window.__atlasCalls.push({method:'setView',coords,zoom}); return this;
    },
    fitBounds(coords) {
      window.__atlasCalls.push({method:'fitBounds',coords}); return this;
    },
    getBounds() {
      return {pad() {return {contains() {return true}}}};
    },
    on() {return this;}
  };
  const layer = {
    addTo() {return this},
    clearLayers() {window.__atlasMarkers=[]},
    addLayer(marker) {window.__atlasMarkers.push(marker)}
  };
  window.L = {
    map() {return map},
    tileLayer() {return {addTo() {return this}}},
    markerClusterGroup() {return layer},
    featureGroup() {return layer},
    divIcon() {return {}},
    latLngBounds(coords) {return coords},
    marker(coords, options) {
      return {
        coords, options,
        bindPopup(content) {this.popup=content;return this}
      }
    }
  };
})();
"""


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


class AtlasBrowserTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        handler = functools.partial(QuietHandler, directory=str(ROOT))
        cls.server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f"http://127.0.0.1:{cls.server.server_port}"
        cls.p = sync_playwright().start()
        cls.browser = cls.p.chromium.launch(headless=True, args=["--no-sandbox"])
        CAPTURES.mkdir(parents=True, exist_ok=True)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.p.stop()
        cls.server.shutdown()
        cls.server.server_close()

    def page(self, width=1440, map_mock=True, api_error=False):
        context = self.browser.new_context(
            viewport={"width": width, "height": 900 if width >= 768 else 760},
            device_scale_factor=1,
            is_mobile=width <= 600,
            has_touch=width <= 600,
            reduced_motion="reduce",
        )
        page = context.new_page()
        page.on("pageerror", lambda error: self.fail(f"JavaScript falhou: {error}"))
        page.route("https://cdn.jsdelivr.net/**", lambda route: route.abort())
        page.route("https://tile.openstreetmap.org/**", lambda route: route.abort())
        if map_mock:
            page.add_init_script(FAKE_LEAFLET)
        def answer_api(route):
            if api_error:
                route.fulfill(status=403, body='{"message":"denied"}',
                              headers={"Access-Control-Allow-Origin":"*", "Content-Type":"application/json"})
            else:
                route.fulfill(status=200, body=json.dumps(FIXTURE, ensure_ascii=False),
                              headers={"Access-Control-Allow-Origin":"*", "Content-Type":"application/json"})
        page.route(API_PATTERN, answer_api)
        page.goto(self.base + "/atlas.html", wait_until="domcontentloaded")
        expected = "Consulta indisponível" if api_error else f"{len(FIXTURE)} casos"
        expect(page.locator("#atlas-count")).to_have_text(expected, timeout=15000)
        return context, page

    def test_layout_mobile_tablet_desktop_without_horizontal_overflow(self):
        for width in (320, 390, 768, 1024, 1440):
            with self.subTest(width=width):
                context, page = self.page(width)
                actual = page.evaluate("""() => ({
                    doc: document.documentElement.scrollWidth,
                    body: document.body.scrollWidth,
                    viewport: window.innerWidth
                })""")
                self.assertLessEqual(actual["doc"], width + 2, actual)
                self.assertLessEqual(actual["body"], width + 2, actual)
                expect(page.locator(".case")).to_have_count(len(FIXTURE))
                page.screenshot(path=str(CAPTURES / f"atlas-{width}.png"),
                                full_page=True, animations="disabled")
                context.close()

    def test_search_accent_city_and_chronological_order(self):
        context, page = self.page(390)
        self.assertEqual(page.locator(".year").all_text_contents(),
                         ["1892", "2000", "2010", "2016", "2017"])
        page.locator("#atlas-search").fill("bogota")
        expect(page.locator("#atlas-count")).to_have_text("1 caso")
        expect(page.locator(".case-body h3")).to_have_text("Luis Andrés Colmenares")
        calls = page.evaluate("window.__atlasCalls")
        self.assertTrue(any(c["method"] == "setView" and
                            abs(c["coords"][0] - 4.71) < .1 for c in calls), calls)
        context.close()

    def test_country_filter_and_clear(self):
        context, page = self.page()
        page.locator("#atlas-country").select_option("Estados Unidos")
        expect(page.locator("#atlas-count")).to_have_text("3 casos")
        page.locator("#atlas-city").select_option("Redding")
        expect(page.locator("#atlas-count")).to_have_text("2 casos")
        page.locator("#atlas-clear").click()
        expect(page.locator("#atlas-count")).to_have_text("5 casos")
        self.assertEqual(page.locator("#atlas-country").input_value(), "")
        context.close()

    def test_popup_city_groups_and_case_links(self):
        context, page = self.page()
        self.assertEqual(page.evaluate("window.__atlasMarkers.length"), 4)
        page.evaluate("""() => {
            const marker = window.__atlasMarkers.find(m => m.coords[0] === 40.58);
            document.body.append(marker.popup);
        }""")
        page.get_by_role("button", name="Ver casos desta cidade").click()
        expect(page.locator("#atlas-count")).to_have_text("2 casos")
        self.assertEqual(page.locator("#atlas-city").input_value(), "Redding")
        self.assertEqual(page.locator(".case-body a").count(), 2)
        for link in page.locator(".case-body a").all():
            self.assertRegex(link.get_attribute("href"), r"^/arquivo/(caso|garimpo)-\d+\.html$")
        context.close()

    def test_map_missing_keeps_filters_and_timeline(self):
        context, page = self.page(390, map_mock=False)
        expect(page.locator("#atlas-map")).to_contain_text("O mapa não carregou")
        self.assertTrue(page.locator("#atlas-viewport").is_disabled())
        self.assertEqual(page.locator(".case").count(), 5)
        page.locator("#atlas-search").fill("Redding")
        expect(page.locator("#atlas-count")).to_have_text("2 casos")
        context.close()

    def test_api_error_does_not_leave_loading_forever(self):
        context, page = self.page(390, api_error=True)
        expect(page.locator("#atlas-feedback")).to_contain_text("Não foi possível consultar")
        expect(page.locator("#atlas-map")).to_contain_text("temporariamente indisponível")
        self.assertEqual(page.locator(".case").count(), 0)
        context.close()


if __name__ == "__main__":
    unittest.main()
