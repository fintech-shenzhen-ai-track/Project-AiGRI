"""Property tests for the rules engine (T-05.11).

Open defaults in force: R-014 (a), R-015 (a), R-016 (a), R-019 (a) the ``per_policy`` formula as
implemented, R-020 (a) the deductible applies to a total loss. Money is ``int`` minor units and
percentages are ``Decimal``; no float anywhere.
"""

from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal
from typing import Any

import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

from aigri.rules.amount import payout_for_pct, proposed_amount
from aigri.rules.categories import loss_category
from aigri.rules.deadlines import add_days
from aigri.rules.model import AssetFacts, Line, PolicyFacts, PolicyRecordView, SchemeSpec
from aigri.rules.premium import premium
from aigri.rules.sum_insured import sum_insured

from .records import autp, jasindo_rfd, staged_record

POLICY = PolicyFacts("P", "PR", date(2026, 1, 1), date(2026, 12, 31), ("A", "B", "C"))

pcts = st.decimals(min_value=0, max_value=100, places=2)
money = st.integers(min_value=0, max_value=10**12)
KINDS = ("franchise", "deductible")


def _record(kind: str, applies: str, pct: str = "10") -> PolicyRecordView:
    body: dict[str, Any] = jasindo_rfd()
    body["deductible"] = {"clause": {"id": "6.2"}, "pct": pct, "applies": applies, "kind": kind}
    return PolicyRecordView.from_body(body)


@settings(max_examples=200)
@given(kind=st.sampled_from(KINDS), si=money, a=pcts, b=pcts)
def test_more_loss_never_pays_less(kind: str, si: int, a: Decimal, b: Decimal) -> None:
    record = _record(kind, "per_asset")
    lo, hi = sorted((a, b))
    line = Line("A", si, lo)
    assert payout_for_pct(record, line, lo) <= payout_for_pct(record, line, hi)


@settings(max_examples=200)
@given(kind=st.sampled_from(KINDS), s1=money, s2=money, pct=pcts)
def test_higher_sum_insured_never_pays_less(kind: str, s1: int, s2: int, pct: Decimal) -> None:
    # per_asset only: a per_policy threshold is weighted across lines, so growing one line
    # can legitimately move the policy across the threshold (not a monotone property).
    record = _record(kind, "per_asset")
    lo, hi = sorted((s1, s2))
    assert payout_for_pct(record, Line("A", lo, pct), pct) <= payout_for_pct(
        record, Line("A", hi, pct), pct
    )


@settings(max_examples=200)
@given(si=money, pct=pcts)
def test_payout_stays_between_zero_and_sum_insured(si: int, pct: Decimal) -> None:
    for kind in KINDS:
        for applies in ("per_asset", "per_policy"):
            r = proposed_amount(_record(kind, applies), POLICY, [Line("A", si, pct)])
            assert 0 <= r.total_minor <= si


@pytest.mark.parametrize(
    ("pct", "expected"),
    [
        ("0", 0),
        ("9", 0),
        ("9.99", 0),
        ("10", 1000),
        ("10.01", 1001),
        ("89", 8900),
        ("89.99", 8999),
        ("90", 10_000),
        ("100", 10_000),
    ],
)
def test_threshold_boundaries_franchise(pct: str, expected: int) -> None:
    # Jasindo Clause 6.2/6.3: franchise 10% pays from the threshold, 90% and up is a total loss.
    record = _record("franchise", "per_asset")
    assert payout_for_pct(record, Line("A", 10_000, Decimal(pct)), Decimal(pct)) == expected


@pytest.mark.parametrize(
    ("pct", "expected"),
    [("9", 0), ("10", 0), ("11", 100), ("89", 7900), ("90", 9000), ("100", 9000)],
)
def test_threshold_boundaries_deductible(pct: str, expected: int) -> None:
    # R-020 (a): the deductible also comes off a total loss.
    record = _record("deductible", "per_asset")
    assert payout_for_pct(record, Line("A", 10_000, Decimal(pct)), Decimal(pct)) == expected


@pytest.mark.parametrize(
    ("pct", "category"),
    [
        ("0", "no_loss"),
        ("9.99", "no_loss"),
        ("10", "partial"),
        ("89.99", "partial"),
        ("90", "total"),
        ("100", "total"),
    ],
)
def test_loss_category_edges(pct: str, category: str) -> None:
    record = PolicyRecordView.from_body(jasindo_rfd())
    assert loss_category(record, Decimal(pct)).category == category


@settings(max_examples=100)
@given(pct=pcts)
def test_category_is_defined_over_the_whole_range(pct: Decimal) -> None:
    record = PolicyRecordView.from_body(jasindo_rfd())
    expected = "no_loss" if pct < 10 else "partial" if pct < 90 else "total"
    assert loss_category(record, pct).category == expected


line_st = st.builds(
    lambda i, si, pct: Line(f"L{i}", si, pct),
    st.integers(0, 5),
    st.integers(0, 10**10),
    pcts,
)


@settings(max_examples=200)
@given(
    kind=st.sampled_from(KINDS),
    applies=st.sampled_from(("per_asset", "per_policy")),
    lines=st.lists(line_st, max_size=6),
)
def test_total_is_sum_of_rounded_lines(kind: str, applies: str, lines: list[Line]) -> None:
    r = proposed_amount(_record(kind, applies), POLICY, lines)
    assert len(r.lines) == len(lines)
    assert r.total_minor == sum(x.amount_minor for x in r.lines)
    assert all(isinstance(x.amount_minor, int) and x.amount_minor >= 0 for x in r.lines)


@settings(max_examples=100)
@given(kind=st.sampled_from(KINDS), lines=st.lists(line_st, min_size=1, max_size=5))
def test_per_asset_line_ignores_the_other_lines(kind: str, lines: list[Line]) -> None:
    record = _record(kind, "per_asset")
    together = proposed_amount(record, POLICY, lines)
    for line, got in zip(lines, together.lines, strict=True):
        assert got.amount_minor == payout_for_pct(record, line, line.assessed_pct)


@settings(max_examples=100)
@given(si=st.integers(0, 10**10), pct=pcts)
def test_without_deductible_a_partial_pays_the_rounded_share(si: int, pct: Decimal) -> None:
    body = jasindo_rfd()
    body.pop("deductible")
    record = PolicyRecordView.from_body(body)
    got = payout_for_pct(record, Line("A", si, pct), pct)
    if pct < 10:
        assert got == 0
    elif pct >= 90:
        assert got == si
    else:
        assert abs(Decimal(got) - Decimal(si) * pct / 100) <= Decimal("0.5")


@settings(max_examples=100)
@given(si=st.integers(0, 10**10), ha=st.decimals(0, 100, places=2), days=st.integers(0, 400))
def test_staged_sum_insured_is_bounded_by_the_full_amount(si: int, ha: Decimal, days: int) -> None:
    body = staged_record()
    body["sum_insured"]["amount_minor"] = si
    record = PolicyRecordView.from_body(body)
    planting = date(2026, 1, 1)
    asset = AssetFacts("A", "parcel", area_ha=ha, planting_date=planting)
    got = sum_insured(record, asset, planting + timedelta(days=days))
    assert 0 <= got <= int(Decimal(si) * ha) + 1


@settings(max_examples=100)
@given(si=money, subsidy=st.decimals(0, 100, places=1))
def test_premium_split_adds_up(si: int, subsidy: Decimal) -> None:
    record = PolicyRecordView.from_body(autp())
    split = premium(record, si, SchemeSpec(code="X", subsidy_pct=subsidy, subsidy_payer="G"))
    assert split.subsidy_minor + split.client_share_minor == split.premium_minor
    assert 0 <= split.subsidy_minor <= split.premium_minor
    plain = premium(record, si, None)
    assert plain.client_share_minor == plain.premium_minor == split.premium_minor


@given(start=st.dates(date(2026, 1, 1), date(2027, 12, 31)), n=st.integers(0, 60))
def test_business_days_land_on_weekdays_and_never_precede_calendar(start: date, n: int) -> None:
    biz = add_days(start, n, business=True)
    assert add_days(start, n, business=False) <= biz
    if n:
        assert biz.weekday() < 5
