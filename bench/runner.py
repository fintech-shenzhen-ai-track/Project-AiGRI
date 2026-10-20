"""Discovers suites, runs them, writes bench/results/<run-id>/ (FR-16.1, FR-16.2, FR-16.8).

A suite is a module bench/suites/<name>/suite.py with `run(ctx: SuiteContext) -> dict` returning
{"scores": {...}, "cases": [...]}. A planned suite with no module, or one that raises NotRun, is
reported as "not run" with the reason. A crash is "error", never a score.
Checkpoint restore (FR-16.1) is each suite's job through ctx; none exist yet.
"""

from __future__ import annotations

import importlib
import json
import os
import subprocess
import sys
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from bench import audit_chain
from bench.report.writers import write_json, write_markdown

BENCH_DIR = Path(__file__).resolve().parent
RESULTS_DIR = BENCH_DIR / "results"

# specs/16-bench/spec.md "Suites"; package name -> display name
PLANNED_SUITES: dict[str, str] = {
    "policy_qa": "Policy Q&A",
    "curation": "Curation",
    "claim_scenarios": "Claim scenarios",
    "counterfactual": "Counterfactual variants",
    "damage_accuracy": "Damage Assessment accuracy",
    "backtests": "Historical backtests",
    "user_effort": "User effort",
    "wallet_integrity": "Wallet integrity",
    "red_team": "Red team",
}

SuiteFn = Callable[["SuiteContext"], dict[str, Any]]


class NotRun(Exception):
    """Raised by a suite that cannot run; the message becomes the reason."""


@dataclass
class SuiteContext:
    run_id: str
    out_dir: Path
    artefact_dir: Path
    ops: Callable[..., None]
    versions: dict[str, str] = field(default_factory=dict)


def _utc_now() -> str:
    try:
        from aigri.core.clock import now

        return now().strftime("%Y-%m-%dT%H:%M:%SZ")
    except ImportError:  # pragma: no cover
        return datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")


def git_short_hash() -> str:
    try:
        return subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            capture_output=True, text=True, check=True, cwd=BENCH_DIR,
        ).stdout.strip()  # fmt: skip
    except (OSError, subprocess.CalledProcessError):
        return "nogit"


def make_run_id(ts: str, git_hash: str) -> str:
    return ts.replace("-", "").replace(":", "") + "-" + git_hash


def collect_versions() -> dict[str, str]:
    na = "not available (component not merged)"
    keys = ("rules", "formula", "risk_model", "damage_pipeline", "models_and_digests")
    return {"git": git_short_hash(), **{k: na for k in keys}}


def discover() -> dict[str, SuiteFn]:
    found: dict[str, SuiteFn] = {}
    for name in PLANNED_SUITES:
        if (BENCH_DIR / "suites" / name / "suite.py").exists():
            found[name] = importlib.import_module(f"bench.suites.{name}.suite").run
    return found


def run_all(
    results_dir: Path = RESULTS_DIR,
    suites: dict[str, SuiteFn] | None = None,
    audit_source: audit_chain.AuditSource | None = None,
    only: list[str] | None = None,
) -> Path:
    os.environ["BENCH_RUN"] = "1"
    started = _utc_now()
    run_id = make_run_id(started, git_short_hash())
    out = results_dir / run_id
    out.mkdir(parents=True, exist_ok=True)
    (out / "artefacts").mkdir(exist_ok=True)
    registry = discover() if suites is None else suites
    versions = collect_versions()

    ops_file = (out / "ops.log.jsonl").open("w")

    def ops(event: str, **fields: Any) -> None:
        ops_file.write(json.dumps({"ts": _utc_now(), "event": event, **fields}, sort_keys=True))
        ops_file.write("\n")

    ops("run.start", run_id=run_id)
    results: list[dict[str, Any]] = []
    for name, display in PLANNED_SUITES.items():
        res: dict[str, Any] = {"name": display, "id": name}
        if only and name not in only:
            res |= {"status": "not run", "reason": "not selected for this run"}
        elif name not in registry:
            res |= {"status": "not run", "reason": "suite not implemented yet"}
        else:
            art = out / "artefacts" / name
            art.mkdir(parents=True, exist_ok=True)
            ctx = SuiteContext(run_id, out, art, ops, versions)
            ops("suite.start", suite=name)
            try:
                res |= {"status": "ran", **registry[name](ctx)}
            except NotRun as exc:
                res |= {"status": "not run", "reason": str(exc) or "suite reported not run"}
            except Exception as exc:  # noqa: BLE001 - recorded, never scored
                res |= {"status": "error", "reason": f"{type(exc).__name__}: {exc}"}
            ops("suite.end", suite=name, status=res["status"])
        results.append(res)
    finished = _utc_now()
    ops("run.end", run_id=run_id)
    ops_file.close()

    source = audit_source or audit_chain.default_source()
    summary = audit_chain.export(source, started, finished, out)
    report = {
        "run_id": run_id, "started_at": started, "finished_at": finished, "versions": versions,
        "suites": results, "audit": summary,
    }  # fmt: skip
    write_json(out, report)
    write_markdown(out, report)
    return out


def main(argv: list[str] | None = None) -> int:
    args = sys.argv[1:] if argv is None else argv
    out = run_all(only=args or None)
    print(f"bench results: {out}")
    return 0
