"""Capability tags (FR-02.6). Every value in the agent runtime is ``Tagged[T]``.

Origin grammar is in specs/00-shared/tools-and-tiers.md. ``readers`` is a set of principal
strings (for example ``user:<id>``, ``insurer:<id>``, ``role:superadmin``) or ``None`` for
"anyone allowed to see the object this value is attached to".
"""

from __future__ import annotations

import re
from collections.abc import Callable, Iterable
from dataclasses import dataclass

# Least trusted first. A derived value takes the least trusted origin of its inputs.
ORIGIN_KINDS: tuple[str, ...] = (
    "untrusted",
    "pipeline",
    "risk_model",
    "rules_engine",
    "record",
    "user",
    "system",
)
_RANK = {k: i for i, k in enumerate(ORIGIN_KINDS)}
UNTRUSTED_KINDS = ("insurer_pdf", "photo", "document", "hazard_text")

_PATTERNS: dict[str, re.Pattern[str]] = {
    "user": re.compile(r"^user:[^:\s]+$"),
    "record": re.compile(r"^record:[^:@\s]+@[^:\s]+$"),
    "rules_engine": re.compile(r"^rules_engine:[^:\s]+$"),
    "risk_model": re.compile(r"^risk_model:[^:\s]+$"),
    "pipeline": re.compile(r"^pipeline:[^:@\s]+@[^:\s]+$"),
    "system": re.compile(r"^system$"),
    "untrusted": re.compile(r"^untrusted:(" + "|".join(UNTRUSTED_KINDS) + r"):[^:\s]+$"),
}


class OriginError(ValueError):
    pass


@dataclass(frozen=True, slots=True)
class Origin:
    kind: str
    ref: str = ""  # everything after the kind, as written

    @classmethod
    def parse(cls, text: str) -> Origin:
        kind = text.split(":", 1)[0]
        pat = _PATTERNS.get(kind)
        if pat is None or not pat.match(text):
            raise OriginError(f"invalid origin: {text!r}")
        return cls(kind, text[len(kind) + 1 :])

    def __str__(self) -> str:
        return f"{self.kind}:{self.ref}" if self.ref else self.kind

    @property
    def untrusted(self) -> bool:
        return self.kind == "untrusted"

    @property
    def rank(self) -> int:
        return _RANK[self.kind]

    def sort_key(self) -> tuple[int, str]:
        return (self.rank, str(self))


def least_trusted(origins: Iterable[Origin]) -> Origin:
    items = list(origins)
    if not items:
        raise OriginError("no origins to combine")
    return min(items, key=Origin.sort_key)


Readers = frozenset[str] | None


def intersect_readers(a: Readers, b: Readers) -> Readers:
    if a is None:
        return b
    if b is None:
        return a
    return a & b


@dataclass(frozen=True, slots=True)
class Tagged[T]:
    value: T
    origin: Origin
    readers: Readers = None
    # Every origin that contributed, including this one. Lets policies see taint after merging.
    sources: frozenset[Origin] = frozenset()

    def __post_init__(self) -> None:
        if self.origin not in self.sources:
            object.__setattr__(self, "sources", self.sources | {self.origin})

    @classmethod
    def of(cls, value: T, origin: str | Origin, readers: Iterable[str] | None = None) -> Tagged[T]:
        o = Origin.parse(origin) if isinstance(origin, str) else origin
        return cls(value, o, None if readers is None else frozenset(readers))

    @property
    def tainted(self) -> bool:
        """True if any contributing origin is untrusted."""
        return any(o.untrusted for o in self.sources)

    def can_be_read_by(self, principals: Iterable[str]) -> bool:
        return self.readers is None or bool(self.readers & set(principals))


def combine[U](inputs: Iterable[Tagged[object]], value: U) -> Tagged[U]:
    """Tag a value derived from ``inputs``: least trusted origin, union of sources,
    intersection of readers. Taint never disappears through derivation."""
    items = list(inputs)
    if not items:
        raise OriginError("a derived value needs at least one tagged input")
    sources: frozenset[Origin] = frozenset().union(*(i.sources for i in items))
    readers: Readers = None
    for i in items:
        readers = intersect_readers(readers, i.readers)
    return Tagged(value, least_trusted(i.origin for i in items), readers, sources)


def map_tagged[T, U](src: Tagged[T], fn: Callable[[T], U]) -> Tagged[U]:
    return Tagged(fn(src.value), src.origin, src.readers, src.sources)
