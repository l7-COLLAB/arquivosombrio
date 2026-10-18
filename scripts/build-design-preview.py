#!/usr/bin/env python3
"""Generate temporary preview pages without exposing the public catalog.

Previews are unlisted, not authenticated. Delete these copies when the
maintenance banner is removed.
"""
from pathlib import Path
import re
import sys

site = Path(sys.argv[1])
for original, preview in (
    ("index.html", "previsualizacao-home.html"),
    ("caso.html", "previsualizacao-dossie.html"),
):
    html = (site / original).read_text(encoding="utf-8-sig")
    html = re.sub(
        r'<meta\s+name="robots"\s+content="[^"]*"\s*/?>',
        "",
        html,
        flags=re.I,
    )
    html = re.sub(
        r'<link\s+rel="canonical"\s+href="[^"]*"\s*/?>',
        "",
        html,
        flags=re.I,
    )
    html = html.replace(
        "<head>",
        '<head>\n<meta name="robots" content="noindex,nofollow,noarchive">',
        1,
    )
    html = re.sub(
        r"(<body[^>]*>)",
        r'\1\n<div class="design-preview-label" role="status">'
        r'PRÉ-VISUALIZAÇÃO DO REDESIGN — O SITE PÚBLICO CONTINUA EM MANUTENÇÃO'
        r'</div>',
        html,
        count=1,
        flags=re.I,
    )
    html = html.replace(
        "</head>",
        '<style>.design-preview-label{position:relative;z-index:100000;'
        'padding:11px 16px;text-align:center;background:#29241f;'
        'color:#e6d9bd;border-bottom:1px solid #a98a5f;'
        'font:600 12px/1.5 Arial,sans-serif;letter-spacing:.03em}'
        '</style></head>',
        1,
    )
    (site / preview).write_text(html, encoding="utf-8")
    print("Preview generated:", preview)
