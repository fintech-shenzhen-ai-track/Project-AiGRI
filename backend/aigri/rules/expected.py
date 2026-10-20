"""Expected payout and fit for Curation (FR-05.7, FR-05.8)."""

from __future__ import annotations

from collections.abc import Sequence
from decimal import ROUND_HALF_UP, Decimal

from aigri.rules._numeric import round_half_up
from aigri.rules.amount import payout_for_pct
from aigri.rules.model import Line, PolicyRecordView, RiskClass


def expected_payout(
    record: PolicyRecordView, assets: Sequence[Line], risk_outputs: Sequence[RiskClass]
) -> int:
    """Sum over assets and covered risk classes of p(class) x payout(damage fraction x 100 as
    assessed %). Each class payout uses the per-asset rule of ``proposed_amount``; perils the
    record does not cover contribute zero. Rounded half-up once, at the end (D-37)."""
    covered = {p.peril for p in record.perils_covered}
    total = Decimal(0)
    for risk in risk_outputs:
        if risk.peril not in covered:
            continue
        pct = risk.damage_fraction * 100
        for line in assets:
            total += risk.probability * payout_for_pct(record, line, pct)
    return round_half_up(total)


def fit(record: PolicyRecordView, risk_outputs: Sequence[RiskClass]) -> str:
    """Covered expected loss divided by total expected loss across perils, as a 4-place decimal
    string. With no expected loss the fit is "0.0000"."""
    covered = {p.peril for p in record.perils_covered}
    total = Decimal(0)
    inside = Decimal(0)
    for risk in risk_outputs:
        loss = risk.probability * risk.damage_fraction
        total += loss
        if risk.peril in covered:
            inside += loss
    ratio = inside / total if total else Decimal(0)
    return str(ratio.quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP))
