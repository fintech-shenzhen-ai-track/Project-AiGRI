"""Branches the gold and property tests do not reach, so `aigri/rules` stays at 100% (T-05.11)."""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from pathlib import Path

import pytest

from aigri.rules import model, tools
from aigri.rules.coverage import coverage
from aigri.rules.model import AssetFacts, LossEventFacts, PolicyFacts, PolicyRecordView
from aigri.rules.sum_insured import sum_insured

from .records import autsk, jasindo_rfd, staged_record

POLICY = PolicyFacts("P", "PR", date(2026, 1, 1), date(2026, 12, 31), ("A",))
ASSET = AssetFacts("A", "parcel", area_ha=Decimal(1))


def test_schema_dir_override_and_missing_schema(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    model._validator.cache_clear()
    monkeypatch.setenv("AIGRI_SCHEMA_DIR", str(tmp_path))
    try:
        with pytest.raises(FileNotFoundError):
            model._validator()
        assert model._schema_path() == tmp_path / model.SCHEMA_FILE
    finally:
        model._validator.cache_clear()


def test_schema_not_found_without_override(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    monkeypatch.delenv("AIGRI_SCHEMA_DIR", raising=False)
    monkeypatch.setattr(model, "__file__", str(tmp_path / "a" / "b" / "model.py"))
    with pytest.raises(FileNotFoundError, match="AIGRI_SCHEMA_DIR"):
        model._schema_path()


def test_optional_clause_may_be_absent() -> None:
    assert model._clause(None) is None
    assert model._clause({"id": "4.1", "page": 3}) == model.ClauseRef("4.1", 3)


def test_coverage_condition_not_met() -> None:
    record = PolicyRecordView.from_body(jasindo_rfd())
    event = LossEventFacts(
        "flood", date(2026, 2, 8), date(2026, 2, 14), {"min_inundation_days": Decimal(2)}
    )
    result = coverage(record, POLICY, ASSET, event)
    assert result.status == "not_covered"
    assert any("Condition not met" in step.text for step in result.reasons)


def test_stage_beyond_last_bounded_stage_uses_last_pct() -> None:
    body = staged_record()
    body["sum_insured"]["by_stage"][-1]["until_days_after_planting"] = 90
    record = PolicyRecordView.from_body(body)
    asset = AssetFacts("A", "parcel", area_ha=Decimal(1), planting_date=date(2026, 1, 1))
    assert sum_insured(record, asset, date(2026, 12, 1)) == 8_000_000


def test_per_head_fixed_value_with_and_without_cap() -> None:
    body = autsk()
    body["sum_insured"] = {
        "basis": "per_head",
        "amount_minor": 5_000_000,
        "value_source": "fixed",
        "clause": {"id": "6.1"},
    }
    herd = AssetFacts("H", "livestock", head_count=3)
    uncapped = PolicyRecordView.from_body(body)
    assert sum_insured(uncapped, herd, date(2026, 1, 1)) == 15_000_000
    body["sum_insured"]["cap_minor"] = 4_000_000
    capped = PolicyRecordView.from_body(body)
    assert sum_insured(capped, herd, date(2026, 1, 1)) == 12_000_000
    body["sum_insured"].pop("amount_minor")
    with pytest.raises(ValueError, match="amount_minor"):
        sum_insured(PolicyRecordView.from_body(body), herd, date(2026, 1, 1))


def test_tool_declaration() -> None:
    assert [t.name for t in tools.TOOLS] == ["rules.propose_amount"]


def test_coverage_peril_without_conditions_is_covered() -> None:
    from .records import askrindo_ryp

    record = PolicyRecordView.from_body(askrindo_ryp())
    event = LossEventFacts("pest_disease", date(2026, 2, 8), date(2026, 2, 14))
    result = coverage(record, POLICY, ASSET, event)
    assert result.status == "covered"
    assert any("is listed" in step.text for step in result.reasons)
