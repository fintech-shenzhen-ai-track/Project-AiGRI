"""Premium with the scheme subsidy split (FR-05.2)."""

from __future__ import annotations

from decimal import Decimal

from aigri.rules._numeric import round_half_up
from aigri.rules.model import PolicyRecordView, PremiumSplit, SchemeSpec


def premium(
    record: PolicyRecordView, sum_insured_minor: int, scheme: SchemeSpec | None
) -> PremiumSplit:
    """Premium = rate x sum insured, rounded once. With a scheme, the subsidy is
    ``subsidy_pct`` of the premium and the client pays the rest."""
    total = round_half_up(Decimal(sum_insured_minor) * record.premium.rate_pct_of_sum_insured / 100)
    if scheme is None:
        return PremiumSplit(premium_minor=total, subsidy_minor=0, client_share_minor=total)
    subsidy = round_half_up(Decimal(total) * scheme.subsidy_pct / 100)
    return PremiumSplit(
        premium_minor=total, subsidy_minor=subsidy, client_share_minor=total - subsidy
    )
