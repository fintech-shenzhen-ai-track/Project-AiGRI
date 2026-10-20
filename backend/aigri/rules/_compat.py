"""Local stand-in for ``aigri.core.money`` (T-01.08, not merged yet).

Follows the spec: money is ``Decimal`` in Python and an integer in minor units; rounding is half-up
once per asset line (D-37); IDR has minor-unit exponent 0 (D-38), PHP and THB have 2.
When ``core.money`` lands, ``rules`` imports switch to it and this file is deleted. Nothing outside
``rules/`` may import this module.
"""

from __future__ import annotations

from decimal import ROUND_HALF_UP, Context, Decimal

_EXPONENTS = {"IDR": 0, "PHP": 2, "THB": 2}
_DEFAULT_EXPONENT = 2

# Explicit context for every rules computation (FR-05.9).
CONTEXT = Context(prec=40, rounding=ROUND_HALF_UP)


def minor_unit_exponent(currency: str) -> int:
    return _EXPONENTS.get(currency, _DEFAULT_EXPONENT)


def round_minor(major_value: Decimal, currency: str) -> int:
    """Round an amount given in major units to integer minor units, half-up (D-37)."""
    scaled = major_value.scaleb(minor_unit_exponent(currency), context=CONTEXT)
    return int(scaled.quantize(Decimal(1), rounding=ROUND_HALF_UP, context=CONTEXT))


def parse_pct(value: str | int | Decimal) -> Decimal:
    """Percent inputs are strings or ints, never floats."""
    if isinstance(value, float):
        raise TypeError("percent must not be a float")
    return Decimal(str(value))
