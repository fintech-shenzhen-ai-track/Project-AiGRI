"""Policy Record bodies for the gold tests (PLAN section 2; decisions D-07, D-37, D-38).

Clause numbers follow PLAN 2.6 (Jasindo: 3.1 period, 4.1 flood, 4.2 drought, 6.1 sum insured,
6.2 franchise, 6.3 loss categories, 7.1 premium, 8.1 notice, 9.1 settlement).
"""

from __future__ import annotations

import importlib
from collections.abc import Callable
from copy import deepcopy
from typing import Any

import pytest


def rules_fn(module: str, name: str) -> Callable[..., Any]:
    """Import a phase B function lazily so the test fails (xfail) until the task lands."""
    mod = importlib.import_module(f"aigri.rules.{module}")
    fn: Callable[..., Any] = getattr(mod, name)
    return fn


def not_built(task: str) -> pytest.MarkDecorator:
    return pytest.mark.xfail(strict=True, reason=f"{task} not built")


def c(clause_id: str) -> dict[str, Any]:
    return {"id": clause_id}


_EXTRACTION = {
    "model": "fixture",
    "confidence": 1,
    "needs_review": [],
    "self_check": {"questions": 0, "disagreements": 0},
    "injection_findings": 0,
}


def _crop_cats(partial_from: str = "10", total_from: str = "90") -> list[dict[str, Any]]:
    return [
        {
            "category": "no_loss",
            "max_loss_pct": partial_from,
            "pays": "nothing",
            "clause": c("6.3"),
        },
        {
            "category": "partial",
            "min_loss_pct": partial_from,
            "max_loss_pct": total_from,
            "pays": "assessed_pct_of_sum_insured",
            "clause": c("6.3"),
        },
        {
            "category": "total",
            "min_loss_pct": total_from,
            "pays": "full_sum_insured",
            "clause": c("6.3"),
        },
    ]


def _crop_record(
    record_id: str,
    code: str,
    name: str,
    per_ha: int,
    rate: str,
    perils: list[dict[str, Any]],
    partial_from: str = "10",
) -> dict[str, Any]:
    return {
        "policy_record_id": record_id,
        "version": 1,
        "status": "published",
        "insurer": {"insurer_id": f"ins-{code.lower()}", "code": code, "name": name},
        "product_name": {"value": "Rice cover", "clause": c("1.1")},
        "product_type": "crop_indemnity",
        "insured_class": {"kind": "crop", "crop": "rice", "unit": "parcel", "clause": c("2.1")},
        "period": {"rule": "purchase_to_season_end", "clause": c("3.1")},
        "currency": "IDR",
        "perils_covered": perils,
        "exclusions": [{"exclusion": "Losses from poor farming practice", "clause": c("5.1")}],
        "sum_insured": {
            "basis": "per_hectare",
            "amount_minor": per_ha,
            "value_source": "fixed",
            "clause": c("6.1"),
        },
        "deductible": {
            "kind": "franchise",
            "pct": "10",
            "applies": "per_asset",
            "clause": c("6.2"),
        },
        "premium": {"rate_pct_of_sum_insured": rate, "per": "season", "clause": c("7.1")},
        "loss_categories": _crop_cats(partial_from),
        "deadlines": [
            {
                "event": "notice_of_loss",
                "days": 7,
                "from": "loss_event_end",
                "day_kind": "calendar",
                "text": "Report a loss within 7 days after the event ends",
                "source": "document",
                "clause": c("8.1"),
            },
            {
                "event": "settlement",
                "days": 14,
                "from": "complete_claim",
                "day_kind": "calendar",
                "text": "Decision within 14 days of a complete claim",
                "source": "document",
                "clause": c("9.1"),
            },
        ],
        "documents_required": [{"doc": "Photos of the damage", "clause": c("8.2")}],
        "extraction": dict(_EXTRACTION),
    }


FLOOD = {
    "peril": "flood",
    "clause": c("4.1"),
    "conditions": [
        {"kind": "min_inundation_days", "value": 3, "text": "Water covers the crop for 3 days"}
    ],
}
DROUGHT = {
    "peril": "drought",
    "clause": c("4.2"),
    "conditions": [
        {"kind": "min_irrigation_failure_days", "value": 21, "text": "Irrigation fails 21 days"}
    ],
}
PEST = {"peril": "pest_disease", "clause": c("4.3")}


def jasindo_rfd() -> dict[str, Any]:
    """PR-JSD-RFD-2026: Rp8.000.000/ha, 3,5%, franchise 10% per parcel (D-07)."""
    return _crop_record(
        "PR-JSD-RFD-2026", "JSD", "Asuransi Jasindo", 8_000_000, "3.5", [FLOOD, DROUGHT]
    )


def askrindo_ryp() -> dict[str, Any]:
    """PR-ASK-RYP-2026: Rp7.500.000/ha, 3,2%, pays from 20% loss (Clause 5.3)."""
    rec = _crop_record(
        "PR-ASK-RYP-2026", "ASK", "Askrindo", 7_500_000, "3.2", [FLOOD, DROUGHT, PEST], "20"
    )
    rec["deductible"]["pct"] = "20"
    return rec


def sinarmas_pfc() -> dict[str, Any]:
    """PR-SMI-PFC-2026: Rp6.000.000/ha, 2,4%, flood only (Clause 3.2)."""
    return _crop_record("PR-SMI-PFC-2026", "SMI", "Asuransi Sinar Mas", 6_000_000, "2.4", [FLOOD])


def autp() -> dict[str, Any]:
    """PR-JSD-AUTP-2026: scheme, Rp6.000.000/ha, 3%, subsidy 80%, damage >=75% pays in full.

    Scheme clause id is "Scheme rule 2.1", the only scheme rule PLAN gives.
    """
    rec = _crop_record(
        "PR-JSD-AUTP-2026", "JSD", "Asuransi Jasindo", 6_000_000, "3", [FLOOD, DROUGHT]
    )
    rec["scheme"] = {
        "code": "AUTP",
        "subsidy_pct": "80",
        "subsidy_payer": "Government of Indonesia",
        "clause": c("Scheme rule 2.1"),
    }
    rec.pop("deductible")
    rec["loss_categories"] = [
        {"category": "no_loss", "max_loss_pct": "25", "pays": "nothing", "clause": c("5.1")},
        {
            "category": "partial",
            "min_loss_pct": "25",
            "max_loss_pct": "75",
            "pays": "assessed_pct_of_sum_insured",
            "clause": c("5.1"),
        },
        {"category": "total", "min_loss_pct": "75", "pays": "full_sum_insured", "clause": c("5.1")},
    ]
    return rec


def autsk() -> dict[str, Any]:
    """PR-JSD-AUTSK-2026: livestock scheme, min(declared, cap 10.000.000)/head, 2%, subsidy 80%.

    Scheme clause id reuses "Scheme rule 2.1" (PLAN gives no livestock scheme rule).
    """
    rec = _crop_record("PR-JSD-AUTSK-2026", "JSD", "Asuransi Jasindo", 0, "2", [])
    rec["product_type"] = "livestock_mortality"
    rec["insured_class"] = {
        "kind": "livestock",
        "species": ["cattle", "buffalo"],
        "unit": "head",
        "identification": {"ear_tag": "required_at_purchase"},
        "clause": c("2.1"),
    }
    rec["perils_covered"] = [
        {"peril": "death_disease", "clause": c("4.1")},
        {"peril": "death_accident", "clause": c("4.1")},
    ]
    rec["sum_insured"] = {
        "basis": "per_head",
        "cap_minor": 10_000_000,
        "value_source": "declared_value_per_head",
        "clause": c("6.1"),
    }
    rec["scheme"] = {
        "code": "AUTS/K",
        "subsidy_pct": "80",
        "subsidy_payer": "Government of Indonesia",
        "clause": c("Scheme rule 2.1"),
    }
    rec.pop("deductible")
    rec["loss_categories"] = [
        {
            "category": "total",
            "min_loss_pct": "100",
            "pays": "full_sum_insured",
            "clause": c("5.1"),
        },
        {"category": "no_loss", "max_loss_pct": "100", "pays": "nothing", "clause": c("5.1")},
    ]
    return rec


def staged_record() -> dict[str, Any]:
    """Synthetic record with by_stage percentages (the demo records have none)."""
    rec = deepcopy(jasindo_rfd())
    rec["sum_insured"]["by_stage"] = [
        {"stage": "establishment", "until_days_after_planting": 30, "pct": "25"},
        {"stage": "vegetative", "until_days_after_planting": 60, "pct": "50"},
        {"stage": "maturity", "pct": "100"},
    ]
    return rec
