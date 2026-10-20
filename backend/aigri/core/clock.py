"""Clock. Phase A stub: real UTC time only. Demo mode arrives in T-01.07."""

from datetime import UTC, datetime


def now() -> datetime:
    return datetime.now(UTC)
