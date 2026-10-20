"""Small numeric helpers that are rules logic (no equivalent in ``core.money``)."""

from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal

from aigri.core.money import CONTEXT


def round_half_up(value: Decimal) -> int:
    """Round an amount already in minor units to an integer, half-up (D-37)."""
    return int(value.quantize(Decimal(1), rounding=ROUND_HALF_UP, context=CONTEXT))


def parse_pct(value: str | int | Decimal) -> Decimal:
    """Percent inputs are strings or ints, never floats."""
    if isinstance(value, float):
        raise TypeError("percent must not be a float")
    return Decimal(str(value))
