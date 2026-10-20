"""core.money: table tests for rounding (D-37), exponents (D-38) and arithmetic."""

from decimal import Decimal

import pytest
from hypothesis import given
from hypothesis import strategies as st

from aigri.core.money import Money, exponent, round_minor, sum_lines

ROUNDING_TABLE = [
    # (major, currency, expected minor)
    ("0", "IDR", 0),
    ("0.4", "IDR", 0),
    ("0.5", "IDR", 1),
    ("1.5", "IDR", 2),
    ("2.5", "IDR", 3),  # half-up, not banker's
    ("-0.5", "IDR", -1),  # half away from zero
    ("-2.5", "IDR", -3),
    ("187800000", "IDR", 187_800_000),
    ("280000", "IDR", 280_000),
    ("0.005", "PHP", 1),
    ("0.004", "PHP", 0),
    ("2.675", "PHP", 268),
    ("12.345", "THB", 1235),
    ("-12.345", "THB", -1235),
    ("1234.56", "PHP", 123_456),
]


@pytest.mark.parametrize(("major", "currency", "minor"), ROUNDING_TABLE)
def test_round_minor_table(major: str, currency: str, minor: int) -> None:
    assert round_minor(major, currency) == minor
    assert Money.from_major(major, currency).amount_minor == minor


def test_exponents_from_packs() -> None:
    assert {c: exponent(c) for c in ("IDR", "VND", "PHP", "THB")} == {
        "IDR": 0,
        "VND": 0,
        "PHP": 2,
        "THB": 2,
    }


def test_major_round_trip() -> None:
    assert Money(123_456, "PHP").major == Decimal("1234.56")
    assert Money(6_000_000, "IDR").major == Decimal("6000000")


def test_floats_and_bools_refused() -> None:
    with pytest.raises(TypeError):
        round_minor(1.5, "IDR")
    with pytest.raises(TypeError):
        Money(1.5, "IDR")  # type: ignore[arg-type]
    with pytest.raises(TypeError):
        Money(True, "IDR")
    with pytest.raises(TypeError):
        Money(1, "IDR").times(0.1)


def test_non_finite_refused() -> None:
    with pytest.raises(ValueError):
        round_minor("NaN", "IDR")


def test_arithmetic_and_currency_mismatch() -> None:
    a, b = Money(100, "IDR"), Money(40, "IDR")
    assert a + b == Money(140, "IDR")
    assert a - b == Money(60, "IDR")
    assert -a == Money(-100, "IDR")
    with pytest.raises(ValueError):
        a + Money(1, "PHP")


def test_times_rounds_once_half_up() -> None:
    # 280.000 per ha x 0.8 ha = 224.000; x 0.5 ha with an odd amount rounds half up
    assert Money(280_000, "IDR").times("0.8") == Money(224_000, "IDR")
    assert Money(3, "IDR").times("0.5") == Money(2, "IDR")
    assert Money(-3, "IDR").times("0.5") == Money(-2, "IDR")


def test_totals_are_sums_of_rounded_lines() -> None:
    lines = [Money.from_major("0.5", "IDR") for _ in range(3)]  # each line rounds to 1
    assert sum_lines(lines, "IDR") == Money(3, "IDR")  # not round(1.5) == 2
    assert sum_lines([], "IDR") == Money(0, "IDR")
    with pytest.raises(ValueError):
        sum_lines([Money(1, "PHP")], "IDR")


def test_wire_round_trip() -> None:
    m = Money(13_440_000, "IDR")
    assert m.to_wire() == {"amount_minor": 13_440_000, "currency": "IDR"}
    assert Money.from_wire(m.to_wire()) == m
    assert Money.from_wire({"amount_minor": "21120000", "currency": "IDR"}) == Money(
        21_120_000, "IDR"
    )


@given(st.integers(-(10**12), 10**12), st.sampled_from(["IDR", "PHP", "THB"]))
def test_minor_major_minor_is_identity(minor: int, currency: str) -> None:
    m = Money(minor, currency)
    assert Money.from_major(m.major, currency) == m
