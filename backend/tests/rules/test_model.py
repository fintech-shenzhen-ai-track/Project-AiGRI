"""T-05.01: PolicyRecordView.from_body and the frozen dataclasses (these tests pass now)."""

from __future__ import annotations

import dataclasses
from copy import deepcopy
from decimal import Decimal

import pytest

from aigri.rules._compat import parse_pct, round_minor
from aigri.rules.model import Line, PolicyRecordError, PolicyRecordView

from . import records


@pytest.mark.parametrize(
    "factory",
    [
        records.jasindo_rfd,
        records.askrindo_ryp,
        records.sinarmas_pfc,
        records.autp,
        records.autsk,
        records.staged_record,
    ],
)
def test_fixture_records_validate(factory) -> None:  # type: ignore[no-untyped-def]
    view = PolicyRecordView.from_body(factory())
    assert view.currency == "IDR"


def test_jasindo_view_fields() -> None:
    v = PolicyRecordView.from_body(records.jasindo_rfd())
    assert v.policy_record_id == "PR-JSD-RFD-2026"
    assert v.sum_insured.amount_minor == 8_000_000
    assert v.sum_insured.clause.id == "6.1"
    assert v.deductible is not None
    assert (v.deductible.kind, v.deductible.applies, v.deductible.pct) == (
        "franchise",
        "per_asset",
        Decimal("10"),
    )
    assert v.premium.rate_pct_of_sum_insured == Decimal("3.5")
    assert [d.event for d in v.deadlines] == ["notice_of_loss", "settlement"]
    assert v.deadlines[0].from_ == "loss_event_end"
    assert v.perils_covered[0].conditions[0].value == Decimal(3)
    assert v.scheme is None


def test_scheme_and_stage_parsing() -> None:
    assert PolicyRecordView.from_body(records.autp()).scheme is not None
    staged = PolicyRecordView.from_body(records.staged_record())
    assert [s.until_days_after_planting for s in staged.sum_insured.by_stage] == [30, 60, None]
    assert all(isinstance(s.pct, Decimal) for s in staged.sum_insured.by_stage)


def test_view_is_frozen() -> None:
    v = PolicyRecordView.from_body(records.jasindo_rfd())
    with pytest.raises(dataclasses.FrozenInstanceError):
        v.currency = "PHP"  # type: ignore[misc]
    with pytest.raises(dataclasses.FrozenInstanceError):
        Line("a", 1, Decimal(1)).asset_id = "b"  # type: ignore[misc]


def _bad(mutate) -> PolicyRecordError:  # type: ignore[no-untyped-def]
    body = deepcopy(records.jasindo_rfd())
    mutate(body)
    with pytest.raises(PolicyRecordError) as exc:
        PolicyRecordView.from_body(body)
    return exc.value


def test_rejects_missing_required_field() -> None:
    err = _bad(lambda b: b.pop("sum_insured"))
    assert any("sum_insured" in e for e in err.errors)


def test_rejects_float_percent() -> None:
    err = _bad(lambda b: b["premium"].update(rate_pct_of_sum_insured=3.5))
    assert any("rate_pct_of_sum_insured" in e for e in err.errors)


def test_rejects_unknown_property_and_bad_enum() -> None:
    _bad(lambda b: b.update(surprise=1))
    _bad(lambda b: b["deductible"].update(kind="excess"))
    _bad(lambda b: b.update(policy_record_id="jasindo"))


def test_rejects_clause_less_cited_field() -> None:
    _bad(lambda b: b["product_name"].pop("clause"))


def test_compat_money_rules() -> None:
    assert round_minor(Decimal("0.5"), "IDR") == 1  # half-up, whole rupiah (D-37, D-38)
    assert round_minor(Decimal("2.5"), "IDR") == 3
    assert round_minor(Decimal("1.005"), "PHP") == 101  # 2 minor-unit digits
    assert parse_pct("3.5") == Decimal("3.5")
    with pytest.raises(TypeError):
        parse_pct(3.5)  # type: ignore[arg-type]
