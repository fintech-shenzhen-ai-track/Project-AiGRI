"""report.md and report.json writers. Only measured numbers; everything else is "not run"."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def write_json(out: Path, report: dict[str, Any]) -> None:
    (out / "report.json").write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")


def write_markdown(out: Path, report: dict[str, Any]) -> None:
    lines = [f"# AiGRI-Bench run {report['run_id']}", ""]
    lines += [f"Started {report['started_at']}, finished {report['finished_at']}.", ""]
    lines += ["## Suites", "", "| Suite | Status | Detail |", "| --- | --- | --- |"]
    for s in report["suites"]:
        detail = s.get("reason") or "; ".join(
            f"{k}: {v}" for k, v in sorted(s.get("scores", {}).items())
        )
        lines.append(f"| {s['name']} | {s['status']} | {detail or '-'} |")
    lines += ["", "## Versions", ""]
    for k, v in sorted(report["versions"].items()):
        lines.append(f"- {k}: {v}")
    a = report["audit"]
    lines += ["", "## Audit Log", "", f"- status: {a['status']}", f"- rows: {a['rows']}"]
    if a.get("reason"):
        lines.append(f"- reason: {a['reason']}")
    lines += ["- files: audit.jsonl, chain.txt", ""]
    (out / "report.md").write_text("\n".join(lines))
