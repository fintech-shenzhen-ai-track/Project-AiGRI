"""Platform clock (FR-01.9). The only module allowed to read the system time.

Real mode returns UTC wall time. Demo mode returns the stored story time, frozen, so deadlines,
SLAs and alerts behave as on the story day. The state lives in the ``clock_state`` table (one row,
id = 1); each process keeps a cached copy that ``refresh`` reloads. Moving the clock writes
``clock.moved`` and is allowed only when ``SANDBOX=true``: both are done by the caller
(T-01.17), not here.
"""

from datetime import UTC, datetime
from typing import Literal

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

Mode = Literal["real", "demo"]

_mode: Mode = "real"
_story_now: datetime | None = None


def now() -> datetime:
    """Current platform time, timezone-aware UTC."""
    if _mode == "demo" and _story_now is not None:
        return _story_now
    return datetime.now(UTC)


def mode() -> Mode:
    return _mode


def state() -> tuple[Mode, datetime | None]:
    """The cached ``(mode, story_now)`` pair."""
    return _mode, _story_now


def _utc(value: datetime) -> datetime:
    if value.tzinfo is None or value.utcoffset() is None:
        raise ValueError("story time must be timezone-aware")
    return value.astimezone(UTC)


def configure(new_mode: Mode, story_now: datetime | None) -> None:
    """Set the cached state. Demo mode needs a story time."""
    global _mode, _story_now
    if new_mode not in ("real", "demo"):
        raise ValueError(f"unknown clock mode: {new_mode!r}")
    story = _utc(story_now) if story_now is not None else None
    if new_mode == "demo" and story is None:
        raise ValueError("demo mode needs a story time")
    _mode, _story_now = new_mode, story


def set_story_now(story_now: datetime) -> None:
    """Switch to demo mode at ``story_now``."""
    configure("demo", story_now)


def set_real() -> None:
    """Return to the wall clock."""
    configure("real", None)


async def refresh(conn: AsyncConnection) -> None:
    """Reload the cached state from ``clock_state``."""
    row = (await conn.execute(text("SELECT mode, story_now FROM clock_state WHERE id = 1"))).first()
    if row is None:
        set_real()
        return
    row_mode, story = row
    if row_mode == "demo" and story is not None:
        configure("demo", story)
    else:
        configure("real", story)


async def store(conn: AsyncConnection, new_mode: Mode, story_now: datetime | None) -> None:
    """Persist and apply a new state. The caller commits and writes ``clock.moved``."""
    configure(new_mode, story_now)
    await conn.execute(
        text(
            "UPDATE clock_state SET mode = :mode, story_now = :story, updated_at = :ts WHERE id = 1"
        ),
        {"mode": new_mode, "story": _story_now, "ts": now()},
    )
