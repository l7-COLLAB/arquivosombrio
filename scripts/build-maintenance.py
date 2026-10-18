#!/usr/bin/env python3
"""Aplica aviso temporário apenas ao HTML público no artefato do GitHub Pages.

Não altera os arquivos-fonte nem rotas de administração. Para reabrir o site,
mude MAINTENANCE_MODE para false no workflow e faça novo deploy.
"""
from pathlib import Path
import shutil
import sys

site = Path(sys.argv[1]).resolve()
source = site / "maintenance.html"
if not source.is_file():
    raise SystemExit("Página de manutenção não encontrada no artefato.")

protected = {
    "admin.html", "painel-admin.html", "moderacao.html",
    "redefinir-senha.html"
}
public_pages = [
    f for f in site.glob("*.html") if f.name not in protected
    and f.name != "maintenance.html"
    and not f.name.startswith("previsualizacao-")
]
public_pages += list((site / "dossies").rglob("*.html")) if (site / "dossies").exists() else []
for dest in public_pages:
    shutil.copyfile(source, dest)
print(f"Modo manutenção aplicado a {len(public_pages)} páginas públicas; painéis administrativos preservados.")
