"""core.ids: UUIDv7 and D-35 human ids, gap-free under concurrency."""

import asyncio
from collections.abc import AsyncIterator

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

from aigri.core import ids


def test_uuid7_shape_and_ordering() -> None:
    values = [ids.uuid7() for _ in range(10_000)]
    assert all(v.version == 7 for v in values)
    assert all((v.int >> 62) & 0b11 == 0b10 for v in values)  # RFC 4122 variant
    assert values == sorted(values)
    assert len(set(values)) == len(values)


def test_format_human_id_d35() -> None:
    assert ids.format_human_id("claim", 418, year=2026) == "CLM-26-000418"
    assert ids.format_human_id("policy", 4127, year=2026, insurer_code="JSD") == "POL-JSD-26-004127"
    assert ids.format_human_id("payout", 7, year=2026) == "PAY-26-00007"
    assert ids.format_human_id("dispute", 12, year=2026) == "DSP-26-0012"
    assert ids.format_human_id("nudge", 3, year=2026) == "NDG-26-00003"
    assert ids.format_human_id("claim", 1_234_567, year=2026) == "CLM-26-1234567"  # widens


def test_policy_record_key() -> None:
    assert ids.policy_record_key("JSD", "AUTP", 2026) == "PR-JSD-AUTP-2026"
    with pytest.raises(ValueError):
        ids.policy_record_key("jsd", "AUTP", 2026)


@pytest.fixture
async def _clean(owner_engine: AsyncEngine) -> AsyncIterator[None]:
    async with owner_engine.begin() as conn:
        await conn.execute(text("DELETE FROM id_counters"))
    yield
    async with owner_engine.begin() as conn:
        await conn.execute(text("DELETE FROM id_counters"))


async def _next(engine: AsyncEngine, kind: str, **kw: object) -> str:
    async with engine.begin() as conn:
        return await ids.next_human_id(conn, kind, **kw)  # type: ignore[arg-type]


@pytest.mark.db
@pytest.mark.usefixtures("_clean")
async def test_sequences_are_per_kind_insurer_and_year(app_engine: AsyncEngine) -> None:
    assert await _next(app_engine, "claim", year=2026) == "CLM-26-000001"
    assert await _next(app_engine, "claim", year=2026) == "CLM-26-000002"
    assert await _next(app_engine, "claim", year=2027) == "CLM-27-000001"
    assert await _next(app_engine, "payout", year=2026) == "PAY-26-00001"
    assert await _next(app_engine, "policy", insurer_code="JSD", year=2026) == "POL-JSD-26-000001"
    assert await _next(app_engine, "policy", insurer_code="ASK", year=2026) == "POL-ASK-26-000001"
    assert await _next(app_engine, "policy", insurer_code="JSD", year=2026) == "POL-JSD-26-000002"


@pytest.mark.db
@pytest.mark.usefixtures("_clean")
async def test_year_comes_from_the_platform_clock(app_engine: AsyncEngine) -> None:
    from datetime import UTC, datetime

    from aigri.core import clock

    try:
        # 31 Dec 2026 18:00 UTC is already 2027 in Jakarta (WIB, UTC+7).
        clock.set_story_now(datetime(2026, 12, 31, 18, 0, tzinfo=UTC))
        assert await _next(app_engine, "claim") == "CLM-27-000001"
    finally:
        clock.set_real()


@pytest.mark.db
@pytest.mark.usefixtures("_clean")
async def test_rollback_releases_the_number(app_engine: AsyncEngine) -> None:
    async with app_engine.connect() as conn:
        trans = await conn.begin()
        assert await ids.next_human_id(conn, "claim", year=2026) == "CLM-26-000001"
        await trans.rollback()
    assert await _next(app_engine, "claim", year=2026) == "CLM-26-000001"


@pytest.mark.db
@pytest.mark.usefixtures("_clean")
async def test_gap_free_under_concurrency_with_rollbacks(app_engine: AsyncEngine) -> None:
    async def one(i: int) -> str | None:
        async with app_engine.connect() as conn:
            trans = await conn.begin()
            value = await ids.next_human_id(conn, "claim", year=2026)
            if i % 5 == 0:  # every fifth caller fails after taking a number
                await trans.rollback()
                return None
            await trans.commit()
            return value

    results = [r for r in await asyncio.gather(*(one(i) for i in range(200))) if r]
    numbers = sorted(int(r.rsplit("-", 1)[1]) for r in results)
    assert len(results) == 160
    assert numbers == list(range(1, 161))  # no gaps, no duplicates


@pytest.mark.db
async def test_bad_arguments(app_engine: AsyncEngine) -> None:
    async with app_engine.connect() as conn:
        with pytest.raises(ValueError):
            await ids.next_human_id(conn, "policy")
        with pytest.raises(ValueError):
            await ids.next_human_id(conn, "claim", insurer_code="JSD")
        with pytest.raises(ValueError):
            await ids.next_human_id(conn, "nope")
