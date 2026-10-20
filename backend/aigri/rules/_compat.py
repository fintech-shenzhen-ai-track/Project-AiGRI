"""Local stand-ins for ``aigri.core.money`` (T-01.08), ``core.packs`` (T-01.09) and ``core.hashing``
(T-01.05), not merged yet.

Follows the spec: money is ``Decimal`` in Python and an integer in minor units; rounding is half-up
once per asset line (D-37); IDR has minor-unit exponent 0 (D-38), PHP and THB have 2.
When ``core.*`` lands, ``rules`` imports switch to it and this file is deleted. Nothing outside
``rules/`` may import this module.
"""

from __future__ import annotations

import json
from datetime import date, datetime, timedelta
from decimal import ROUND_HALF_UP, Context, Decimal
from typing import Any
from zoneinfo import ZoneInfo

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


def round_half_up(value: Decimal) -> int:
    """Round an amount already in minor units to an integer, half-up (D-37)."""
    return int(value.quantize(Decimal(1), rounding=ROUND_HALF_UP, context=CONTEXT))


def parse_pct(value: str | int | Decimal) -> Decimal:
    """Percent inputs are strings or ints, never floats."""
    if isinstance(value, float):
        raise TypeError("percent must not be a float")
    return Decimal(str(value))


# ---- stand-in for the pack time zone and business days (core.packs, T-01.09) ---------------
# Follows the pack schema: ``timezones[]`` with one ``default: true`` entry (ID: Asia/Jakarta).
# Business days are Monday-Friday; public holidays are roadmap (spec 05 out of scope).

_DEFAULT_TIMEZONE = "Asia/Jakarta"


def default_timezone() -> str:
    """IANA name of the default pack time zone. Swap for ``core.packs`` when it lands."""
    return _DEFAULT_TIMEZONE


def local_date(value: date | datetime, tz: str) -> date:
    """A date as seen in the pack time zone (aware datetimes convert; naive ones are local)."""
    if isinstance(value, datetime):
        if value.tzinfo is not None:
            return value.astimezone(ZoneInfo(tz)).date()
        return value.date()
    return value


def add_days(start: date, days: int, *, business: bool) -> date:
    """Add calendar days, or Monday-Friday business days."""
    if not business:
        return start + timedelta(days=days)
    current = start
    remaining = days
    while remaining > 0:
        current += timedelta(days=1)
        if current.weekday() < 5:
            remaining -= 1
    return current


# ---- stand-in for canonical JSON (core.hashing, T-01.05): RFC 8785 --------------------------


def canonical_json(value: Any) -> bytes:
    """RFC 8785 serialisation of a JSON-compatible value. Floats are rejected (no float money)."""
    return _jcs(value).encode("utf-8")


def _jcs(value: Any) -> str:
    if value is None:
        return "null"
    if value is True:
        return "true"
    if value is False:
        return "false"
    if isinstance(value, int):
        if abs(value) > 2**53:
            raise ValueError("integer outside the exact JSON number range; use a string")
        return str(value)
    if isinstance(value, float):
        raise TypeError("floats are not allowed in canonical payloads")
    if isinstance(value, str):
        return json.dumps(value, ensure_ascii=False)
    if isinstance(value, list | tuple):
        return "[" + ",".join(_jcs(v) for v in value) + "]"
    if isinstance(value, dict):
        keys = sorted(value, key=lambda k: k.encode("utf-16-be"))
        body = ",".join(f"{json.dumps(k, ensure_ascii=False)}:{_jcs(value[k])}" for k in keys)
        return "{" + body + "}"
    raise TypeError(f"not JSON-compatible: {type(value).__name__}")
