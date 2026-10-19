#!/usr/bin/env python3
"""Extrai métricas Lighthouse de relatórios JSON reais, sem inventar medições."""
import argparse
import json
from pathlib import Path

METRICS = ("first-contentful-paint", "largest-contentful-paint", "speed-index",
           "total-blocking-time", "cumulative-layout-shift", "interaction-to-next-paint")

def summarize(folder):
    rows = []
    for path in sorted(folder.glob("*.json")):
        if path.name == "resumo.json":
            continue
        try:
            obj = json.loads(path.read_text(encoding="utf-8"))
            if not isinstance(obj, dict) or "lighthouseVersion" not in obj:
                continue
            audits = obj.get("audits") or {}
            categories = obj.get("categories") or {}
            rows.append({
                "page": path.stem,
                "url": obj.get("finalDisplayedUrl") or obj.get("requestedUrl"),
                "fetch_time": obj.get("fetchTime"),
                "environment": "Lighthouse, mobile simulado, laboratório (não é CrUX)",
                "scores": {key: categories.get(key, {}).get("score")
                           for key in ("performance", "accessibility", "seo")},
                "metrics": {key: {"value": audits.get(key, {}).get("numericValue"),
                                  "unit": audits.get(key, {}).get("numericUnit")}
                            for key in METRICS},
                "run_warnings": obj.get("runWarnings", []),
            })
        except (ValueError, UnicodeError, OSError) as exc:
            rows.append({"page": path.stem, "error": str(exc)})
    return {"pages": rows, "count": len(rows),
            "note": "Simulação em laboratório; resultados variam e não são dados reais de usuários."}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("folder", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    data = summarize(args.folder)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(data, indent=2, ensure_ascii=False))
    if not data["pages"] or any("error" in row for row in data["pages"]):
        raise SystemExit(1)

if __name__ == "__main__":
    main()
