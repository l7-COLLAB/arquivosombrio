#!/usr/bin/env python3
"""Auditoria documental não destrutiva de dossiês exportados em JSON.

Uso: python3 scripts/audit-dossiers.py caminho/para/dossies.json --output relatorio.json
O arquivo pode conter lista de dossiês ou objeto {"data":[...]}, {"items":[...]} ou {"casos":[...]}.
Não faz conexões externas nem grava no Supabase.
"""
import argparse
import json
from pathlib import Path

def has_content(value):
    if value is None or value == "" or value == [] or value == {}:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, list):
        return any(has_content(item) for item in value)
    if isinstance(value, dict):
        return any(has_content(v) for v in value.values())
    return True

def values_for(case, kind):
    blocks = case.get("conteudo_blocos")
    blocks = blocks if isinstance(blocks, list) else []
    return [b.get("dados") for b in blocks if isinstance(b, dict) and b.get("tipo") == kind]

def present(case, key, *block_types):
    return has_content(case.get(key)) or any(has_content(v) for t in block_types for v in values_for(case, t))

def audit(case):
    issues = []
    def add(code, severity, message):
        issues.append({"code": code, "severity": severity, "message": message})
    for key in ("titulo", "resumo", "local", "ano"):
        if not has_content(case.get(key)):
            add("missing_" + key, "review", f"Campo {key} ausente ou vazio")
    if not present(case, "historia", "paragrafo"):
        add("missing_narrative", "review", "Narrativa principal não localizada")
    if not present(case, "evidencias", "evidencias"):
        add("missing_evidence", "review", "Evidências não localizadas")
    if not present(case, "cronologia", "cronologia"):
        add("missing_chronology", "advisory", "Cronologia estruturada não localizada")
    if not present(case, "fontes", "fontes"):
        add("missing_sources", "review", "Bloco ou campo de fontes não localizado; conferir fontes inseridas no texto")
    if not present(case, "documentos", "documento"):
        add("missing_documents", "advisory", "Nenhum documento vinculado; avaliar se aplicável")
    if not present(case, "situacao_oficial", "situacao_oficial"):
        add("missing_official_status", "advisory", "Situação oficial não localizada como campo/bloco próprio")
    sources = case.get("fontes", [])
    if isinstance(sources, list):
        for i, item in enumerate(sources):
            if isinstance(item, dict) and not (item.get("url") or item.get("referencia") or item.get("titulo")):
                add("source_without_reference", "review", f"Fonte {i+1} sem título, URL ou referência")
    return {
        "id": str(case.get("id", "")),
        "titulo": str(case.get("titulo", "")),
        "issues": issues,
        "counts": {
            "review": sum(x["severity"] == "review" for x in issues),
            "advisory": sum(x["severity"] == "advisory" for x in issues)
        }
    }

def run(records):
    if isinstance(records, dict):
        records = next((records[k] for k in ("data", "items", "casos", "dossies") if isinstance(records.get(k), list)), None)
    if not isinstance(records, list):
        raise ValueError("JSON deve conter uma lista ou objeto com data/items/casos/dossies")
    if any(not isinstance(item, dict) for item in records):
        raise ValueError("Todos os dossiês devem ser objetos JSON")
    results = [audit(record) for record in records]
    return {
        "total": len(results),
        "with_review_issues": sum(r["counts"]["review"] > 0 for r in results),
        "with_advisories": sum(r["counts"]["advisory"] > 0 for r in results),
        "results": results,
        "note": "Diagnóstico de presença estrutural. Não verifica a veracidade histórica, qualidade das fontes, links ou completude narrativa."
    }

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="Exportação JSON (sem credenciais)")
    parser.add_argument("--output", type=Path, help="Salvar relatório JSON")
    args = parser.parse_args()
    report = run(json.loads(args.input.read_text(encoding="utf-8")))
    rendered = json.dumps(report, ensure_ascii=False, indent=2)
    if args.output:
        args.output.write_text(rendered + "\n", encoding="utf-8")
    else:
        print(rendered)

if __name__ == "__main__":
    main()
