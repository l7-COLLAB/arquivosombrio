#!/usr/bin/env python3
"""Smoke test HTTP do Atlas publicado. Sem login e sem escrita no Supabase."""
import argparse
import datetime
import json
import re
import sys
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urljoin
from urllib.request import Request, urlopen


def request(url, headers=None, attempts=3):
    req_headers = {
        "User-Agent": "ArquivoSombrio-Atlas-Production-QA/1.0",
        "Cache-Control": "no-cache",
        "Accept": "application/json, text/html, text/javascript",
    }
    if headers:
        req_headers.update(headers)
    for attempt in range(attempts):
        try:
            with urlopen(Request(url, headers=req_headers), timeout=18) as response:
                return response.status, response.read().decode("utf-8")
        except HTTPError as exc:
            # Não tentar novamente um 403 esperado em testes de autorização.
            return exc.code, exc.read().decode("utf-8", errors="replace")
        except (OSError, UnicodeError, URLError) as exc:
            if attempt == attempts - 1:
                raise RuntimeError(f"URL indisponível ({url}): {exc}") from exc
            time.sleep(4)
    raise RuntimeError("Falha ao consultar URL")


def expect(condition, message):
    if not condition:
        raise AssertionError(message)


def script_url(document, page_url, filename):
    pattern = rf'(?P<src>(?:\.?\.?/)?(?:js/)?{re.escape(filename)}\?v=[A-Za-z0-9._-]+)'
    match = re.search(pattern, document)
    expect(match is not None, f"Versão de {filename} ausente do HTML publicado")
    return urljoin(page_url, match.group("src"))


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--origin", default="https://arquivosombrio.net.br")
    p.add_argument("--api-origin", default="https://iuhotznurbyujzbyhizf.supabase.co")
    p.add_argument("--min-records", type=int, default=53)
    p.add_argument("--report", default="")
    args = p.parse_args()
    origin = args.origin.rstrip("/")
    api = args.api_origin.rstrip("/")
    report = {
        "checked_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "origin": origin,
        "result": "failed",
        "checks": [],
    }

    def check(name, condition, detail):
        report["checks"].append({"check": name, "ok": bool(condition), "detail": detail})
        expect(condition, f"{name}: {detail}")

    try:
        p_url = origin + "/atlas.html"
        a_url = origin + "/admin-v2/atlas.html"
        ps, public_page = request(p_url)
        has_map = 'id="atlas-map"' in public_page
        check("atlas_page", ps == 200 and has_map,
              f"HTTP {ps}, mapa presente: {has_map}")
        ad, admin_page = request(a_url)
        has_form = 'id="location-form"' in admin_page
        check("admin_page", ad == 200 and has_form,
              f"HTTP {ad}, formulário presente: {has_form}")
        check("admin_noindex", bool(re.search(r'<meta[^>]+name="robots"[^>]+noindex', admin_page)),
              "Painel administrativo deve incluir noindex")

        public_js_url = script_url(public_page, p_url, "atlas-criminal.js")
        admin_js_url = script_url(admin_page, a_url, "atlas-admin.js")
        sj, public_js = request(public_js_url)
        check("public_js", sj == 200 and "case_atlas_public" in public_js,
              f"HTTP {sj}, versão {public_js_url.rsplit('v=', 1)[-1]}")
        aj, admin_js = request(admin_js_url)
        check("admin_js", aj == 200 and "case_atlas_locations" in admin_js and "updateReferenceLink" in admin_js,
              f"HTTP {aj}, versão {admin_js_url.rsplit('v=', 1)[-1]}")
        match = re.search(r"""const KEY\s*=\s*['"](sb_publishable_[A-Za-z0-9_-]+)['"]""", public_js)
        check("publishable_key", match is not None, "Somente chave pública no frontend")
        key = match.group(1)
        headers = {"apikey": key, "Accept": "application/json"}
        columns = "source_type,source_id,country,city,latitude,longitude,event_year"
        url = api + "/rest/v1/case_atlas_public?" + urlencode({"select": columns, "limit": 1000})
        status, body = request(url, headers=headers)
        check("public_api_http", status == 200, f"HTTP {status}")
        rows = json.loads(body)
        check("public_records", isinstance(rows, list) and len(rows) >= args.min_records,
              f"{len(rows) if isinstance(rows, list) else '?'} registros (mínimo {args.min_records})")
        valid = all(
            item.get("source_type") in ("dossie", "garimpo")
            and isinstance(item.get("source_id"), int) and item["source_id"] > 0
            and isinstance(item.get("event_year"), int) and 1000 <= item["event_year"] <= 2100
            and -90 <= float(item.get("latitude", 999)) <= 90
            and -180 <= float(item.get("longitude", 999)) <= 180
            and item.get("city") and item.get("country")
            for item in rows
        )
        check("public_coordinates", valid, "Ano, coordenadas e localidade íntegros")
        report["public_rows"] = len(rows)
        report["cities"] = len({(item["country"], item["city"]) for item in rows})

        private_url = api + "/rest/v1/case_atlas_locations?select=review_note&limit=1"
        protected_status, protected_body = request(private_url, headers=headers, attempts=1)
        protected = protected_status in (401, 403) or (
            protected_status == 400 and ("42501" in protected_body or "permission denied" in protected_body.lower())
        )
        check("private_editorial_notes", protected,
              f"Consulta anônima recebeu HTTP {protected_status} (deve ser negada)")
        report["result"] = "passed"
    except Exception as exc:
        report["error"] = str(exc)
    finally:
        output = json.dumps(report, indent=2, ensure_ascii=False)
        print(output)
        if args.report:
            Path(args.report).parent.mkdir(parents=True, exist_ok=True)
            Path(args.report).write_text(output + "\n", encoding="utf-8")
    return 0 if report["result"] == "passed" else 1


if __name__ == "__main__":
    sys.exit(main())
