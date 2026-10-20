"""Sum insured per asset (FR-05.1)."""

from __future__ import annotations

from datetime import date
from decimal import Decimal

from aigri.rules._compat import round_half_up
from aigri.rules.model import AssetFacts, PolicyRecordView


def _stage_pct(record: PolicyRecordView, asset: AssetFacts, as_of: date) -> Decimal:
    stages = record.sum_insured.by_stage
    if not stages:
        return Decimal(100)
    if asset.planting_date is None:
        raise ValueError("planting_date is required when the record has by_stage")
    days = (as_of - asset.planting_date).days
    for stage in stages:
        if stage.until_days_after_planting is None or days <= stage.until_days_after_planting:
            return stage.pct
    return stages[-1].pct


def sum_insured(record: PolicyRecordView, asset: AssetFacts, as_of: date) -> int:
    """Minor units, rounded once (D-37). Per hectare: amount x area x stage %. Per head:
    min(value, cap) x head count."""
    spec = record.sum_insured
    if spec.basis == "per_hectare":
        if asset.area_ha is None or spec.amount_minor is None:
            raise ValueError("per_hectare needs area_ha and amount_minor")
        pct = _stage_pct(record, asset, as_of)
        return round_half_up(Decimal(spec.amount_minor) * asset.area_ha * pct / 100)
    if asset.head_count is None:
        raise ValueError("per_head needs head_count")
    if spec.value_source == "declared_value_per_head":
        if asset.declared_value_minor is None:
            raise ValueError("declared_value_minor is required for declared_value_per_head")
        value = asset.declared_value_minor
    else:
        if spec.amount_minor is None:
            raise ValueError("per_head with fixed value needs amount_minor")
        value = spec.amount_minor
    if spec.cap_minor is not None:
        value = min(value, spec.cap_minor)
    return value * asset.head_count
