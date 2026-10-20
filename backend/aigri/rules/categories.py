"""Loss category lookup (FR-05.5)."""

from __future__ import annotations

from decimal import Decimal

from aigri.rules.model import CategoryResult, LossCategoryRule, PolicyRecordView


def _matches(rule: LossCategoryRule, pct: Decimal) -> bool:
    if rule.min_loss_pct is not None and pct < rule.min_loss_pct:
        return False
    return not (rule.max_loss_pct is not None and pct >= rule.max_loss_pct)


def loss_category_rule(record: PolicyRecordView, assessed_pct: Decimal) -> LossCategoryRule:
    for rule in record.loss_categories:
        if _matches(rule, assessed_pct):
            return rule
    raise LookupError(f"no loss category matches {assessed_pct}% in {record.policy_record_id}")


def loss_category(record: PolicyRecordView, assessed_pct: Decimal) -> CategoryResult:
    """First category by ``min_loss_pct`` (inclusive) and ``max_loss_pct`` (exclusive)."""
    rule = loss_category_rule(record, assessed_pct)
    return CategoryResult(category=rule.category, pays=rule.pays, clause=rule.clause)
