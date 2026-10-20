"""Proposed Amount (FR-05.6). The same code prices a promise at ranking time and a decision.

Order of steps per line: loss category (Clause on the category), then the deductible. A
``franchise`` pays in full once the threshold is reached and nothing below it; a ``deductible``
subtracts the threshold. D-07: Jasindo Clause 6.2 is a franchise per parcel. D-37: every line is
rounded half-up once, to whole minor units; the total is the sum of the rounded lines.

``per_policy`` applies the threshold to the policy as a whole: a franchise compares the
sum-insured-weighted assessed % of all lines with the threshold and zeroes every line below it; a
deductible subtracts ``pct`` of the total base from the total payout and shares the reduction across
lines in proportion to their payout before rounding.
"""

from __future__ import annotations

from collections.abc import Sequence
from decimal import Decimal

from aigri.rules._numeric import round_half_up
from aigri.rules.categories import loss_category_rule
from aigri.rules.model import (
    Line,
    LineAmount,
    LossCategoryRule,
    PolicyFacts,
    PolicyRecordView,
    ProposedAmount,
)
from aigri.rules.trail import TrailBuilder

_ZERO = Decimal(0)


def _base(line: Line) -> int:
    """What a full payout of the line is: matched heads x per-head sum insured for livestock."""
    if line.per_head_minor is not None and line.matched_heads is not None:
        return line.per_head_minor * line.matched_heads
    return line.sum_insured_minor


def _gross(rule: LossCategoryRule, base: int, pct: Decimal) -> Decimal:
    if rule.pays == "full_sum_insured":
        return Decimal(base)
    if rule.pays == "assessed_pct_of_sum_insured":
        return Decimal(base) * pct / 100
    return _ZERO


def _compute(
    record: PolicyRecordView, lines: Sequence[Line], pcts: Sequence[Decimal]
) -> tuple[LineAmount, ...]:
    ded = record.deductible
    rules = [loss_category_rule(record, p) for p in pcts]
    bases = [_base(line) for line in lines]
    gross = [_gross(r, b, p) for r, b, p in zip(rules, bases, pcts, strict=True)]
    net = list(gross)

    if ded is not None:
        if ded.applies == "per_asset":
            for i, (b, p) in enumerate(zip(bases, pcts, strict=True)):
                if ded.kind == "franchise":
                    net[i] = gross[i] if p >= ded.pct else _ZERO
                else:
                    net[i] = max(_ZERO, gross[i] - Decimal(b) * ded.pct / 100)
        else:
            total_base = Decimal(sum(bases))
            if ded.kind == "franchise":
                assessed = sum(
                    (Decimal(b) * p / 100 for b, p in zip(bases, pcts, strict=True)), _ZERO
                )
                weighted = assessed * 100 / total_base if total_base else _ZERO
                if weighted < ded.pct:
                    net = [_ZERO for _ in gross]
            else:
                total_gross = sum(gross, _ZERO)
                reduced = max(_ZERO, total_gross - total_base * ded.pct / 100)
                if total_gross:
                    net = [g * reduced / total_gross for g in gross]

    out: list[LineAmount] = []
    for line, rule, pct, amount in zip(lines, rules, pcts, net, strict=True):
        trail = TrailBuilder()
        if line.per_head_minor is not None and line.matched_heads is not None:
            trail.add(
                record.sum_insured.clause,
                f"Sum insured per head {line.per_head_minor} x {line.matched_heads} matched heads",
            )
        else:
            trail.add(record.sum_insured.clause, f"Sum insured {line.sum_insured_minor}")
        trail.add(
            rule.clause,
            f"Assessed {format(pct, 'f')}% is category {rule.category}: pays {rule.pays}",
        )
        if ded is not None:
            trail.add(
                ded.clause,
                f"{ded.kind.capitalize()} of {format(ded.pct, 'f')}% applied {ded.applies}",
            )
        if line.unmatched_tags:
            trail.add(None, "Unmatched Ear Tags pay zero: " + ", ".join(line.unmatched_tags))
        out.append(
            LineAmount(
                asset_id=line.asset_id,
                sum_insured_minor=line.sum_insured_minor,
                assessed_pct=pct,
                category=rule.category,
                amount_minor=round_half_up(amount),
                trail=trail.build(),
                unmatched_tags=line.unmatched_tags,
            )
        )
    return tuple(out)


def proposed_amount(
    record: PolicyRecordView, policy: PolicyFacts, lines: Sequence[Line]
) -> ProposedAmount:
    """Line amounts, total and the clause trail per line. ``policy`` identifies the policy the
    lines belong to; the amounts depend only on the record and the lines."""
    del policy  # coverage of the asset is checked by ``coverage``; kept for the contract (C16)
    amounts = _compute(record, lines, [line.assessed_pct for line in lines])
    return ProposedAmount(
        currency=record.currency,
        lines=amounts,
        total_minor=sum(a.amount_minor for a in amounts),
    )


def payout_for_pct(record: PolicyRecordView, line: Line, assessed_pct: Decimal) -> int:
    """Payout of one asset line at an assessed % (per-asset basis), in minor units."""
    return _compute(record, [line], [assessed_pct])[0].amount_minor
