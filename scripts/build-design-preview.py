#!/usr/bin/env python3
"""Build two unlisted, noindex design previews before maintenance overlay."""
from pathlib import Path
import sys

site = Path(sys.argv[1])
for original, preview in [
    ("index.html", "previsualizacao-home.html"),
    ("caso.html", "previsualizacao-dossie.html"),
]:
    html = (site / original).read_text(encoding="utf-8-sig")
    html = html.replace(
        "<head>",
        '<head>\n<meta name="robots" content="noindex,nofollow,noarchive">\n',
        1,
    )
    html = html.replace(
        "<body ",
        '<body ',
        1,
    )
    (site / preview).write_text(html, encoding="utf-8")
    print(f"Preview generated: {preview}")
