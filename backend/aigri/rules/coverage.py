"""Coverage pre-check (FR-05.3). Never a denial: ``not_covered`` is a note for the Adjuster."""

from __future__ import annotations

from typing import Literal

from aigri.rules.model import (
    AssetFacts,
    CoverageResult,
    LossEventFacts,
    PolicyFacts,
    PolicyRecordView,
)
from aigri.rules.trail import TrailBuilder


def coverage(
    record: PolicyRecordView,
    policy: PolicyFacts,
    asset: AssetFacts,
    loss_event: LossEventFacts,
) -> CoverageResult:
    trail = TrailBuilder()
    failed = False
    if not (policy.starts_on <= loss_event.started_on <= policy.ends_on):
        failed = True
        trail.add(record.period_clause, "The loss began outside the policy period")
    cover = next((p for p in record.perils_covered if p.peril == loss_event.peril), None)
    if cover is None:
        failed = True
        trail.add(None, f"The peril {loss_event.peril} is not listed in the record")
    if asset.asset_id not in policy.asset_ids:
        failed = True
        trail.add(None, f"The asset {asset.asset_id} is not on the policy")

    missing = False
    if cover is not None:
        if not cover.conditions:
            trail.add(cover.clause, f"The peril {cover.peril} is listed")
        for cond in cover.conditions:
            measure = loss_event.measures.get(cond.kind)
            if measure is None:
                missing = True
                trail.add(cover.clause, f"Needs the Adjuster to confirm: {cond.text}")
            elif measure < cond.value:
                failed = True
                trail.add(cover.clause, f"Condition not met: {cond.text}")
            else:
                trail.add(cover.clause, f"Condition met: {cond.text}")

    status: Literal["covered", "not_covered", "needs_adjuster"]
    if failed:
        status = "not_covered"
    elif missing:
        status = "needs_adjuster"
    else:
        status = "covered"
    return CoverageResult(
        status=status, reasons=trail.build(), exclusions_for_adjuster=record.exclusions
    )
