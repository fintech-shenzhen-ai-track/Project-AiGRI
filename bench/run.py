"""Entry point for `make bench` (cwd is backend/). Writes bench/results/<run-id>/."""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
for p in (ROOT, ROOT / "backend"):
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

from bench.runner import main  # noqa: E402

if __name__ == "__main__":
    raise SystemExit(main())
