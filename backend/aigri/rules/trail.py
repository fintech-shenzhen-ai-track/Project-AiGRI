"""Clause trail builder and canonical serialisation (FR-05.9, FR-05.10)."""

from __future__ import annotations

from dataclasses import fields, is_dataclass
from datetime import date
from decimal import Decimal
from typing import Any

from aigri.core.hashing import jcs
from aigri.rules.model import ClauseRef, TrailStep


class TrailBuilder:
    """Collects the steps of one computation, each with the clause behind it."""

    def __init__(self) -> None:
        self._steps: list[TrailStep] = []

    def add(self, clause: ClauseRef | str | None, text: str) -> None:
        cid = clause.id if isinstance(clause, ClauseRef) else clause
        self._steps.append(TrailStep(clause=cid, text=text))

    def build(self) -> tuple[TrailStep, ...]:
        return tuple(self._steps)


def to_jsonable(value: Any) -> Any:
    """Frozen dataclasses, Decimals and dates to JSON-compatible values (Decimal as string)."""
    if is_dataclass(value) and not isinstance(value, type):
        return {f.name: to_jsonable(getattr(value, f.name)) for f in fields(value)}
    if isinstance(value, Decimal):
        return format(value, "f")
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, dict):
        return {str(k): to_jsonable(v) for k, v in value.items()}
    if isinstance(value, list | tuple):
        return [to_jsonable(v) for v in value]
    return value


def canonical_json(value: Any) -> bytes:
    """Byte-identical canonical JSON (RFC 8785) of any rules output (US-05.3)."""
    jsonable = to_jsonable(value)
    _reject_floats(jsonable)
    return jcs(jsonable)


def _reject_floats(value: Any) -> None:
    """Payloads carry no floats (no float money); ``jcs`` itself would accept them."""
    if isinstance(value, float):
        raise TypeError("floats are not allowed in canonical payloads")
    if isinstance(value, dict):
        for v in value.values():
            _reject_floats(v)
    elif isinstance(value, list | tuple):
        for v in value:
            _reject_floats(v)
    elif value is not None and not isinstance(value, bool | int | str):
        raise TypeError(f"not JSON-compatible: {type(value).__name__}")
