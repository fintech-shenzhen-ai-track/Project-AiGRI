"""Behaviour beyond the gold tables: per-policy thresholds, time zones, canonical JSON."""

from __future__ import annotations

from datetime import UTC, date, datetime
from decimal import Decimal

import pytest
import rfc8785

from aigri.rules import VERSION
from aigri.rules.amount import payout_for_pct, proposed_amount
from aigri.rules.categories import loss_category
from aigri.rules.deadlines import deadlines
from aigri.rules.model import (
    AssetFacts,
    Line,
    LossEventFacts,
    PolicyFacts,
    PolicyRecordView,
)
from aigri.rules.sum_insured import sum_insured
from aigri.rules.trail import canonical_json

from .records import jasindo_rfd, staged_record

POLICY = PolicyFacts("P", "PR-JSD-RFD-2026", date(2026, 1, 1), date(2026, 12, 31), ("A", "B"))


def _record(**deductible: str) -> PolicyRecordView:
    body = jasindo_rfd()
    body["deductible"] = {"clause": {"id": "6.2"}, "pct": "10", "applies": "per_policy"} | {
        "kind": "franchise",
        **deductible,
    }
    return PolicyRecordView.from_body(body)


def test_per_policy_franchise_uses_weighted_pct() -> None:
    record = _record()
    lines = [Line("A", 100, Decimal("20")), Line("B", 100, Decimal("0"))]
    assert proposed_amount(record, POLICY, lines).total_minor == 20  # weighted 10% reaches it
    lines = [Line("A", 100, Decimal("18")), Line("B", 100, Decimal("0"))]
    assert proposed_amount(record, POLICY, lines).total_minor == 0  # weighted 9% does not
    assert proposed_amount(record, POLICY, []).total_minor == 0


def test_per_policy_deductible_shares_reduction() -> None:
    record = _record(kind="deductible")
    lines = [Line("A", 1000, Decimal("50")), Line("B", 1000, Decimal("30"))]
    r = proposed_amount(record, POLICY, lines)
    # gross 500 + 300 = 800; minus 10% of 2000 = 200 -> 600, shared 3:5 -> 225 / 375
    assert [x.amount_minor for x in r.lines] == [375, 225]
    zero = proposed_amount(record, POLICY, [Line("A", 1000, Decimal("0"))])
    assert zero.total_minor == 0


def test_per_asset_deductible_floors_at_zero() -> None:
    body = jasindo_rfd()
    body["deductible"]["kind"] = "deductible"
    record = PolicyRecordView.from_body(body)
    assert payout_for_pct(record, Line("A", 1000, Decimal(0)), Decimal("10")) == 0


def test_no_deductible_and_missing_category() -> None:
    body = jasindo_rfd()
    body.pop("deductible")
    record = PolicyRecordView.from_body(body)
    assert payout_for_pct(record, Line("A", 1000, Decimal(0)), Decimal("30")) == 300
    body["loss_categories"] = body["loss_categories"][1:]  # nothing covers below 10%
    gappy = PolicyRecordView.from_body(body)
    with pytest.raises(LookupError):
        loss_category(gappy, Decimal("5"))


def test_sum_insured_errors() -> None:
    record = PolicyRecordView.from_body(jasindo_rfd())
    with pytest.raises(ValueError, match="area_ha"):
        sum_insured(record, AssetFacts("A", "parcel"), date(2026, 1, 1))
    staged = PolicyRecordView.from_body(staged_record())
    with pytest.raises(ValueError, match="planting_date"):
        sum_insured(staged, AssetFacts("A", "parcel", area_ha=Decimal(1)), date(2026, 1, 1))
    herd = PolicyRecordView.from_body(_livestock())
    with pytest.raises(ValueError, match="head_count"):
        sum_insured(herd, AssetFacts("H", "livestock"), date(2026, 1, 1))
    with pytest.raises(ValueError, match="declared_value_minor"):
        sum_insured(herd, AssetFacts("H", "livestock", head_count=2), date(2026, 1, 1))


def _livestock() -> dict[str, object]:
    from .records import autsk

    return autsk()


def test_deadline_datetime_converted_to_pack_time_zone() -> None:
    record = PolicyRecordView.from_body(jasindo_rfd())
    event = LossEventFacts("flood", date(2026, 2, 8), date(2026, 2, 14))
    # 20:00 UTC on 20 Feb is 03:00 on 21 Feb in Jakarta (UTC+7)
    done = datetime(2026, 2, 20, 20, 0, tzinfo=UTC)
    assert deadlines(record, event, complete_at=done).due("settlement") == date(2026, 3, 7)
    naive = datetime(2026, 2, 20, 20, 0)  # noqa: DTZ001 (naive input is a supported case)
    assert deadlines(record, event, complete_at=naive).due("settlement") == date(2026, 3, 6)
    other = deadlines(record, event, complete_at=done, tz="America/New_York")
    assert other.due("settlement") == date(2026, 3, 6)


def test_canonical_json_rfc8785_properties() -> None:
    assert canonical_json({"b": [1, None, True], "a": "é\n"}) == (
        b'{"a":"\xc3\xa9\\n","b":[1,null,true]}'
    )
    # keys sort by UTF-16 code units: U+FF5E after U+1F600's surrogate D83D
    assert canonical_json({"～": 1, "\U0001f600": 2}) == ('{"\U0001f600":2,"～":1}'.encode())
    assert canonical_json(False) == b"false"
    with pytest.raises(TypeError):
        canonical_json(1.5)
    with pytest.raises(rfc8785.IntegerDomainError):
        canonical_json(2**60)
    with pytest.raises(TypeError):
        canonical_json(object())


def test_canonical_json_of_outputs_and_version() -> None:
    record = PolicyRecordView.from_body(jasindo_rfd())
    r = proposed_amount(record, POLICY, [Line("A", 1000, Decimal("92.50"))])
    out = canonical_json(r)
    assert b'"assessed_pct":"92.50"' in out
    assert canonical_json({"d": date(2026, 2, 21)}) == b'{"d":"2026-02-21"}'
    assert VERSION == "rules-1.0.0"
