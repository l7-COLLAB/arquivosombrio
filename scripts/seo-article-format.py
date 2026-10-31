"""Render safe, readable snapshots and editorial source links for public articles.

Every content string is escaped, even when it resembles HTML or Markdown.
No remote markup, scripts or unsupported URI schemes are inserted into HTML.
"""
from html import escape, unescape
import re
from urllib.parse import urljoin, urlsplit

BASE = "https://arquivosombrio.net.br/"
FALLBACK_COVER = BASE + "imagem-compartilhamento.jpg"
URL_RE = re.compile(r"https?://[^\s<>'\"\\]+", re.I)
BLOCK_CLOSE_RE = re.compile(r"<\s*(?:br\s*/?|/p|/div|/h[1-6]|/li|/ul|/ol)\s*>", re.I)
TAG_RE = re.compile(r"<[^>]*>")
MARKDOWN_HEADING_RE = re.compile(r"^\s*(#{1,4})\s+(.+?)\s*$")
LIST_RE = re.compile(r"^\s*(?:[-*•]\s+|\d{1,3}[.)]\s+)(.+)$")
PROSE_END_RE = re.compile(r"[.!?;:]$")


def safe_url(value):
    """Only URLs intended for navigation; never data:, javascript: or protocol-relative."""
    value = str(value or "").strip()
    if not value or len(value) > 2048 or value.startswith("//") or "\\" in value:
        return ""
    if any(ord(char) < 33 or ord(char) == 127 for char in value):
        return ""
    parts = urlsplit(value)
    if parts.scheme not in {"http", "https"} or not parts.hostname:
        return ""
    if parts.username or parts.password:
        return ""
    return value


def cover_url(value):
    """Prefer the actual record cover, and use the site's standard preview as fallback."""
    value = str(value or "").strip()
    if value.startswith("/") and not value.startswith("//"):
        if "\\" not in value and not any(ord(c) < 33 for c in value):
            return urljoin(BASE, value)
    return safe_url(value) or FALLBACK_COVER


def strip_markup(value):
    text = str(value or "").replace("\r\n", "\n").replace("\r", "\n")
    text = BLOCK_CLOSE_RE.sub("\n\n", text)
    text = TAG_RE.sub(" ", text)
    text = unescape(text).replace("\u00a0", " ")
    return re.sub(r"[ \t]+", " ", text)


def is_editorial_heading(text):
    letters = [c for c in text if c.isalpha()]
    if not 5 <= len(text) <= 95 or len(letters) < 5 or PROSE_END_RE.search(text):
        return False
    if len(text.split()) < 2:
        return False
    return all(c.isupper() for c in letters)


def render_narrative(value):
    """Preserve paragraphs, headings and simple lists without interpreting arbitrary HTML."""
    text = strip_markup(value)
    output, paragraph, items = [], [], []

    def flush_paragraph():
        if paragraph:
            output.append("<p>" + escape(" ".join(paragraph), quote=True) + "</p>")
            paragraph.clear()

    def flush_list():
        if items:
            output.append("<ul>" + "".join("<li>" + escape(x, quote=True) + "</li>" for x in items) + "</ul>")
            items.clear()

    for line in text.split("\n"):
        line = line.strip()
        if not line:
            flush_paragraph()
            flush_list()
            continue
        heading = MARKDOWN_HEADING_RE.match(line)
        if heading or is_editorial_heading(line):
            flush_paragraph()
            flush_list()
            label = heading.group(2) if heading else line
            level = "h3" if heading and len(heading.group(1)) >= 3 else "h2"
            output.append(f"<{level}>" + escape(label.strip(), quote=True) + f"</{level}>")
            continue
        listed = LIST_RE.match(line)
        if listed:
            flush_paragraph()
            items.append(listed.group(1).strip())
            continue
        flush_list()
        paragraph.append(line)
    flush_paragraph()
    flush_list()
    return "\n".join(output)


def parse_reference_list(value):
    """Read structured source objects and free-text bibliographies, without inventing links."""
    if not value:
        return []
    if isinstance(value, dict):
        value = [value]
    if isinstance(value, list):
        refs = []
        for item in value:
            if isinstance(item, dict):
                url = safe_url(item.get("url") or item.get("link") or item.get("href"))
                label = item.get("titulo") or item.get("title") or item.get("nome") or item.get("descricao")
                if url:
                    refs.append((url, str(label or urlsplit(url).hostname or "Fonte")))
            elif isinstance(item, str):
                refs.extend(parse_reference_list(item))
        return unique_refs(refs)
    if not isinstance(value, str):
        return []
    refs, previous = [], ""
    for raw_line in value.splitlines():
        line = raw_line.strip()
        if not line:
            previous = ""
            continue
        urls = list(URL_RE.finditer(line))
        if urls:
            for match in urls:
                candidate = match.group(0).rstrip(".,;)]}")
                url = safe_url(candidate)
                if not url:
                    continue
                label = line[:match.start()].strip(" :-•\t")
                label = re.sub(r"^\d{1,3}[.)]\s*", "", label).strip()
                if not label:
                    label = previous or urlsplit(url).hostname or "Fonte"
                refs.append((url, label[:280]))
            previous = ""
        else:
            previous = re.sub(r"^\d{1,3}[.)]\s*", "", line).strip()[:280]
    return unique_refs(refs)


def unique_refs(refs):
    seen, result = set(), []
    for url, label in refs:
        if url not in seen:
            result.append((url, label))
            seen.add(url)
    return result


def render_references(*values):
    refs = unique_refs([item for val in values for item in parse_reference_list(val)])
    if not refs:
        return ""
    items = "".join(
        '<li><a href="' + escape(url, quote=True) + '" rel="noopener noreferrer" target="_blank">'
        + escape(label, quote=True) + "</a></li>" for url, label in refs
    )
    return ('<section class="article-references" aria-labelledby="article-references-title">'
            '<h2 id="article-references-title">Fontes e documentos consultados</h2>'
            '<p>Referências cadastradas no arquivo editorial. A existência de um link não implica confirmação '
            'independente de todas as alegações.</p><ol>' + items + "</ol></section>")
