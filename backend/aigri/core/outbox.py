"""Transactional outbox (FR-01.12, D-32).

``emit`` writes an event in the caller's transaction, so the event exists if and only if the
change that announces it commits. The worker's ``publish_pending`` delivers committed events to
the registered consumers at least once, in order per topic, retries failures, and parks an event
in the dead-letter state (``dead_at``) after ``MAX_ATTEMPTS`` failed attempts.

Delivery is at least once: a crash after a consumer ran but before the event is marked published
redelivers it. Consumers must be idempotent; each receives the event id to deduplicate on, which
makes the effect exactly once.

Ordering: ``emit`` stamps ``created_at`` with ``clock_timestamp()`` and holds a shared advisory
lock for the topic until its transaction ends; the publisher takes the exclusive lock, so it never
reads a topic while an emitting transaction is still open and never publishes a later event
ahead of an earlier one that has not committed yet. A topic with no registered consumer in the
publishing process stays pending (events are never dropped). Retry back-off is kept in the publisher
process (a restart retries at once), so no extra column is needed.
"""

import importlib
import json
import logging
import time
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection, AsyncEngine

from aigri.core import clock

log = logging.getLogger("aigri.outbox")

MAX_ATTEMPTS = 10

Handler = Callable[[dict[str, Any], str], Awaitable[None]]  # (payload, event_id)

# Modules that register consumers at import time. Each feature adds one line (like ROUTER_MODULES).
CONSUMER_MODULES: list[str] = []

_consumers: dict[str, dict[str, Handler]] = {}


def register(topic: str, name: str, handler: Handler) -> None:
    """Register an idempotent consumer. ``name`` identifies it in logs and errors."""
    _consumers.setdefault(topic, {})[name] = handler


def clear_consumers() -> None:
    _consumers.clear()


def load_consumers() -> None:
    for module in CONSUMER_MODULES:
        importlib.import_module(module)


def default_backoff(attempts: int) -> float:
    """Seconds to wait after the ``attempts``-th failure: 1, 2, 4 ... capped at 5 minutes."""
    return float(min(2 ** (attempts - 1), 300))


async def emit(conn: AsyncConnection, topic: str, payload: dict[str, Any]) -> str:
    """Write an event in the caller's transaction. Returns the event id."""
    body = json.dumps(payload)  # raises on anything that is not plain JSON
    await conn.execute(
        text("SELECT pg_advisory_xact_lock_shared(hashtextextended(:k, 0))"),
        {"k": f"outbox:{topic}"},
    )
    row = await conn.execute(
        text(
            "INSERT INTO outbox (topic, payload, created_at)"
            " VALUES (:t, CAST(:p AS jsonb), clock_timestamp()) RETURNING id"
        ),
        {"t": topic, "p": body},
    )
    return str(row.scalar_one())


@dataclass
class PublishStats:
    delivered: int = 0
    failed: int = 0
    dead: int = 0


async def publish_pending(
    engine: AsyncEngine,
    *,
    backoff: Callable[[int], float] = default_backoff,
    retry_at: dict[str, float] | None = None,
    max_events: int = 1000,
) -> PublishStats:
    """One pass over every topic with pending events.

    ``retry_at`` maps event id to a ``time.monotonic()`` deadline; the worker passes the same
    dict on every pass so back-off survives between passes.
    """
    retry_at = {} if retry_at is None else retry_at
    stats = PublishStats()
    async with engine.connect() as conn:
        topics = [
            r[0]
            for r in await conn.execute(
                text(
                    "SELECT DISTINCT topic FROM outbox"
                    " WHERE published_at IS NULL AND dead_at IS NULL"
                )
            )
        ]
    for topic in topics:
        while stats.delivered + stats.failed + stats.dead < max_events:
            outcome = await _publish_one(engine, topic, backoff, retry_at, stats)
            if outcome != "continue":
                break
    return stats


async def _publish_one(
    engine: AsyncEngine,
    topic: str,
    backoff: Callable[[int], float],
    retry_at: dict[str, float],
    stats: PublishStats,
) -> str:
    """Deliver the oldest pending event of ``topic`` in its own transaction.

    Returns ``"continue"`` when the next event may be tried, else ``"stop"``.
    """
    if not _consumers.get(topic):
        return "stop"  # nobody registered here yet: keep the events pending, never drop them
    async with engine.begin() as conn:
        got = (
            await conn.execute(
                text("SELECT pg_try_advisory_xact_lock(hashtextextended(:k, 0))"),
                {"k": f"outbox:{topic}"},
            )
        ).scalar_one()
        if not got:
            return "stop"  # an emitter or another publisher is active on this topic
        row = (
            await conn.execute(
                text(
                    "SELECT id, payload, attempts FROM outbox WHERE topic = :t"
                    " AND published_at IS NULL AND dead_at IS NULL"
                    " ORDER BY created_at, id LIMIT 1 FOR UPDATE"
                ),
                {"t": topic},
            )
        ).first()
        if row is None:
            return "stop"
        event_id, payload, attempts = str(row[0]), row[1], int(row[2])
        if isinstance(payload, str):
            payload = json.loads(payload)
        if retry_at.get(event_id, 0.0) > time.monotonic():
            return "stop"  # waiting out a back-off; later events of the topic wait too
        try:
            for name, handler in list(_consumers.get(topic, {}).items()):
                try:
                    await handler(payload, event_id)
                except Exception as exc:
                    raise _ConsumerError(name, exc) from exc
        except _ConsumerError as failure:
            attempts += 1
            error = f"{failure.consumer}: {type(failure.cause).__name__}: {failure.cause}"[:1000]
            dead = attempts >= MAX_ATTEMPTS
            await conn.execute(
                text(
                    "UPDATE outbox SET attempts = :a, last_error = :e,"
                    " dead_at = CASE WHEN CAST(:dead AS boolean)"
                    " THEN CAST(:now AS timestamptz) END WHERE id = CAST(:i AS uuid)"
                ),
                {"a": attempts, "e": error, "dead": dead, "now": clock.now(), "i": event_id},
            )
            if dead:
                log.error("outbox event %s on %s dead-lettered: %s", event_id, topic, error)
                retry_at.pop(event_id, None)
                stats.dead += 1
                return "continue"  # a dead letter no longer blocks the topic
            retry_at[event_id] = time.monotonic() + backoff(attempts)
            stats.failed += 1
            return "stop"  # keep order: retry this event before any later one
        await conn.execute(
            text(
                "UPDATE outbox SET published_at = :now, attempts = attempts + 1,"
                " last_error = NULL WHERE id = CAST(:i AS uuid)"
            ),
            {"now": clock.now(), "i": event_id},
        )
        retry_at.pop(event_id, None)
        stats.delivered += 1
        return "continue"


class _ConsumerError(Exception):
    def __init__(self, consumer: str, cause: Exception) -> None:
        super().__init__(str(cause))
        self.consumer = consumer
        self.cause = cause
