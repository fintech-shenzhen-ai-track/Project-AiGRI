"""Gold: government schemes for Pak Slamet (PLAN 2.6/2.8) and synthetic stage records."""

from __future__ import annotations

from datetime import date
from decimal import Decimal

import pytest

from aigri.rules.model import AssetFacts, Line, PolicyFacts, PolicyRecordView

from .records import autp, autsk, not_built, rules_fn, staged_record


def _policy(record_id: str, asset: str) -> PolicyFacts:
    return PolicyFacts("POL-S", record_id, date(2026, 1, 1), date(2026, 12, 31), (asset,))


@not_built("T-05.03")
def test_autp_sum_insured() -> None:
    record = PolicyRecordView.from_body(autp())
    asset = AssetFacts("PS-01", "parcel", area_ha=Decimal("1.2"), planting_date=date(2026, 1, 5))
    assert rules_fn("sum_insured", "sum_insured")(record, asset, date(2026, 1, 20)) == 7_200_000


@not_built("T-05.03")
def test_autsk_sum_insured_caps_declared_value() -> None:
    record = PolicyRecordView.from_body(autsk())
    herd = AssetFacts("PS-HERD", "livestock", declared_value_minor=18_500_000, head_count=12)
    assert rules_fn("sum_insured", "sum_insured")(record, herd, date(2026, 1, 20)) == 120_000_000
    cheap = AssetFacts("PS-HERD", "livestock", declared_value_minor=8_000_000, head_count=12)
    assert rules_fn("sum_insured", "sum_insured")(record, cheap, date(2026, 1, 20)) == 96_000_000


@not_built("T-05.04")
def test_autp_premium_split() -> None:
    record = PolicyRecordView.from_body(autp())
    split = rules_fn("premium", "premium")(record, 7_200_000, record.scheme)
    assert (split.premium_minor, split.subsidy_minor, split.client_share_minor) == (
        216_000,
        172_800,
        43_200,
    )


@not_built("T-05.04")
def test_autsk_premium_split() -> None:
    record = PolicyRecordView.from_body(autsk())
    split = rules_fn("premium", "premium")(record, 120_000_000, record.scheme)
    assert (split.premium_minor, split.subsidy_minor, split.client_share_minor) == (
        2_400_000,
        1_920_000,
        480_000,
    )


@not_built("T-05.07")
def test_autp_claim_cl_26_000436_pays_full_at_75() -> None:
    record = PolicyRecordView.from_body(autp())
    r = rules_fn("amount", "proposed_amount")(
        record, _policy("PR-JSD-AUTP-2026", "PS-01"), [Line("PS-01", 7_200_000, Decimal("75"))]
    )
    assert r.total_minor == 7_200_000
    r74 = rules_fn("amount", "proposed_amount")(
        record, _policy("PR-JSD-AUTP-2026", "PS-01"), [Line("PS-01", 7_200_000, Decimal("74"))]
    )
    assert r74.total_minor == 5_328_000  # partial pays the assessed %


@not_built("T-05.07")
def test_autsk_claim_cl_26_000431_two_matched_heads() -> None:
    record = PolicyRecordView.from_body(autsk())
    line = Line(
        "PS-HERD",
        120_000_000,
        Decimal("100"),
        per_head_minor=10_000_000,
        matched_heads=2,
        unmatched_tags=("ID-0099",),
    )
    r = rules_fn("amount", "proposed_amount")(
        record, _policy("PR-JSD-AUTSK-2026", "PS-HERD"), [line]
    )
    assert r.total_minor == 20_000_000
    assert r.lines[0].unmatched_tags == ("ID-0099",)  # listed, paid zero


@not_built("T-05.03")
@pytest.mark.parametrize(
    ("days", "expected"),
    [
        (0, 19_200_000),  # establishment 25% of 76.800.000
        (30, 19_200_000),  # until_days_after_planting is inclusive
        (31, 38_400_000),  # vegetative 50%
        (60, 38_400_000),
        (61, 76_800_000),  # last stage has no bound: 100%
        (200, 76_800_000),
    ],
)
def test_sum_insured_by_stage(days: int, expected: int) -> None:
    record = PolicyRecordView.from_body(staged_record())
    planted = date(2026, 1, 1)
    asset = AssetFacts("DMK-01", "parcel", area_ha=Decimal("9.6"), planting_date=planted)
    as_of = date.fromordinal(planted.toordinal() + days)
    assert rules_fn("sum_insured", "sum_insured")(record, asset, as_of) == expected


@not_built("T-05.10")
def test_version_and_canonical_trail() -> None:
    import aigri.rules as rules

    assert rules.VERSION == "rules-1.0.0"
    serialise = rules_fn("trail", "canonical_json")
    record = PolicyRecordView.from_body(autp())
    r = rules_fn("amount", "proposed_amount")(
        record, _policy("PR-JSD-AUTP-2026", "PS-01"), [Line("PS-01", 7_200_000, Decimal("75"))]
    )
    assert serialise(r) == serialise(r)  # byte-identical on re-run (US-05.3)
    assert isinstance(serialise(r), bytes)
