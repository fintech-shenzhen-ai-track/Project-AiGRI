"""Frozen dataclasses of the rules engine (FR-05.9). Pure: no database, network or model."""

from __future__ import annotations

import json
import os
from collections.abc import Mapping, Sequence
from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal
from functools import lru_cache
from pathlib import Path
from typing import Any, Literal

import jsonschema

from aigri.rules._numeric import parse_pct

SCHEMA_FILE = "policy-record.schema.json"


class PolicyRecordError(ValueError):
    """The body does not validate against the Policy Record schema."""

    def __init__(self, errors: Sequence[str]) -> None:
        self.errors = tuple(errors)
        super().__init__("; ".join(self.errors))


def _schema_path() -> Path:
    env = os.environ.get("AIGRI_SCHEMA_DIR")
    if env:
        return Path(env) / SCHEMA_FILE
    for parent in Path(__file__).resolve().parents:
        candidate = parent / "specs" / "00-shared" / "schemas" / SCHEMA_FILE
        if candidate.is_file():
            return candidate
    raise FileNotFoundError(f"{SCHEMA_FILE} not found; set AIGRI_SCHEMA_DIR")


@lru_cache(maxsize=1)
def _validator() -> Any:
    schema = json.loads(_schema_path().read_text(encoding="utf-8"))
    cls = jsonschema.validators.validator_for(schema)
    cls.check_schema(schema)
    return cls(schema)


@dataclass(frozen=True)
class ClauseRef:
    id: str
    page: int | None = None


@dataclass(frozen=True)
class SchemeSpec:
    code: str
    subsidy_pct: Decimal
    subsidy_payer: str
    clause: ClauseRef | None = None


@dataclass(frozen=True)
class StageSpec:
    stage: str
    pct: Decimal
    until_days_after_planting: int | None = None


@dataclass(frozen=True)
class SumInsuredSpec:
    basis: Literal["per_hectare", "per_head"]
    clause: ClauseRef
    amount_minor: int | None = None
    cap_minor: int | None = None
    value_source: Literal["fixed", "declared_value_per_head"] = "fixed"
    by_stage: tuple[StageSpec, ...] = ()


@dataclass(frozen=True)
class DeductibleSpec:
    kind: Literal["franchise", "deductible"]
    pct: Decimal
    applies: Literal["per_asset", "per_policy"]
    clause: ClauseRef


@dataclass(frozen=True)
class PremiumSpec:
    rate_pct_of_sum_insured: Decimal
    clause: ClauseRef
    per: str | None = None


@dataclass(frozen=True)
class LossCategoryRule:
    category: Literal["total", "partial", "no_loss"]
    pays: Literal["full_sum_insured", "assessed_pct_of_sum_insured", "nothing"]
    clause: ClauseRef
    min_loss_pct: Decimal | None = None
    max_loss_pct: Decimal | None = None  # exclusive


@dataclass(frozen=True)
class PerilCondition:
    kind: Literal["min_inundation_days", "min_irrigation_failure_days", "min_wind_kmh"]
    value: Decimal
    text: str


@dataclass(frozen=True)
class PerilCover:
    peril: str
    clause: ClauseRef
    conditions: tuple[PerilCondition, ...] = ()


@dataclass(frozen=True)
class ExclusionSpec:
    exclusion: str
    clause: ClauseRef


@dataclass(frozen=True)
class DeadlineRule:
    event: Literal["notice_of_loss", "claim_documents", "settlement", "appeal"]
    days: int
    from_: Literal["loss_event_start", "loss_event_end", "notice", "complete_claim", "decision"]
    day_kind: Literal["calendar", "business"]
    text: str
    source: Literal["document", "insurer_entered"]
    clause: ClauseRef | None = None


def _clause(d: Mapping[str, Any] | None) -> ClauseRef | None:
    if d is None:
        return None
    return ClauseRef(id=str(d["id"]), page=d.get("page"))


def _req_clause(d: Mapping[str, Any]) -> ClauseRef:
    return ClauseRef(id=str(d["id"]), page=d.get("page"))


@dataclass(frozen=True)
class PolicyRecordView:
    """Parsed, validated Policy Record. Percentages are ``Decimal``, never float."""

    policy_record_id: str
    version: int
    currency: str
    product_type: Literal["crop_indemnity", "livestock_mortality"]
    sum_insured: SumInsuredSpec
    premium: PremiumSpec
    loss_categories: tuple[LossCategoryRule, ...]
    deadlines: tuple[DeadlineRule, ...]
    perils_covered: tuple[PerilCover, ...]
    exclusions: tuple[ExclusionSpec, ...] = ()
    deductible: DeductibleSpec | None = None
    scheme: SchemeSpec | None = None
    insurer_code: str = ""
    period_rule: str = ""
    period_clause: ClauseRef | None = None

    @classmethod
    def from_body(cls, body: Mapping[str, Any]) -> PolicyRecordView:
        """Validate ``body`` against the Policy Record schema and convert it (FR-05.9)."""
        errors = sorted(
            f"{'/'.join(str(p) for p in e.absolute_path) or '<root>'}: {e.message}"
            for e in _validator().iter_errors(dict(body))
        )
        if errors:
            raise PolicyRecordError(errors)

        si = body["sum_insured"]
        ded = body.get("deductible")
        sch = body.get("scheme")
        return cls(
            policy_record_id=body["policy_record_id"],
            version=body["version"],
            currency=body["currency"],
            product_type=body["product_type"],
            insurer_code=body["insurer"]["code"],
            period_rule=body["period"]["rule"],
            period_clause=_clause(body["period"].get("clause")),
            sum_insured=SumInsuredSpec(
                basis=si["basis"],
                clause=_req_clause(si["clause"]),
                amount_minor=si.get("amount_minor"),
                cap_minor=si.get("cap_minor"),
                value_source=si.get("value_source", "fixed"),
                by_stage=tuple(
                    StageSpec(
                        stage=s["stage"],
                        pct=parse_pct(s["pct"]),
                        until_days_after_planting=s.get("until_days_after_planting"),
                    )
                    for s in si.get("by_stage", ())
                ),
            ),
            premium=PremiumSpec(
                rate_pct_of_sum_insured=parse_pct(body["premium"]["rate_pct_of_sum_insured"]),
                clause=_req_clause(body["premium"]["clause"]),
                per=body["premium"].get("per"),
            ),
            loss_categories=tuple(
                LossCategoryRule(
                    category=c["category"],
                    pays=c["pays"],
                    clause=_req_clause(c["clause"]),
                    min_loss_pct=parse_pct(c["min_loss_pct"]) if "min_loss_pct" in c else None,
                    max_loss_pct=parse_pct(c["max_loss_pct"]) if "max_loss_pct" in c else None,
                )
                for c in body["loss_categories"]
            ),
            deadlines=tuple(
                DeadlineRule(
                    event=d["event"],
                    days=d["days"],
                    from_=d["from"],
                    day_kind=d["day_kind"],
                    text=d["text"],
                    source=d["source"],
                    clause=_clause(d.get("clause")),
                )
                for d in body["deadlines"]
            ),
            perils_covered=tuple(
                PerilCover(
                    peril=p["peril"],
                    clause=_req_clause(p["clause"]),
                    conditions=tuple(
                        PerilCondition(
                            kind=c["kind"], value=Decimal(str(c["value"])), text=c["text"]
                        )
                        for c in p.get("conditions", ())
                    ),
                )
                for p in body["perils_covered"]
            ),
            exclusions=tuple(
                ExclusionSpec(exclusion=e["exclusion"], clause=_req_clause(e["clause"]))
                for e in body["exclusions"]
            ),
            deductible=(
                None
                if ded is None
                else DeductibleSpec(
                    kind=ded["kind"],
                    pct=parse_pct(ded["pct"]),
                    applies=ded["applies"],
                    clause=_req_clause(ded["clause"]),
                )
            ),
            scheme=(
                None
                if sch is None
                else SchemeSpec(
                    code=sch["code"],
                    subsidy_pct=parse_pct(sch["subsidy_pct"]),
                    subsidy_payer=sch["subsidy_payer"],
                    clause=_clause(sch.get("clause")),
                )
            ),
        )


# ---- facts (inputs) -------------------------------------------------------------------------


@dataclass(frozen=True)
class AssetFacts:
    """A parcel (``area_ha``, ``planting_date``) or a livestock group (``head_count``)."""

    asset_id: str
    kind: Literal["parcel", "livestock"]
    area_ha: Decimal | None = None
    planting_date: date | None = None
    declared_value_minor: int | None = None  # per head
    head_count: int | None = None


@dataclass(frozen=True)
class PolicyFacts:
    policy_id: str
    record_id: str
    starts_on: date
    ends_on: date
    asset_ids: tuple[str, ...]


@dataclass(frozen=True)
class LossEventFacts:
    peril: str
    started_on: date
    ended_on: date
    measures: Mapping[str, Decimal] = field(default_factory=dict)  # keyed by condition kind


@dataclass(frozen=True)
class AssessmentFacts:
    asset_id: str
    assessed_pct: Decimal


@dataclass(frozen=True)
class RiskClass:
    """One Risk Model output class: probability and damage fraction (0..1) for a peril."""

    peril: str
    probability: Decimal
    damage_fraction: Decimal


@dataclass(frozen=True)
class Line:
    """One asset line fed to ``proposed_amount`` and ``expected_payout``.

    Crop: ``sum_insured_minor`` for the parcel. Livestock: ``per_head_minor`` and ``matched_heads``
    (a death pays per matched head; unmatched Ear Tags pay zero and are listed).
    """

    asset_id: str
    sum_insured_minor: int
    assessed_pct: Decimal
    per_head_minor: int | None = None
    matched_heads: int | None = None
    unmatched_tags: tuple[str, ...] = ()


# ---- outputs --------------------------------------------------------------------------------


@dataclass(frozen=True)
class TrailStep:
    clause: str | None
    text: str


@dataclass(frozen=True)
class LineAmount:
    asset_id: str
    sum_insured_minor: int
    assessed_pct: Decimal
    category: str
    amount_minor: int
    trail: tuple[TrailStep, ...]
    unmatched_tags: tuple[str, ...] = ()


@dataclass(frozen=True)
class ProposedAmount:
    currency: str
    lines: tuple[LineAmount, ...]
    total_minor: int


@dataclass(frozen=True)
class PremiumSplit:
    premium_minor: int
    subsidy_minor: int
    client_share_minor: int


@dataclass(frozen=True)
class CategoryResult:
    category: Literal["total", "partial", "no_loss"]
    pays: str
    clause: ClauseRef


@dataclass(frozen=True)
class CoverageResult:
    status: Literal["covered", "not_covered", "needs_adjuster"]
    reasons: tuple[TrailStep, ...]
    exclusions_for_adjuster: tuple[ExclusionSpec, ...] = ()


@dataclass(frozen=True)
class DeadlineItem:
    event: str
    due: date
    day_kind: str
    clause: str | None
    source: str
    text: str


@dataclass(frozen=True)
class DeadlineSet:
    items: tuple[DeadlineItem, ...]

    def due(self, event: str) -> date | None:
        for i in self.items:
            if i.event == event:
                return i.due
        return None
