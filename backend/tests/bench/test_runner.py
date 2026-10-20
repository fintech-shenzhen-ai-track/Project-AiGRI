import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))

from bench import audit_chain, runner  # noqa: E402


def test_empty_run_lists_every_suite_not_run(tmp_path):
    out = runner.run_all(tmp_path, suites={})
    rep = json.loads((out / "report.json").read_text())
    assert [s["status"] for s in rep["suites"]] == ["not run"] * len(runner.PLANNED_SUITES)
    assert all(s["reason"] for s in rep["suites"])
    for f in ("report.md", "ops.log.jsonl", "audit.jsonl", "chain.txt"):
        assert (out / f).exists()
    assert "not run" in (out / "report.md").read_text()
    assert rep["audit"]["status"] == "not available"
    assert out.name == rep["run_id"]


def test_suite_scores_notrun_and_error(tmp_path):
    def ok(ctx):
        return {"scores": {"acc": "1.0"}}

    def nr(ctx):
        raise runner.NotRun("needs satellite data")

    def boom(ctx):
        raise RuntimeError("x")

    out = runner.run_all(tmp_path, suites={"curation": ok, "red_team": nr, "policy_qa": boom})
    by = {s["id"]: s for s in json.loads((out / "report.json").read_text())["suites"]}
    assert by["curation"]["status"] == "ran" and by["curation"]["scores"] == {"acc": "1.0"}
    assert by["red_team"]["reason"] == "needs satellite data"
    assert by["policy_qa"]["status"] == "error"
    assert "scores" not in by["policy_qa"]


def test_audit_export_verifies_and_detects_tamper(tmp_path):
    src = audit_chain.FakeAuditSource()
    for i in range(3):
        src.append("2026-10-20T00:00:00Z", "x.y", {"n": i})
    out = runner.run_all(tmp_path, suites={}, audit_source=src)
    rows = audit_chain.read_rows(out / "audit.jsonl")
    assert len(rows) == 3 and audit_chain.verify_rows(rows).ok
    chain = (out / "chain.txt").read_text()
    assert rows[0]["hash"] in chain and rows[-1]["hash"] in chain and "verified" in chain
    rows[1]["payload"]["n"] = 99
    assert audit_chain.verify_rows(rows).first_break_seq == 2
