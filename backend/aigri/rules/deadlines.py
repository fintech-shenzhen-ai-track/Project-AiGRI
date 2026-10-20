"""Deadlines resolved from the record (FR-05.4)."""

from __future__ import annotations

from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from aigri.core import packs
from aigri.rules.model import DeadlineItem, DeadlineSet, LossEventFacts, PolicyRecordView


def local_date(value: date | datetime, tz: str) -> date:
    """A date as seen in the pack time zone (aware datetimes convert; naive ones are local)."""
    if isinstance(value, datetime):
        if value.tzinfo is not None:
            return value.astimezone(ZoneInfo(tz)).date()
        return value.date()
    return value


def add_days(start: date, days: int, *, business: bool) -> date:
    """Add calendar days, or Monday-Friday business days (public holidays are roadmap)."""
    if not business:
        return start + timedelta(days=days)
    current = start
    remaining = days
    while remaining > 0:
        current += timedelta(days=1)
        if current.weekday() < 5:
            remaining -= 1
    return current


def deadlines(
    record: PolicyRecordView,
    loss_event: LossEventFacts,
    notice_at: date | datetime | None = None,
    complete_at: date | datetime | None = None,
    decision_at: date | datetime | None = None,
    *,
    tz: str | None = None,
) -> DeadlineSet:
    """Every ``deadlines[]`` entry whose anchor is known, as a date in the pack time zone.
    Entries whose anchor has not happened yet are left out (``DeadlineSet.due`` gives None)."""
    zone = tz or packs.default_pack().default_timezone.iana
    anchors: dict[str, date | datetime | None] = {
        "loss_event_start": loss_event.started_on,
        "loss_event_end": loss_event.ended_on,
        "notice": notice_at,
        "complete_claim": complete_at,
        "decision": decision_at,
    }
    items: list[DeadlineItem] = []
    for rule in record.deadlines:
        anchor = anchors[rule.from_]
        if anchor is None:
            continue
        due = add_days(local_date(anchor, zone), rule.days, business=rule.day_kind == "business")
        items.append(
            DeadlineItem(
                event=rule.event,
                due=due,
                day_kind=rule.day_kind,
                clause=rule.clause.id if rule.clause else None,
                source=rule.source,
                text=rule.text,
            )
        )
    return DeadlineSet(items=tuple(items))
