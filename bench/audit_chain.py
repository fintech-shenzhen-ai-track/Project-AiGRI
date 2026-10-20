"""Audit Log chain: canonical JSON, hashing, export files and independent verification.

Follows specs/00-shared/hashing-and-audit.md:
  hash = "sha256:" + hex(SHA-256(prev_hash_bytes || JCS(entry)))
prev_hash_bytes is the 32 raw bytes of the previous hash's hex digest (the part after "sha256:").
core.hashing / core.audit (T-01.05, T-01.06) are not merged; this module is the bench-side copy
used to export and re-verify a run. Swap `canonical_json` for core.hashing when it lands.
Hashed payloads carry integers and strings only (spec rule), so the JCS subset below
(sorted keys, no whitespace, UTF-8 unescaped) is exact for them; floats are rejected.
"""

from __future__ import annotations

import hashlib
import json
from collections.abc import Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Protocol

GENESIS = "sha256:" + "0" * 64
ENTRY_FIELDS = (
    "seq", "ts", "actor_type", "actor_id", "actor_label", "membership_role", "tier",
    "action", "object_type", "object_id", "insurer_id", "client_id", "payload",
)  # fmt: skip


def _reject_floats(v: Any) -> None:
    if isinstance(v, float):
        raise TypeError("floats are not allowed in hashed payloads")
    if isinstance(v, dict):
        for x in v.values():
            _reject_floats(x)
    elif isinstance(v, list | tuple):
        for x in v:
            _reject_floats(x)


def canonical_json(obj: Any) -> bytes:
    _reject_floats(obj)
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def entry_hash(prev_hash: str, entry: dict[str, Any]) -> str:
    prev = bytes.fromhex(prev_hash.removeprefix("sha256:"))
    body = {k: entry[k] for k in ENTRY_FIELDS if k in entry}
    return "sha256:" + hashlib.sha256(prev + canonical_json(body)).hexdigest()


@dataclass
class VerifyResult:
    ok: bool
    rows: int
    first_break_seq: int | None = None
    reason: str = ""


def verify_rows(rows: Sequence[dict[str, Any]], prev_hash: str = GENESIS) -> VerifyResult:
    prev = prev_hash
    for r in rows:
        if r.get("prev_hash", prev) != prev:
            return VerifyResult(False, len(rows), r.get("seq"), "prev_hash does not match")
        h = entry_hash(prev, r)
        if r.get("hash") != h:
            return VerifyResult(False, len(rows), r.get("seq"), "hash does not match")
        prev = h
    return VerifyResult(True, len(rows))


class AuditSource(Protocol):
    """Interface for the Audit Log export. The real one wraps aigri.core.audit (T-01.06)."""

    def fetch_rows(self, from_ts: str, to_ts: str) -> list[dict[str, Any]]: ...


class UnavailableSource:
    """Used when no Audit Log is reachable; the export then says "not available" with the reason."""

    def __init__(self, reason: str) -> None:
        self.reason = reason

    def fetch_rows(self, from_ts: str, to_ts: str) -> list[dict[str, Any]]:
        raise LookupError(self.reason)


class FakeAuditSource:
    """Spec-following in-memory chain. Fake for core.audit until feature 01 phase B merges."""

    def __init__(self) -> None:
        self.rows: list[dict[str, Any]] = []

    def append(
        self, ts: str, action: str, payload: dict[str, Any] | None = None, **kw: Any
    ) -> None:
        prev = self.rows[-1]["hash"] if self.rows else GENESIS
        entry: dict[str, Any] = {
            "seq": len(self.rows) + 1, "ts": ts, "actor_type": "system", "actor_id": "fake",
            "actor_label": "fake", "action": action, "object_type": "none", "object_id": "none",
            "payload": payload or {}, **kw,
        }  # fmt: skip
        entry["prev_hash"] = prev
        entry["hash"] = entry_hash(prev, entry)
        self.rows.append(entry)

    def fetch_rows(self, from_ts: str, to_ts: str) -> list[dict[str, Any]]:
        return list(self.rows)  # the fake ignores the time range


def default_source() -> AuditSource:
    """The real export when core.audit provides one, else an explicit "not available"."""
    try:
        from aigri.core import audit  # type: ignore[attr-defined]

        fn = getattr(audit, "export_rows", None)
    except ImportError:
        fn = None
    if fn is None:
        return UnavailableSource("aigri.core.audit export is not merged yet (T-01.06)")

    class _Real:
        def fetch_rows(self, from_ts: str, to_ts: str) -> list[dict[str, Any]]:
            return list(fn(from_ts, to_ts))

    return _Real()


def export(source: AuditSource, from_ts: str, to_ts: str, out_dir: Path) -> dict[str, Any]:
    """Write audit.jsonl and chain.txt; return a summary for the report."""
    try:
        rows = source.fetch_rows(from_ts, to_ts)
    except Exception as exc:  # noqa: BLE001 - any failure is reported, never estimated
        reason = str(exc) or type(exc).__name__
        (out_dir / "audit.jsonl").write_text("")
        (out_dir / "chain.txt").write_text(f"status: not available\nreason: {reason}\n")
        return {"status": "not available", "reason": reason, "rows": 0}
    lines = (json.dumps(r, sort_keys=True, ensure_ascii=False) for r in rows)
    (out_dir / "audit.jsonl").write_text("".join(f"{ln}\n" for ln in lines))
    prev_of_first = rows[0].get("prev_hash", GENESIS) if rows else GENESIS
    res = verify_rows(rows, prev_of_first)
    chain = [
        "status: " + ("verified" if res.ok else "broken"),
        f"range: {from_ts} .. {to_ts}",
        f"rows: {len(rows)}",
        f"prev_hash_of_first: {prev_of_first}",
        f"first_hash: {rows[0]['hash'] if rows else 'none'}",
        f"last_hash: {rows[-1]['hash'] if rows else 'none'}",
    ]
    if not res.ok:
        chain.append(f"first_break_seq: {res.first_break_seq} ({res.reason})")
    (out_dir / "chain.txt").write_text("\n".join(chain) + "\n")
    return {"status": "verified" if res.ok else "broken", "rows": len(rows), "reason": res.reason}


def read_rows(path: Path) -> list[dict[str, Any]]:
    return [json.loads(x) for x in path.read_text().splitlines() if x.strip()]
