"""Write backend/openapi.json from the FastAPI app (make openapi)."""

import json
import os
import sys
from pathlib import Path

os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://aigri_app:x@localhost/x")
os.environ.setdefault("DATABASE_OWNER_URL", "postgresql+asyncpg://aigri_owner:x@localhost/x")
os.environ.setdefault("SESSION_SECRET", "openapi-export-only-secret")

from aigri.api.app import create_app  # noqa: E402


def main() -> None:
    out = Path(sys.argv[1] if len(sys.argv) > 1 else "openapi.json")
    out.write_text(json.dumps(create_app().openapi(), indent=2, sort_keys=True) + "\n")


if __name__ == "__main__":
    main()
