"""T-05.11: `aigri/rules` keeps 100% branch coverage. Part of `make test`; a drop fails the run.

The gate runs the rules tests in a child pytest, so other modules' coverage never counts and the
gate holds even when the parent run is only a subset of the suite.
"""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent


def test_rules_branch_coverage_is_100_percent(tmp_path: Path) -> None:
    env = {**os.environ, "COVERAGE_FILE": str(tmp_path / ".coverage")}
    cmd = [
        sys.executable,
        "-m",
        "pytest",
        "tests/rules",
        "-q",
        "-p",
        "no:cacheprovider",
        "--cov=aigri/rules",
        "--cov-branch",
        "--cov-report=term-missing",
        "--cov-fail-under=100",
    ]
    result = subprocess.run(cmd, cwd=BACKEND, env=env, capture_output=True, text=True, check=False)
    assert result.returncode == 0, result.stdout[-3000:] + result.stderr[-1000:]
