"""core.audit: chain, concurrency, tamper detection, export (T-01.06)."""

import asyncio
import json
from pathlib import Path

import pytest
from sqlalchemy import text
from sqlalchemy.exc import DBAPIError
from sqlalchemy.ext.asyncio import AsyncEngine

from aigri.core import audit
from aigri.core.hashing import GENESIS_HASH, entry_hash
from tests.conftest import TestDb

pytestmark = [pytest.mark.db, pytest.mark.usefixtures("fresh_audit")]


async def _append(engine: AsyncEngine, n: int, **kw: object) -> audit.AuditResult:
    async with engine.begin() as conn:
        return await audit.append(
            conn,
            actor_type="system",
            actor_label="test",
            action="test.event",
            object_type="thing",
            object_id=str(n),
            payload={"n": n},
            **kw,  # type: ignore[arg-type]
        )


async def test_first_entry_chains_from_genesis(app_engine: AsyncEngine) -> None:
    r = await _append(app_engine, 1)
    assert r.seq == 1
    async with app_engine.connect() as conn:
        rows = await audit.fetch_rows(conn)
    assert rows[0]["prev_hash"] == GENESIS_HASH
    assert rows[0]["hash"] == r.hash == entry_hash(GENESIS_HASH, {
        k: v for k, v in rows[0].items() if k not in ("prev_hash", "hash")
    })  # fmt: skip
    assert "actor_id" not in rows[0]  # absent optional fields are omitted, not null


async def test_sequential_chain_verifies(app_engine: AsyncEngine) -> None:
    for i in range(5):
        await _append(
            app_engine,
            i,
            tier=2,
            actor_id="00000000-0000-4000-8000-000000000001",
            membership_role="client",
        )
    async with app_engine.connect() as conn:
        res = await audit.verify(conn)
        assert res.ok and res.checked == 5
        assert (await audit.verify(conn, 2, 4)).ok


async def test_rollback_leaves_no_gap(app_engine: AsyncEngine) -> None:
    await _append(app_engine, 1)
    async with app_engine.connect() as conn:
        trans = await conn.begin()
        await audit.append(
            conn, actor_type="system", actor_label="t", action="a.b", object_type="x", object_id="1"
        )
        await trans.rollback()
    await _append(app_engine, 2)
    async with app_engine.connect() as conn:
        assert (await audit.verify(conn)).ok


async def test_1000_concurrent_appends_make_a_valid_chain(app_engine: AsyncEngine) -> None:
    results = await asyncio.gather(*(_append(app_engine, i) for i in range(1000)))
    assert sorted(r.seq for r in results) == list(range(1, 1001))
    async with app_engine.connect() as conn:
        res = await audit.verify(conn)
    assert res.ok and res.checked == 1000


async def _tamper(owner: AsyncEngine, sql: str, **params: object) -> None:
    async with owner.begin() as conn:
        await conn.execute(text("ALTER TABLE audit_events DISABLE TRIGGER USER"))
        await conn.execute(text(sql), params)
        await conn.execute(text("ALTER TABLE audit_events ENABLE TRIGGER USER"))


@pytest.mark.parametrize(
    ("sql", "expected_seq"),
    [
        ("UPDATE audit_events SET payload = '{\"n\": 99}' WHERE seq = 4", 4),
        ("UPDATE audit_events SET action = 'x.y' WHERE seq = 7", 7),
        ("UPDATE audit_events SET hash = 'sha256:' || repeat('a', 64) WHERE seq = 5", 5),
        ("DELETE FROM audit_events WHERE seq = 6", 7),  # the gap shows at the next row
        ("UPDATE audit_events SET prev_hash = 'sha256:' || repeat('b', 64) WHERE seq = 3", 3),
    ],
)
async def test_tampering_is_detected_at_the_right_seq(
    app_engine: AsyncEngine, owner_engine: AsyncEngine, sql: str, expected_seq: int
) -> None:
    for i in range(10):
        await _append(app_engine, i)
    await _tamper(owner_engine, sql)
    async with app_engine.connect() as conn:
        res = await audit.verify(conn)
        assert not res.ok and res.first_break_seq == expected_seq
        # A range that stops before the break still verifies.
        assert (await audit.verify(conn, 1, expected_seq - 1)).ok


async def test_app_role_cannot_rewrite(app_engine: AsyncEngine) -> None:
    await _append(app_engine, 1)
    async with app_engine.connect() as conn:
        with pytest.raises(DBAPIError):
            await conn.execute(text("UPDATE audit_events SET action = 'x'"))


async def test_export_rows_and_files(app_engine: AsyncEngine, tmp_path: Path) -> None:
    for i in range(3):
        await _append(app_engine, i, insurer_id="00000000-0000-4000-8000-0000000000aa")
    async with app_engine.connect() as conn:
        rows = await audit.fetch_rows(conn, "2000-01-01T00:00:00Z", "2999-01-01T00:00:00Z")
        assert await audit.fetch_rows(conn, "2999-01-01T00:00:00Z", None) == []
    assert [r["seq"] for r in rows] == [1, 2, 3]
    assert rows[0]["insurer_id"] == "00000000-0000-4000-8000-0000000000aa"
    # An independent reviewer recomputes the chain from the export alone.
    prev = rows[0]["prev_hash"]
    for r in rows:
        body = {k: v for k, v in r.items() if k not in ("prev_hash", "hash")}
        assert entry_hash(prev, body) == r["hash"]
        prev = r["hash"]
    summary = audit.write_export(rows, tmp_path)
    assert summary["last_hash"] == rows[-1]["hash"]
    lines = (tmp_path / "audit.jsonl").read_text().splitlines()
    assert json.loads(lines[1])["seq"] == 2
    chain = (tmp_path / "chain.txt").read_text()
    assert rows[0]["hash"] in chain and rows[-1]["hash"] in chain


async def test_sync_export_rows_for_the_bench(
    app_engine: AsyncEngine, test_db: TestDb, monkeypatch: pytest.MonkeyPatch
) -> None:
    for i in range(2):
        await _append(app_engine, i)
    monkeypatch.setenv("DATABASE_URL", test_db.app_url)
    rows = await asyncio.to_thread(
        audit.export_rows, "2000-01-01T00:00:00Z", "2999-01-01T00:00:00Z"
    )
    assert [r["seq"] for r in rows] == [1, 2]
    assert rows[1]["prev_hash"] == rows[0]["hash"]
    assert isinstance(rows[0]["payload"], dict)
