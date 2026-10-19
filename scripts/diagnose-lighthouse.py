#!/usr/bin/env python3
"""Classify actual Lighthouse laboratory measurements into actionable priorities.

Does not infer CrUX field metrics or fabricate unavailable audit values.
"""
import argparse
import json
from pathlib import Path

THRESHOLDS = {
    "largest-contentful-paint": (2500, 4000, "ms", "Verificar imagem principal, carregamento de fontes e tempo de resposta."),
    "cumulative-layout-shift": (0.1, 0.25, "unitless", "Reservar dimensões de imagens, vídeos e componentes dinâmicos."),
    "total-blocking-time": (200, 600, "ms", "Investigar scripts e tarefas longas na thread principal."),
    "first-contentful-paint": (1800, 3000, "ms", "Revisar CSS bloqueante e recursos críticos."),
}
EXPECTED = {"inicio", "pesquisa", "dossies", "garimpo", "pericia"}

def analyze(folder):
    results = []
    missing = sorted(EXPECTED - {p.stem for p in folder.glob("*.json")})
    for path in sorted(folder.glob("*.json")):
        if path.name in ("resumo.json", "diagnostico.json"):
            continue
        try:
            doc = json.loads(path.read_text(encoding="utf-8"))
        except (ValueError, OSError, UnicodeError) as exc:
            results.append({"page": path.stem, "status": "invalid", "error": str(exc)})
            continue
        if not isinstance(doc, dict) or "lighthouseVersion" not in doc:
            results.append({"page": path.stem, "status": "invalid", "error": "Não é relatório Lighthouse"})
            continue
        if doc.get("runtimeError"):
            results.append({"page": path.stem, "status": "invalid", "error": doc["runtimeError"]})
            continue
        audits = doc.get("audits") or {}
        actions = []
        for name, (good, poor, unit, advice) in THRESHOLDS.items():
            audit = audits.get(name) or {}
            number = audit.get("numericValue")
            if not isinstance(number, (int, float)) or isinstance(number, bool):
                continue
            level = "ruim" if number > poor else "atenção" if number > good else "bom"
            if level != "bom":
                actions.append({"metric": name, "value": number, "unit": unit,
                                "classification": level, "investigate": advice})
        score = (doc.get("categories") or {}).get("performance", {}).get("score")
        results.append({"page": path.stem, "status": "measured", "url": doc.get("finalDisplayedUrl") or doc.get("requestedUrl"),
                        "performance_score": score, "actions": actions,
                        "limitations": "Medição sintética; não é dado de usuários reais."})
    valid_pages = {r["page"] for r in results if r["status"] == "measured"}
    return {"pages": results, "missing_pages": sorted(EXPECTED - valid_pages),
            "complete": EXPECTED == valid_pages,
            "note": "Não fazer alterações de performance sem inspecionar relatórios e validar regressões."}

def main():
    p = argparse.ArgumentParser()
    p.add_argument("folder", type=Path)
    p.add_argument("--output", type=Path, required=True)
    args = p.parse_args()
    result = analyze(args.folder)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if not result["complete"]:
        raise SystemExit("Auditoria incompleta: faltam páginas com medições válidas.")

if __name__ == "__main__":
    main()
