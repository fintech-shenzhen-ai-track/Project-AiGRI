"""Audit Log: the hash chain of ``audit_events`` (FR-01.11, hashing-and-audit.md).

``append`` is the only writer of ``audit_events``. It runs inside the caller's transaction and
takes a transaction-scoped advisory lock, so ``seq`` and ``prev_hash`` never fork. ``seq`` is
``last seq + 1`` read under that lock (not the bigserial default), so a rolled-back transaction
leaves no gap. The app role has INSERT and SELECT only, and a trigger rejects UPDATE, DELETE and
TRUNCATE for every role, the owner included.

Demo reset (feature 15) cannot truncate the table: it drops and recreates the database (the
supported path), or an owner may disable the triggers explicitly in a maintenance script.

Entry fields that are absent (``None``) are omitted from the hashed entry, not written as
``null`` (hashing rules). ``ts`` is UTC ISO 8601 with ``Z`` at second precision.
"""

import asyncio
import json
import os
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import asyncpg
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from aigri.core import clock
from aigri.core.hashing import GENESIS_HASH, entry_hash

# Arbitrary fixed key for the chain's advisory lock ("AIGRI AUDIT").
ADVISORY_LOCK_KEY = 0x41494752_41554454 & 0x7FFFFFFFFFFFFFFF

ACTOR_TYPES = ("person", "agent", "system", "wallet", "rule")
ENTRY_FIELDS = (
    "seq", "ts", "actor_type", "actor_id", "actor_label", "membership_role", "tier",
    "action", "object_type", "object_id", "insurer_id", "client_id", "payload",
)  # fmt: skip
_COLUMNS = ", ".join((*ENTRY_FIELDS, "prev_hash", "hash"))


def format_ts(value: datetime) -> str:
    """UTC ISO 8601 with ``Z``, second precision."""
    return value.astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")


def _entry_from_row(row: Any) -> dict[str, Any]:
    """The hashed entry for a stored row: ``None`` fields omitted, ids as strings."""
    entry: dict[str, Any] = {}
    for name in ENTRY_FIELDS:
        value = row[name]
        if value is None:
            continue
        if name == "ts":
            value = format_ts(value)
        elif name in ("actor_id", "insurer_id", "client_id"):
            value = str(value)
        elif name == "payload" and isinstance(value, str):
            value = json.loads(value)
        entry[name] = value
    return entry


@dataclass(frozen=True)
class AuditResult:
    seq: int
    hash: str


async def append(
    conn: AsyncConnection,
    *,
    actor_type: str,
    actor_label: str,
    action: str,
    object_type: str,
    object_id: str,
    payload: dict[str, Any] | None = None,
    actor_id: str | None = None,
    membership_role: str | None = None,
    tier: int | None = None,
    insurer_id: str | None = None,
    client_id: str | None = None,
) -> AuditResult:
    """Append one entry in the caller's transaction and return its ``seq`` and ``hash``."""
    if actor_type not in ACTOR_TYPES:
        raise ValueError(f"unknown actor_type {actor_type!r}")
    if tier is not None and not 0 <= tier <= 3:
        raise ValueError("tier must be 0..3")
    await conn.execute(text("SELECT pg_advisory_xact_lock(:k)"), {"k": ADVISORY_LOCK_KEY})
    last = (
        await conn.execute(text("SELECT seq, hash FROM audit_events ORDER BY seq DESC LIMIT 1"))
    ).first()
    seq = 1 if last is None else int(last[0]) + 1
    prev_hash = GENESIS_HASH if last is None else str(last[1])

    ts = clock.now().astimezone(UTC).replace(microsecond=0)
    entry: dict[str, Any] = {
        "seq": seq,
        "ts": format_ts(ts),
        "actor_type": actor_type,
        "actor_label": actor_label,
        "action": action,
        "object_type": object_type,
        "object_id": object_id,
        "payload": payload or {},
    }
    optional = {
        "actor_id": actor_id,
        "membership_role": membership_role,
        "tier": tier,
        "insurer_id": insurer_id,
        "client_id": client_id,
    }
    entry.update(
        {k: (str(v) if k.endswith("_id") else v) for k, v in optional.items() if v is not None}
    )
    digest = entry_hash(prev_hash, entry)
    await conn.execute(
        text(
            "INSERT INTO audit_events (seq, ts, actor_type, actor_id, actor_label, membership_role,"
            " tier, action, object_type, object_id, insurer_id, client_id, payload,"
            " prev_hash, hash)"
            " VALUES (:seq, :ts, :actor_type, CAST(:actor_id AS uuid), :actor_label,"
            " :membership_role, :tier, :action, :object_type, :object_id,"
            " CAST(:insurer_id AS uuid), CAST(:client_id AS uuid), CAST(:payload AS jsonb),"
            " :prev_hash, :hash)"
        ),
        {
            "seq": seq,
            "ts": ts,
            "actor_type": actor_type,
            "actor_id": optional["actor_id"],
            "actor_label": actor_label,
            "membership_role": membership_role,
            "tier": tier,
            "action": action,
            "object_type": object_type,
            "object_id": object_id,
            "insurer_id": optional["insurer_id"],
            "client_id": optional["client_id"],
            "payload": json.dumps(entry["payload"]),
            "prev_hash": prev_hash,
            "hash": digest,
        },
    )
    return AuditResult(seq=seq, hash=digest)


@dataclass(frozen=True)
class VerifyResult:
    ok: bool
    checked: int
    first_break_seq: int | None = None
    reason: str = ""


_BATCH = 1000


async def verify(
    conn: AsyncConnection, from_seq: int | None = None, to_seq: int | None = None
) -> VerifyResult:
    """Recompute the chain over ``[from_seq, to_seq]`` (defaults: the whole chain).

    Returns the first break (``first_break_seq``) or ``ok``. A break is a row whose stored hash
    differs from the recomputed one, whose ``prev_hash`` is not the previous row's hash, or a gap
    in ``seq`` (reported at the first seq after the gap). The caller writes
    ``audit.chain_verified``.
    """
    start = from_seq if from_seq is not None else 1
    prev_hash: str | None = None
    expected_seq = start
    if start > 1:
        anchor = (
            await conn.execute(
                text("SELECT hash FROM audit_events WHERE seq = :s"), {"s": start - 1}
            )
        ).first()
        if anchor is None:
            first = (
                await conn.execute(
                    text("SELECT min(seq) FROM audit_events WHERE seq >= :s"), {"s": start}
                )
            ).scalar()
            if first is None:
                return VerifyResult(True, 0)
            return VerifyResult(False, 0, int(first), "seq before the range is missing")
        prev_hash = str(anchor[0])
    else:
        prev_hash = GENESIS_HASH
    checked = 0
    cursor = start - 1
    while True:
        params: dict[str, Any] = {"c": cursor, "n": _BATCH, "t": to_seq}
        rows = (
            (
                await conn.execute(
                    text(
                        f"SELECT {_COLUMNS} FROM audit_events WHERE seq > :c"
                        " AND (CAST(:t AS bigint) IS NULL OR seq <= :t) ORDER BY seq LIMIT :n"
                    ),
                    params,
                )
            )
            .mappings()
            .all()
        )
        if not rows:
            return VerifyResult(True, checked)
        for row in rows:
            seq = int(row["seq"])
            if seq != expected_seq:
                return VerifyResult(False, checked, seq, "gap in seq")
            if row["prev_hash"] != prev_hash:
                return VerifyResult(False, checked, seq, "prev_hash does not match")
            if entry_hash(str(row["prev_hash"]), _entry_from_row(row)) != row["hash"]:
                return VerifyResult(False, checked, seq, "hash does not match")
            prev_hash = str(row["hash"])
            expected_seq += 1
            checked += 1
        cursor = int(rows[-1]["seq"])


def _row_dict(row: Any) -> dict[str, Any]:
    d = _entry_from_row(row)
    d["prev_hash"] = row["prev_hash"]
    d["hash"] = row["hash"]
    return d


def _parse_ts(value: str | datetime | None) -> datetime | None:
    if value is None or isinstance(value, datetime):
        return value
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


async def fetch_rows(
    conn: AsyncConnection,
    from_ts: str | datetime | None = None,
    to_ts: str | datetime | None = None,
) -> list[dict[str, Any]]:
    """Rows with ``from_ts <= ts <= to_ts`` in seq order, as export dicts
    (the hashed entry fields, ``None`` omitted, plus ``prev_hash`` and ``hash``)."""
    rows = (
        (
            await conn.execute(
                text(
                    f"SELECT {_COLUMNS} FROM audit_events"
                    " WHERE (CAST(:f AS timestamptz) IS NULL OR ts >= :f)"
                    " AND (CAST(:t AS timestamptz) IS NULL OR ts <= :t) ORDER BY seq"
                ),
                {"f": _parse_ts(from_ts), "t": _parse_ts(to_ts)},
            )
        )
        .mappings()
        .all()
    )
    return [_row_dict(r) for r in rows]


def export_rows(from_ts: str, to_ts: str) -> list[dict[str, Any]]:
    """Synchronous export for the bench (``bench/audit_chain.py``): opens its own connection to
    ``DATABASE_URL``. Do not call from inside a running event loop; use ``fetch_rows`` there."""
    dsn = os.environ["DATABASE_URL"].replace("postgresql+asyncpg://", "postgresql://")

    async def run() -> list[dict[str, Any]]:
        conn = await asyncpg.connect(dsn)
        try:
            records = await conn.fetch(
                f"SELECT {_COLUMNS} FROM audit_events WHERE ts >= $1 AND ts <= $2 ORDER BY seq",
                _parse_ts(from_ts),
                _parse_ts(to_ts),
            )
        finally:
            await conn.close()
        out = []
        for rec in records:
            d = dict(rec)
            d["payload"] = (
                json.loads(d["payload"]) if isinstance(d["payload"], str) else d["payload"]
            )
            out.append(_row_dict(d))
        return out

    return asyncio.run(run())


def write_export(rows: Sequence[dict[str, Any]], out_dir: Path) -> dict[str, Any]:
    """Write ``audit.jsonl`` and ``chain.txt`` (first and last hash) so a reviewer can recompute."""
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "audit.jsonl").write_text(
        "".join(json.dumps(r, sort_keys=True, ensure_ascii=False) + "\n" for r in rows),
        encoding="utf-8",
    )
    first = rows[0]["hash"] if rows else "none"
    last = rows[-1]["hash"] if rows else "none"
    prev_of_first = rows[0]["prev_hash"] if rows else GENESIS_HASH
    (out_dir / "chain.txt").write_text(
        f"rows: {len(rows)}\nprev_hash_of_first: {prev_of_first}\nfirst_hash: {first}\n"
        f"last_hash: {last}\n",
        encoding="utf-8",
    )
    return {"rows": len(rows), "first_hash": first, "last_hash": last}
