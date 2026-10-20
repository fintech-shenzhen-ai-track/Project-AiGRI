"""Gold: Curation for CV Tani Makmur Demak, 48,0 ha (PLAN 2.6).

Expected payouts depend on the seeded risk outputs (feature 15 calibrates them, T-15.07). Here the
risk outputs are injected: one flood class with damage fraction 0,5 and a probability chosen so the
formula reproduces the PLAN figure exactly. These probabilities are test inputs, not seed data.
"""

from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal

import pytest

from aigri.rules.expected import expected_payout, fit
from aigri.rules.model import AssetFacts, Line, PolicyRecordView, RiskClass
from aigri.rules.premium import premium as premium_fn
from aigri.rules.sum_insured import sum_insured

from .records import askrindo_ryp, jasindo_rfd, sinarmas_pfc

# record factory, sum insured, premium, expected payout, score, injected flood probability
CASES = [
    (jasindo_rfd, 384_000_000, 13_440_000, 19_622_400, "1.46", "0.1022"),
    (askrindo_ryp, 360_000_000, 11_520_000, 15_091_200, "1.31", "0.08384"),
    (sinarmas_pfc, 288_000_000, 6_912_000, 8_156_160, "1.18", "0.05664"),
]
IDS = ["jasindo", "askrindo", "sinarmas"]


def _asset() -> AssetFacts:
    from datetime import date

    return AssetFacts("TANI-48", "parcel", area_ha=Decimal("48.0"), planting_date=date(2026, 1, 10))


@pytest.mark.parametrize(("factory", "si", "premium", "expected", "score", "p"), CASES, ids=IDS)
class TestCuration:
    def test_sum_insured(self, factory, si, premium, expected, score, p) -> None:  # type: ignore[no-untyped-def]
        from datetime import date

        record = PolicyRecordView.from_body(factory())
        assert sum_insured(record, _asset(), date(2026, 1, 10)) == si

    def test_premium(self, factory, si, premium, expected, score, p) -> None:  # type: ignore[no-untyped-def]
        record = PolicyRecordView.from_body(factory())
        split = premium_fn(record, si, None)
        assert split.premium_minor == premium
        assert (split.subsidy_minor, split.client_share_minor) == (0, premium)

    def test_expected_payout_with_injected_risk(  # type: ignore[no-untyped-def]
        self, factory, si, premium, expected, score, p
    ) -> None:
        record = PolicyRecordView.from_body(factory())
        risk = [RiskClass("flood", Decimal(p), Decimal("0.5"))]
        lines = [Line("TANI-48", si, Decimal(0))]
        got = expected_payout(record, lines, risk)
        assert got == expected
        ratio = (Decimal(expected) / Decimal(premium)).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        assert str(ratio) == score  # expected payout per Rp1 of premium (D-37: 2 decimals)

    def test_perils_not_covered_contribute_zero(  # type: ignore[no-untyped-def]
        self, factory, si, premium, expected, score, p
    ) -> None:
        record = PolicyRecordView.from_body(factory())
        risk = [
            RiskClass("flood", Decimal(p), Decimal("0.5")),
            RiskClass("typhoon_wind", Decimal("0.5"), Decimal("1")),
        ]
        lines = [Line("TANI-48", si, Decimal(0))]
        assert expected_payout(record, lines, risk) == expected


def test_below_franchise_class_pays_nothing() -> None:
    """A 5% damage class is under the 10% franchise (Clause 6.2): zero expected payout."""
    record = PolicyRecordView.from_body(jasindo_rfd())
    risk = [RiskClass("flood", Decimal("0.4"), Decimal("0.05"))]
    lines = [Line("TANI-48", 384_000_000, Decimal(0))]
    assert expected_payout(record, lines, risk) == 0


def test_fit_is_covered_share_of_expected_loss() -> None:
    """Sinar Mas covers flood only: fit = flood loss / (flood + drought loss), 4 decimals."""
    record = PolicyRecordView.from_body(sinarmas_pfc())
    risk = [
        RiskClass("flood", Decimal("0.2"), Decimal("0.5")),
        RiskClass("drought", Decimal("0.1"), Decimal("0.6")),
    ]
    assert fit(record, risk) == "0.6250"  # 0.10 / 0.16
    jasindo = PolicyRecordView.from_body(jasindo_rfd())
    assert fit(jasindo, risk) == "1.0000"


def test_fit_zero_risk_is_defined() -> None:
    record = PolicyRecordView.from_body(jasindo_rfd())
    assert fit(record, []) == "0.0000"


def test_score_formula_with_injected_values() -> None:
    """The ranking ratio (expected payout / premium, 2 dp half-up) over the PLAN figures."""
    for _f, _si, premium, expected, score, _p in CASES:
        ratio = (Decimal(expected) / Decimal(premium)).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        assert str(ratio) == score
    assert [c[4] for c in CASES] == sorted((c[4] for c in CASES), reverse=True)


def test_premium_rates_match_plan() -> None:
    for factory, si, premium, *_ in CASES:
        rate = PolicyRecordView.from_body(factory()).premium.rate_pct_of_sum_insured
        assert Decimal(si) * rate / 100 == premium
