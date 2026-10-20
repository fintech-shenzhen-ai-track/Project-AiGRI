"""core.outbox: transactional emit, ordered publish, retries, dead-letter, crash recovery."""

import asyncio
from collections.abc import AsyncIterator
from typing import Any

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

from aigri.core import outbox

pytestmark = pytest.mark.db

TOPIC = "test.topic"


class SimulatedCrash(BaseException):
    """Not an Exception: it escapes the publisher like a killed process would."""


@pytest.fixture(autouse=True)
async def _clean(owner_engine: AsyncEngine) -> AsyncIterator[None]:
    outbox.clear_consumers()
    async with owner_engine.begin() as conn:
        await conn.execute(text("DELETE FROM outbox"))
    yield
    outbox.clear_consumers()
    async with owner_engine.begin() as conn:
        await conn.execute(text("DELETE FROM outbox"))


async def _emit(engine: AsyncEngine, n: int, topic: str = TOPIC) -> str:
    async with engine.begin() as conn:
        return await outbox.emit(conn, topic, {"n": n})


async def _rows(engine: AsyncEngine) -> list[Any]:
    async with engine.connect() as conn:
        return list(
            (
                await conn.execute(
                    text(
                        "SELECT payload->>'n' AS n, published_at, attempts, dead_at, last_error"
                        " FROM outbox ORDER BY created_at, id"
                    )
                )
            )
            .mappings()
            .all()
        )


class Recorder:
    """An idempotent consumer: effects are keyed by event id."""

    def __init__(self) -> None:
        self.deliveries: list[str] = []
        self.effects: dict[str, dict[str, Any]] = {}

    async def __call__(self, payload: dict[str, Any], event_id: str) -> None:
        self.deliveries.append(event_id)
        self.effects.setdefault(event_id, payload)


def _no_wait(_attempts: int) -> float:
    return 0.0


async def test_event_exists_only_if_the_transaction_commits(app_engine: AsyncEngine) -> None:
    async with app_engine.connect() as conn:
        trans = await conn.begin()
        await outbox.emit(conn, TOPIC, {"n": 1})
        await trans.rollback()
    assert await _rows(app_engine) == []


async def test_publishes_in_order_once(app_engine: AsyncEngine) -> None:
    rec = Recorder()
    outbox.register(TOPIC, "rec", rec)
    ids = [await _emit(app_engine, n) for n in range(5)]
    stats = await outbox.publish_pending(app_engine, backoff=_no_wait)
    assert stats.delivered == 5
    assert rec.deliveries == ids
    again = await outbox.publish_pending(app_engine, backoff=_no_wait)
    assert again.delivered == 0 and rec.deliveries == ids


async def test_topic_without_consumer_stays_pending(app_engine: AsyncEngine) -> None:
    await _emit(app_engine, 1)
    await outbox.publish_pending(app_engine, backoff=_no_wait)
    rows = await _rows(app_engine)
    assert rows[0]["published_at"] is None and rows[0]["attempts"] == 0


async def test_failure_is_retried_and_order_is_kept(app_engine: AsyncEngine) -> None:
    seen: list[str] = []
    calls = {"n": 0}

    async def flaky(payload: dict[str, Any], event_id: str) -> None:
        calls["n"] += 1
        if payload["n"] == 0 and calls["n"] <= 2:
            raise RuntimeError("boom")
        seen.append(str(payload["n"]))

    outbox.register(TOPIC, "flaky", flaky)
    for n in range(3):
        await _emit(app_engine, n)
    retry: dict[str, float] = {}
    first = await outbox.publish_pending(app_engine, backoff=_no_wait, retry_at=retry)
    assert (first.delivered, first.failed) == (0, 1) and seen == []  # event 1, 2 wait for 0
    await outbox.publish_pending(app_engine, backoff=_no_wait, retry_at=retry)
    third = await outbox.publish_pending(app_engine, backoff=_no_wait, retry_at=retry)
    assert third.delivered == 3 and seen == ["0", "1", "2"]
    rows = await _rows(app_engine)
    assert rows[0]["attempts"] == 3 and rows[0]["last_error"] is None


async def test_backoff_delays_the_retry(app_engine: AsyncEngine) -> None:
    async def always_fail(payload: dict[str, Any], event_id: str) -> None:
        raise RuntimeError("down")

    outbox.register(TOPIC, "x", always_fail)
    await _emit(app_engine, 1)
    retry: dict[str, float] = {}
    await outbox.publish_pending(app_engine, backoff=lambda _a: 3600.0, retry_at=retry)
    second = await outbox.publish_pending(app_engine, backoff=lambda _a: 3600.0, retry_at=retry)
    assert second.failed == 0  # still waiting out the back-off
    assert (await _rows(app_engine))[0]["attempts"] == 1


async def test_dead_letter_after_ten_attempts_unblocks_the_topic(app_engine: AsyncEngine) -> None:
    got: list[int] = []

    async def poison(payload: dict[str, Any], event_id: str) -> None:
        if payload["n"] == 0:
            raise ValueError("bad payload")
        got.append(payload["n"])

    outbox.register(TOPIC, "poison", poison)
    await _emit(app_engine, 0)
    await _emit(app_engine, 1)
    retry: dict[str, float] = {}
    for _ in range(outbox.MAX_ATTEMPTS + 1):
        await outbox.publish_pending(app_engine, backoff=_no_wait, retry_at=retry)
    rows = await _rows(app_engine)
    assert rows[0]["dead_at"] is not None and rows[0]["attempts"] == outbox.MAX_ATTEMPTS
    assert "bad payload" in rows[0]["last_error"] and rows[0]["published_at"] is None
    assert got == [1] and rows[1]["published_at"] is not None


async def test_crash_between_commit_and_publish_delivers_exactly_once(
    app_engine: AsyncEngine,
) -> None:
    rec = Recorder()
    crash = {"armed": True}

    async def crashing(payload: dict[str, Any], event_id: str) -> None:
        await rec(payload, event_id)
        if crash["armed"]:  # the process dies after the consumer ran, before "published"
            crash["armed"] = False
            raise SimulatedCrash

    outbox.register(TOPIC, "idem", crashing)
    event_id = await _emit(app_engine, 7)  # committed; the process dies before publishing
    with pytest.raises(SimulatedCrash):
        await outbox.publish_pending(app_engine, backoff=_no_wait)
    assert (await _rows(app_engine))[0]["published_at"] is None
    await outbox.publish_pending(app_engine, backoff=_no_wait)  # worker restarts
    assert (await _rows(app_engine))[0]["published_at"] is not None
    assert rec.deliveries == [event_id, event_id]  # at least once ...
    assert list(rec.effects) == [event_id]  # ... exactly once as an effect


async def test_crash_before_delivery_still_delivers(app_engine: AsyncEngine) -> None:
    rec = Recorder()
    outbox.register(TOPIC, "rec", rec)
    event_id = await _emit(app_engine, 1)
    # Nothing ran (the process died right after the commit); a later pass delivers.
    await outbox.publish_pending(app_engine, backoff=_no_wait)
    assert rec.deliveries == [event_id]


async def test_concurrent_publishers_do_not_duplicate(app_engine: AsyncEngine) -> None:
    rec = Recorder()
    outbox.register(TOPIC, "rec", rec)
    for n in range(20):
        await _emit(app_engine, n)
    await asyncio.gather(*(outbox.publish_pending(app_engine, backoff=_no_wait) for _ in range(4)))
    await outbox.publish_pending(app_engine, backoff=_no_wait)  # a pass that lost a lock retries
    assert len(rec.deliveries) == 20 == len(set(rec.deliveries))


async def test_publisher_waits_for_an_open_emitting_transaction(app_engine: AsyncEngine) -> None:
    """A later event must not be published ahead of an earlier one still uncommitted."""
    rec = Recorder()
    outbox.register(TOPIC, "rec", rec)
    async with app_engine.connect() as slow:
        trans = await slow.begin()
        first = await outbox.emit(slow, TOPIC, {"n": 1})  # earlier, not yet committed
        second = await _emit(app_engine, 2)  # later, committed
        stats = await outbox.publish_pending(app_engine, backoff=_no_wait)
        assert stats.delivered == 0 and rec.deliveries == []
        await trans.commit()
    await outbox.publish_pending(app_engine, backoff=_no_wait)
    assert rec.deliveries == [first, second]


async def test_non_json_payload_is_refused(app_engine: AsyncEngine) -> None:
    with pytest.raises(TypeError):
        async with app_engine.begin() as conn:
            await outbox.emit(conn, TOPIC, {"when": object()})
