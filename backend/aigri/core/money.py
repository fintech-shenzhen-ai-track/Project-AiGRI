"""Money: ``Decimal`` in Python, integer minor units in the database and on the wire.

- D-37: amounts are rounded half-up to the currency's precision once per asset line; totals are
  sums of rounded lines (``sum_lines``).
- D-38: the minor-unit exponent comes from the country pack (IDR 0, PHP and THB 2).
- Never ``float``: every constructor rejects it.
"""

from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Context, Decimal
from typing import Any

from aigri.core import packs

# Explicit context for money arithmetic: no reliance on the thread-global decimal context.
CONTEXT = Context(prec=40, rounding=ROUND_HALF_UP)


def exponent(currency: str) -> int:
    """Minor-unit exponent of ``currency`` (D-38)."""
    return packs.currency_exponent(currency)


def to_decimal(value: Any) -> Decimal:
    """A ``Decimal`` from an int, str or Decimal. Floats and bools are refused."""
    if isinstance(value, float | bool):
        raise TypeError("money values must be int, str or Decimal, never float")
    if not isinstance(value, int | str | Decimal):
        raise TypeError(f"cannot read {type(value).__name__} as an amount")
    d = Decimal(value)
    if not d.is_finite():
        raise ValueError(f"not a finite amount: {value!r}")
    return d


def round_minor(major: Any, currency: str) -> int:
    """Round an amount in major units to integer minor units, half-up (D-37)."""
    scaled = to_decimal(major).scaleb(exponent(currency), context=CONTEXT)
    return int(scaled.quantize(Decimal(1), rounding=ROUND_HALF_UP, context=CONTEXT))


@dataclass(frozen=True, slots=True)
class Money:
    amount_minor: int
    currency: str

    def __post_init__(self) -> None:
        if isinstance(self.amount_minor, bool) or not isinstance(self.amount_minor, int):
            raise TypeError("amount_minor must be an int")
        if len(self.currency) != 3 or not self.currency.isupper():
            raise ValueError(f"bad currency code: {self.currency!r}")

    @classmethod
    def from_major(cls, major: Any, currency: str) -> "Money":
        """Round once, half-up (D-37)."""
        return cls(round_minor(major, currency), currency)

    @classmethod
    def from_wire(cls, data: dict[str, Any]) -> "Money":
        raw = data["amount_minor"]
        if isinstance(raw, str):
            raw = int(raw)
        return cls(raw, data["currency"])

    def to_wire(self) -> dict[str, Any]:
        """``{"amount_minor": int, "currency": str}`` as in api-conventions.md."""
        return {"amount_minor": self.amount_minor, "currency": self.currency}

    @property
    def major(self) -> Decimal:
        return Decimal(self.amount_minor).scaleb(-exponent(self.currency), context=CONTEXT)

    def _same(self, other: "Money") -> None:
        if self.currency != other.currency:
            raise ValueError(f"currency mismatch: {self.currency} vs {other.currency}")

    def __add__(self, other: "Money") -> "Money":
        self._same(other)
        return Money(self.amount_minor + other.amount_minor, self.currency)

    def __sub__(self, other: "Money") -> "Money":
        self._same(other)
        return Money(self.amount_minor - other.amount_minor, self.currency)

    def __neg__(self) -> "Money":
        return Money(-self.amount_minor, self.currency)

    def times(self, factor: Any) -> "Money":
        """Multiply by a rate or count and round half-up once (D-37). ``factor`` is not a float."""
        scaled = CONTEXT.multiply(Decimal(self.amount_minor), to_decimal(factor))
        return Money(int(scaled.quantize(Decimal(1), rounding=ROUND_HALF_UP, context=CONTEXT)),
                     self.currency)  # fmt: skip


def sum_lines(lines: list[Money], currency: str) -> Money:
    """Total of already rounded lines (D-37). An empty list sums to zero."""
    total = 0
    for line in lines:
        if line.currency != currency:
            raise ValueError(f"currency mismatch: {line.currency} vs {currency}")
        total += line.amount_minor
    return Money(total, currency)
