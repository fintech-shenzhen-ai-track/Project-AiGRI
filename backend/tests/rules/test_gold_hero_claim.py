"""Gold: hero claim CLM-26-000418 on PR-JSD-RFD-2026 (PLAN 2.8). Phase B tests xfail until built."""

from __future__ import annotations

from datetime import date
from decimal import Decimal

import pytest

from aigri.rules.model import (
    AssetFacts,
    Line,
    LossEventFacts,
    PolicyFacts,
    PolicyRecordView,
)

from .records import jasindo_rfd, not_built, rules_fn

HA = {
    "DMK-01": "9.6",
    "DMK-02": "8.4",
    "DMK-03": "7.2",
    "DMK-04": "8.8",
    "DMK-05": "6.5",
}
SUM_INSURED = {
    "DMK-01": 76_800_000,
    "DMK-02": 67_200_000,
    "DMK-03": 57_600_000,
    "DMK-04": 70_400_000,
    "DMK-05": 52_000_000,
}
ASSESSED = {"DMK-01": 92, "DMK-02": 75, "DMK-03": 55, "DMK-04": 30, "DMK-05": 20}
PROPOSED = {
    "DMK-01": 76_800_000,
    "DMK-02": 50_400_000,
    "DMK-03": 31_680_000,
    "DMK-04": 21_120_000,
    "DMK-05": 10_400_000,
}


@pytest.fixture
def record() -> PolicyRecordView:
    return PolicyRecordView.from_body(jasindo_rfd())


def _lines(overrides: dict[str, int] | None = None) -> list[Line]:
    pcts = {**ASSESSED, **(overrides or {})}
    return [Line(k, SUM_INSURED[k], Decimal(str(pcts[k]))) for k in SUM_INSURED]


def _policy() -> PolicyFacts:
    return PolicyFacts(
        "POL-1", "PR-JSD-RFD-2026", date(2026, 1, 10), date(2026, 4, 30), tuple(SUM_INSURED)
    )


@not_built("T-05.03")
def test_sum_insured_per_parcel(record: PolicyRecordView) -> None:
    sum_insured = rules_fn("sum_insured", "sum_insured")
    for pid, ha in HA.items():
        asset = AssetFacts(pid, "parcel", area_ha=Decimal(ha), planting_date=date(2025, 12, 20))
        assert sum_insured(record, asset, date(2026, 2, 1)) == SUM_INSURED[pid]
    assert sum(SUM_INSURED.values()) == 324_000_000


@not_built("T-05.07")
def test_hero_lines_and_total(record: PolicyRecordView) -> None:
    result = rules_fn("amount", "proposed_amount")(record, _policy(), _lines())
    assert {line.asset_id: line.amount_minor for line in result.lines} == PROPOSED
    assert result.total_minor == 190_400_000
    assert result.total_minor == sum(line.amount_minor for line in result.lines)
    assert result.currency == "IDR"


@not_built("T-05.07")
def test_hero_dmk05_changed_to_15(record: PolicyRecordView) -> None:
    result = rules_fn("amount", "proposed_amount")(record, _policy(), _lines({"DMK-05": 15}))
    by_id = {line.asset_id: line.amount_minor for line in result.lines}
    assert by_id["DMK-05"] == 7_800_000
    assert result.total_minor == 187_800_000


@not_built("T-05.07")
@pytest.mark.parametrize(
    ("pct", "expected"),
    [
        ("9", 0),  # franchise: below 10% pays nothing
        ("10", 7_680_000),  # 10% of 76.800.000
        ("89", 68_352_000),  # 89%
        ("90", 76_800_000),  # total pays 100%
        ("100", 76_800_000),
        ("0", 0),
    ],
)
def test_hero_boundaries(record: PolicyRecordView, pct: str, expected: int) -> None:
    line = Line("DMK-01", 76_800_000, Decimal(pct))
    result = rules_fn("amount", "proposed_amount")(record, _policy(), [line])
    assert result.lines[0].amount_minor == expected


@not_built("T-05.07")
def test_hero_boundaries_on_sum_insured_percentages(record: PolicyRecordView) -> None:
    """The plan states 10% -> 10% of sum insured and 89% -> 89%, on any sum insured."""
    fn = rules_fn("amount", "proposed_amount")
    for pct in ("10", "89"):
        r = fn(record, _policy(), [Line("X", 1_000_000, Decimal(pct))])
        assert r.lines[0].amount_minor == int(Decimal(pct) * 10_000)


@not_built("T-05.07")
def test_rounding_once_per_line_half_up(record: PolicyRecordView) -> None:
    """D-37: each line rounds half-up to whole rupiah; the total is the sum of rounded lines."""
    fn = rules_fn("amount", "proposed_amount")
    lines = [Line("A", 1, Decimal("50")), Line("B", 1, Decimal("50")), Line("C", 3, Decimal("50"))]
    r = fn(record, _policy(), lines)
    assert [x.amount_minor for x in r.lines] == [1, 1, 2]  # 0.5, 0.5, 1.5 round up
    assert r.total_minor == 4  # not round(2.5)


@not_built("T-05.07")
def test_hero_trail_cites_6_1_6_2_6_3(record: PolicyRecordView) -> None:
    result = rules_fn("amount", "proposed_amount")(record, _policy(), _lines())
    for line in result.lines:
        clauses = {s.clause for s in line.trail}
        assert {"6.1", "6.2", "6.3"} <= clauses


@not_built("T-05.07")
def test_per_policy_deductible_and_kind_deductible() -> None:
    """D-07: kind=deductible subtracts the threshold; franchise pays in full once reached."""
    body = jasindo_rfd()
    body["deductible"] = {
        "kind": "deductible",
        "pct": "10",
        "applies": "per_asset",
        "clause": {"id": "6.2"},
    }
    record = PolicyRecordView.from_body(body)
    r = rules_fn("amount", "proposed_amount")(
        record, _policy(), [Line("DMK-04", 70_400_000, Decimal("30"))]
    )
    assert r.lines[0].amount_minor == 14_080_000  # (30% - 10%) of 70.400.000


@not_built("T-05.05")
@pytest.mark.parametrize(
    ("pct", "category"),
    [
        ("0", "no_loss"),
        ("9", "no_loss"),
        ("9.9999", "no_loss"),
        ("10", "partial"),
        ("89", "partial"),
        ("89.9999", "partial"),
        ("90", "total"),
        ("100", "total"),
    ],
)
def test_loss_category_boundaries(record: PolicyRecordView, pct: str, category: str) -> None:
    res = rules_fn("categories", "loss_category")(record, Decimal(pct))
    assert res.category == category
    assert res.clause.id == "6.3"


@not_built("T-05.06")
def test_deadlines_hero(record: PolicyRecordView) -> None:
    event = LossEventFacts("flood", date(2026, 2, 8), date(2026, 2, 14))
    ds = rules_fn("deadlines", "deadlines")(
        record, event, notice_at=date(2026, 2, 16), complete_at=date(2026, 2, 20)
    )
    assert ds.due("notice_of_loss") == date(2026, 2, 21)  # Clause 8.1
    assert ds.due("settlement") == date(2026, 3, 6)  # Clause 9.1
    item = next(i for i in ds.items if i.event == "notice_of_loss")
    assert (item.clause, item.source, item.day_kind) == ("8.1", "document", "calendar")


@not_built("T-05.06")
def test_deadline_sinar_mas() -> None:
    from .records import sinarmas_pfc

    record = PolicyRecordView.from_body(sinarmas_pfc())
    event = LossEventFacts("flood", date(2026, 2, 1), date(2026, 2, 5))
    ds = rules_fn("deadlines", "deadlines")(record, event, complete_at=date(2026, 2, 14))
    assert ds.due("settlement") == date(2026, 2, 28)


@not_built("T-05.06")
def test_deadline_unresolved_without_anchor(record: PolicyRecordView) -> None:
    event = LossEventFacts("flood", date(2026, 2, 8), date(2026, 2, 14))
    ds = rules_fn("deadlines", "deadlines")(record, event)
    assert ds.due("notice_of_loss") == date(2026, 2, 21)
    assert ds.due("settlement") is None  # no complete packet yet


@not_built("T-05.06")
def test_business_days_skip_weekends() -> None:
    body = jasindo_rfd()
    body["deadlines"][1].update(day_kind="business", days=5)
    record = PolicyRecordView.from_body(body)
    event = LossEventFacts("flood", date(2026, 2, 8), date(2026, 2, 14))
    ds = rules_fn("deadlines", "deadlines")(record, event, complete_at=date(2026, 2, 20))
    assert ds.due("settlement") == date(2026, 2, 27)  # Fri 20 Feb + 5 business days = Fri 27 Feb


@not_built("T-05.08")
def test_coverage_covered(record: PolicyRecordView) -> None:
    event = LossEventFacts(
        "flood", date(2026, 2, 8), date(2026, 2, 14), {"min_inundation_days": Decimal(5)}
    )
    asset = AssetFacts("DMK-01", "parcel", area_ha=Decimal("9.6"))
    res = rules_fn("coverage", "coverage")(record, _policy(), asset, event)
    assert res.status == "covered"
    assert [e.clause.id for e in res.exclusions_for_adjuster] == ["5.1"]  # listed, never evaluated


@not_built("T-05.08")
def test_coverage_not_covered_cases(record: PolicyRecordView) -> None:
    fn = rules_fn("coverage", "coverage")
    asset = AssetFacts("DMK-01", "parcel", area_ha=Decimal("9.6"))
    short = LossEventFacts(
        "flood", date(2026, 2, 8), date(2026, 2, 14), {"min_inundation_days": Decimal(2)}
    )
    assert fn(record, _policy(), asset, short).status == "not_covered"  # condition below 3 days
    wind = LossEventFacts("typhoon_wind", date(2026, 2, 8), date(2026, 2, 14))
    assert fn(record, _policy(), asset, wind).status == "not_covered"  # peril not listed
    late = LossEventFacts(
        "flood", date(2026, 6, 1), date(2026, 6, 5), {"min_inundation_days": Decimal(5)}
    )
    assert fn(record, _policy(), asset, late).status == "not_covered"  # outside the period
    other = AssetFacts("ZZZ-99", "parcel", area_ha=Decimal(1))
    ok = LossEventFacts(
        "flood", date(2026, 2, 8), date(2026, 2, 14), {"min_inundation_days": Decimal(5)}
    )
    assert fn(record, _policy(), other, ok).status == "not_covered"  # asset not on the policy


@not_built("T-05.08")
def test_coverage_needs_adjuster_without_measure(record: PolicyRecordView) -> None:
    asset = AssetFacts("DMK-01", "parcel", area_ha=Decimal("9.6"))
    event = LossEventFacts("flood", date(2026, 2, 8), date(2026, 2, 14))
    res = rules_fn("coverage", "coverage")(record, _policy(), asset, event)
    assert res.status == "needs_adjuster"
    assert any("3 days" in r.text for r in res.reasons)  # condition text surfaced
