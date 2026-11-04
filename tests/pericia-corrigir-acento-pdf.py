#!/usr/bin/env python3
"""Normaliza acentos presentes nas frases introdutórias do PDF já publicado.

Preserva os sete capítulos/páginas e os textos científicos; não modifica o HTML.
A saída binária é transmitida ao conector GitHub como blob após revisão.
"""
import base64
from pathlib import Path
import fitz

base = Path("assets/apostila-pericia-forense.pdf")
out = Path("qa-pericia-artifacts/apostila-pericia-forense-corrigida.pdf")
out.parent.mkdir(exist_ok=True)
changes = {
    "PERICIA FORENSE": "PERÍCIA FORENSE",
    "exercicios": "exercícios",
    "Pericia Forense": "Perícia Forense",
    "hemacias": "hemácias",
    "documentacao": "documentação",
    "vestigios": "vestígios",
    "interpretacao": "interpretação",
    "evidencias": "evidências",
    "tecnicos": "técnicos",
    "avaliacao": "avaliação",
    "medica": "médica",
    "observacao": "observação",
    "comparacao": "comparação",
    "hipoteses": "hipóteses",
    "CAPITULO": "CAPÍTULO",
    "Pagina": "Página",
    "pericia": "perícia",
}
pdf = fitz.open(base)
counts = {}
for page in pdf:
    for xref in page.get_contents():
        data = pdf.xref_stream(xref)
        updated = data
        for old,new in changes.items():
            old_b = old.encode("cp1252")
            count = updated.count(old_b)
            if count:
                updated=updated.replace(old_b,new.encode("cp1252"))
                counts[old]=counts.get(old,0)+count
        if updated!=data:
            pdf.update_stream(xref,updated)
pdf.save(out,garbage=4,deflate=True)
pdf.close()
check=fitz.open(out)
cover=check[0].get_text()
assert "Perícia Forense" in cover and "exercícios" in cover, repr(cover[:300])
assert check.page_count == 7
for i,page in enumerate(check):
    ws=page.get_text("words")
    assert ws and all(0<=w[0] and w[2]<=page.rect.width+2 and 0<=w[1] and w[3]<=page.rect.height+2 for w in ws),i
print("FIXED_PDF_CHANGES",counts)
print("FIXED_PDF_PAGES",check.page_count)
check.close()
print("FIXED_PDF_BASE64="+base64.b64encode(out.read_bytes()).decode("ascii"))
