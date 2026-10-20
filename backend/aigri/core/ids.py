"""Identifiers: UUIDv7 primary keys and human ids (D-35).

``uuid7`` follows RFC 9562 (48-bit millisecond timestamp, 12-bit counter for ordering within a
millisecond, random tail). It uses the real time, not the demo clock, so ids keep sorting in
creation order while the story clock is frozen. The 0001 table defaults still say
``gen_random_uuid()`` (v4); callers that care about v7 ordering pass ``uuid7()`` explicitly.

Human ids come from ``id_counters`` (migration ``0001_ids``). ``next_human_id`` increments the
counter row inside the caller's transaction: the row lock serialises concurrent callers and a
rollback undoes the increment, so numbers are gap-free (a PostgreSQL SEQUENCE is not).
"""

import os
import re
import secrets
import threading
import time
from dataclasses import dataclass
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from aigri.core import clock, packs

_lock = threading.Lock()
_last_ms = 0
_counter = 0


def uuid7() -> UUID:
    """A time-ordered UUID (version 7). Strictly increasing within one process."""
    global _last_ms, _counter
    with _lock:
        ms = time.time_ns() // 1_000_000
        if ms <= _last_ms:
            ms = _last_ms
            _counter += 1
            if _counter > 0xFFF:  # more than 4096 in one millisecond: borrow the next one
                ms += 1
                _counter = 0
        else:
            _counter = secrets.randbits(11)  # leave headroom so the counter rarely overflows
        _last_ms = ms
        counter = _counter
    rand_b = secrets.randbits(62)
    value = (ms & 0xFFFFFFFFFFFF) << 80 | 0x7 << 76 | counter << 64 | 0b10 << 62 | rand_b
    return UUID(int=value)


@dataclass(frozen=True)
class _Kind:
    prefix: str
    digits: int
    per_insurer: bool


# D-35. Policy Record keys (PR-<INS>-<CODE>-YYYY) are not a sequence: see ``policy_record_key``.
KINDS: dict[str, _Kind] = {
    "claim": _Kind("CLM", 6, False),
    "policy": _Kind("POL", 6, True),
    "payout": _Kind("PAY", 5, False),
    "dispute": _Kind("DSP", 4, False),
    "nudge": _Kind("NDG", 5, False),
}

_INS = re.compile(r"^[A-Z]{3}$")


def current_year(year: int | None = None) -> int:
    """The year in the default pack's time zone, from the platform clock."""
    if year is not None:
        return year
    from zoneinfo import ZoneInfo

    tz = ZoneInfo(packs.get_pack(os.environ.get("DEFAULT_PACK", "ID")).default_timezone.iana)
    return clock.now().astimezone(tz).year


def format_human_id(kind: str, number: int, *, year: int, insurer_code: str | None = None) -> str:
    spec = KINDS[kind]
    yy = f"{year % 100:02d}"
    num = f"{number:0{spec.digits}d}"
    if spec.per_insurer:
        assert insurer_code is not None
        return f"{spec.prefix}-{insurer_code}-{yy}-{num}"
    return f"{spec.prefix}-{yy}-{num}"


async def next_human_id(
    conn: AsyncConnection, kind: str, *, insurer_code: str | None = None, year: int | None = None
) -> str:
    """The next id of ``kind`` for the year (and insurer, for policies), in ``conn``'s transaction.

    Commit the caller's transaction to keep the number; roll back to release it.
    """
    if kind not in KINDS:
        raise ValueError(f"unknown id kind {kind!r}")
    spec = KINDS[kind]
    if spec.per_insurer:
        if insurer_code is None or not _INS.match(insurer_code):
            raise ValueError(f"{kind} ids need a 3-letter insurer code")
    elif insurer_code is not None:
        raise ValueError(f"{kind} ids are not per insurer")
    yr = current_year(year)
    number = (
        await conn.execute(
            text(
                "INSERT INTO id_counters (kind, scope, year, last_value)"
                " VALUES (:k, :s, :y, 1)"
                " ON CONFLICT (kind, scope, year)"
                " DO UPDATE SET last_value = id_counters.last_value + 1"
                " RETURNING last_value"
            ),
            {"k": kind, "s": insurer_code or "", "y": yr},
        )
    ).scalar_one()
    return format_human_id(kind, int(number), year=yr, insurer_code=insurer_code)


def policy_record_key(insurer_code: str, record_code: str, year: int) -> str:
    """``PR-<INS>-<CODE>-YYYY`` (D-35). ``record_code`` is the product code, e.g. ``AUTP``."""
    if not _INS.match(insurer_code):
        raise ValueError("insurer code must be 3 capital letters")
    if not record_code or re.search(r"\s|-", record_code):
        raise ValueError("record code must be non-empty without spaces or hyphens")
    return f"PR-{insurer_code}-{record_code}-{year:04d}"
