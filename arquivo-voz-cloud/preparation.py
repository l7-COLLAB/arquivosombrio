"""Conservative, deterministic narration preparation; never alter proper names by guess."""
import hashlib
import json
import re
from datetime import datetime

VOICE = "pf_dora"
SPEED = 0.92

def prepare(text, pronunciation_map=None):
    """Return spoken script and unresolved candidates for editorial review.

    pronunciation_map contains *approved* literal replacements only.
    Source editorial text must be stored separately and remain immutable.
    """
    if not isinstance(text, str) or not text.strip():
        raise ValueError("Narration text is empty")
    script = re.sub(r"\s+", " ", text).strip()
    script = re.sub(r"https?://\S+", "", script).strip()
    script = re.sub(r"\b(\d{1,2})/(\d{1,2})/(\d{4})\b",
                    lambda m: f"{m[1]} de {MONTHS[int(m[2])]} de {m[3]}" if 1 <= int(m[2]) <= 12 else m[0], script)
    approved = pronunciation_map or {}
    for term in sorted(approved, key=len, reverse=True):
        spoken = approved[term]
        if not term.strip() or not isinstance(spoken, str) or not spoken.strip():
            continue
        script = re.sub(r"(?<!\w)" + re.escape(term) + r"(?!\w)",
                        lambda _: spoken, script, flags=re.IGNORECASE)
    # Do not guess pronunciations of people, places, acronyms or uncommon terms.
    candidates = sorted(set(re.findall(r"\b[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{2,}\b", script)))
    return {"script": script, "needs_review": candidates}

MONTHS = ("", "janeiro", "fevereiro", "março", "abril", "maio", "junho",
          "julho", "agosto", "setembro", "outubro", "novembro", "dezembro")

def revision_hash(content_type, content_id, source_text, script, dictionary_version):
    payload = json.dumps([content_type, str(content_id), source_text, script,
                          dictionary_version, VOICE, SPEED], ensure_ascii=False)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()
