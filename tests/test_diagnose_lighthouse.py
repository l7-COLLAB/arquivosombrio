import importlib.util
import json
from pathlib import Path

spec = importlib.util.spec_from_file_location("diagnostico", Path(__file__).resolve().parents[1] / "scripts" / "diagnose-lighthouse.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

def test_empty_report_not_completed(tmp_path):
    assert not mod.analyze(tmp_path)["complete"]
    assert len(mod.analyze(tmp_path)["missing_pages"]) == 5

def test_numeric_findings(tmp_path):
    data = {"lighthouseVersion": "12.0.0", "audits": {
        "largest-contentful-paint": {"numericValue": 4500},
        "cumulative-layout-shift": {"numericValue": 0.05},
        "total-blocking-time": {"numericValue": 750},
    }, "categories": {"performance": {"score": 0.45}}}
    (tmp_path / "inicio.json").write_text(json.dumps(data))
    r = mod.analyze(tmp_path)
    assert not r["complete"]
    assert [a["metric"] for a in r["pages"][0]["actions"]] == [
        "largest-contentful-paint", "total-blocking-time"]
    assert all(a["classification"] == "ruim" for a in r["pages"][0]["actions"])

def test_corrupt_report_is_not_valid(tmp_path):
    (tmp_path / "inicio.json").write_text("not json")
    result = mod.analyze(tmp_path)
    assert result["pages"][0]["status"] == "invalid"
    assert "inicio" in result["missing_pages"]
