"""Country packs: load, validate, serve, and format (FR-01.10, DESIGN.md section 11).

Every ``packs/*.yaml`` is validated at load against ``country-pack.schema.json`` (when the schema
file is reachable) and against the typed models below, which mirror it. Components and services
never hard-code a symbol, unit, zone label or separator: they read the pack.

The formatters port ``portals/lib/pack/format.ts`` so both produce identical strings (shared
cases: ``specs/01-foundation/format-cases.json``, T-01.10). Arithmetic is exact ``Decimal`` with
half-up rounding (D-37), never ``float``.
"""

import json
import os
import re
from datetime import UTC, date, datetime
from decimal import ROUND_HALF_UP, Decimal
from functools import lru_cache
from pathlib import Path
from typing import Any, Literal
from zoneinfo import ZoneInfo

import jsonschema
import yaml
from pydantic import BaseModel, ConfigDict, Field, model_validator

_REPO = Path(__file__).resolve().parents[3]
SCHEMA_RELATIVE = Path("specs/00-shared/schemas/country-pack.schema.json")


class PackError(ValueError):
    """A pack file is invalid."""


class PackNotFound(KeyError):
    """No pack with that code."""


# ---------------------------------------------------------------------------------------------
# Typed model (mirrors country-pack.schema.json; additionalProperties: false)


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class CompactUnit(_Strict):
    at_least: float
    suffix: str
    divide_by: float


class Currency(_Strict):
    code: str = Field(pattern=r"^[A-Z]{3}$")
    symbol: str
    symbol_spacing: Literal["none", "space"] = "none"
    display_decimals: int = Field(ge=0, le=3)
    minor_unit_exponent: int = Field(ge=0, le=3)
    compact_units: list[CompactUnit] = []


class Formats(_Strict):
    decimal: str = Field(max_length=1)
    thousands: str = Field(max_length=1)
    date: str
    datetime: str
    phone_example: str | None = None


class AreaUnit(_Strict):
    code: Literal["ha", "rai"]
    label: str
    per_hectare: float


class Timezone(_Strict):
    iana: str
    label: str
    default: bool = False


class Regulator(_Strict):
    short: str
    name: str


class HazardSource(_Strict):
    id: str
    name: str
    kind: Literal[
        "warnings",
        "forecast",
        "hazard_map",
        "disaster_records",
        "flood_map",
        "satellite",
        "cyclone",
    ]
    access: str | None = None


class PublicScheme(_Strict):
    code: str
    name: str
    gloss: str


class Region(_Strict):
    code: str
    name: str
    level: Literal["province", "regency", "district"]
    parent: str | None = None


class PackInsurer(_Strict):
    code: str = Field(pattern=r"^[A-Z]{3}$")
    name: str
    initials: str


class SetupStep(_Strict):
    step: str
    done: bool


class Pack(_Strict):
    code: str = Field(pattern=r"^[A-Z]{2}$")
    name: str
    status: Literal["live", "planned"]
    live_since: str | None = None
    currency: Currency
    locale: str
    format: Formats
    area_unit: AreaUnit
    timezones: list[Timezone] = Field(min_length=1)
    regulator: Regulator
    data_law: str
    payout_rails: list[str]
    hazard_sources: list[HazardSource]
    public_schemes: list[PublicScheme]
    regions: list[Region] = []
    insurers: list[PackInsurer]
    setup_steps: list[SetupStep]
    alert_loss_probability: float | None = Field(default=None, ge=0, le=1)

    @model_validator(mode="after")
    def _cross_checks(self) -> "Pack":
        if self.format.decimal == self.format.thousands:
            raise ValueError("decimal and thousands separators must differ")
        if sum(1 for z in self.timezones if z.default) != 1:
            raise ValueError("exactly one timezone must be the default")
        if self.status == "planned" and self.insurers:
            raise ValueError("a planned pack has no insurers (never invent names)")
        codes = {r.code for r in self.regions}
        for r in self.regions:
            if r.parent is not None and r.parent not in codes:
                raise ValueError(f"region {r.code}: unknown parent {r.parent}")
        return self

    @property
    def fmt(self) -> "Formatters":
        return Formatters(self)

    @property
    def default_timezone(self) -> Timezone:
        return next(z for z in self.timezones if z.default)


# ---------------------------------------------------------------------------------------------
# Loading and serving


def packs_dir() -> Path:
    env = os.environ.get("PACKS_DIR")
    return Path(env) if env else _REPO / "packs"


def _schema() -> dict[str, Any] | None:
    for base in (os.environ.get("PACKS_SCHEMA"), _REPO / SCHEMA_RELATIVE):
        if base and Path(base).is_file():
            loaded: dict[str, Any] = json.loads(Path(base).read_text(encoding="utf-8"))
            return loaded
    return None


def parse_pack(data: Any, source: str = "<pack>") -> Pack:
    """Validate one parsed YAML document and return the typed pack."""
    schema = _schema()
    if schema is not None:
        errors = sorted(
            jsonschema.Draft202012Validator(schema).iter_errors(data), key=lambda e: list(e.path)
        )
        if errors:
            first = errors[0]
            where = "/".join(str(p) for p in first.path) or "(root)"
            raise PackError(f"{source}: {where}: {first.message}")
    try:
        return Pack.model_validate(data)
    except ValueError as exc:
        raise PackError(f"{source}: {exc}") from exc


def load_packs(directory: Path | None = None) -> dict[str, Pack]:
    """Load and validate every ``*.yaml`` in the packs directory."""
    base = directory or packs_dir()
    files = sorted(base.glob("*.yaml"))
    if not files:
        raise PackError(f"no packs found in {base}")
    packs: dict[str, Pack] = {}
    for path in files:
        pack = parse_pack(yaml.safe_load(path.read_text(encoding="utf-8")), path.name)
        if pack.code != path.stem:
            raise PackError(f"{path.name}: code {pack.code} does not match the file name")
        packs[pack.code] = pack
    return packs


@lru_cache
def _registry() -> dict[str, Pack]:
    return load_packs()


def reload() -> None:
    _registry.cache_clear()


def all_packs() -> list[Pack]:
    return list(_registry().values())


def get_pack(code: str) -> Pack:
    try:
        return _registry()[code.upper()]
    except KeyError:
        raise PackNotFound(code) from None


def default_pack() -> Pack:
    return get_pack(os.environ.get("DEFAULT_PACK", "ID"))


def currency_exponent(currency: str) -> int:
    """Minor-unit exponent of a currency, from the pack that uses it (D-38)."""
    for pack in _registry().values():
        if pack.currency.code == currency:
            return pack.currency.minor_unit_exponent
    raise PackNotFound(f"no pack uses currency {currency}")


# ---------------------------------------------------------------------------------------------
# Formatters

MINUS = "−"
EN_DASH = "–"
MONTHS = ("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")

NumberInput = int | str | Decimal
DateInput = str | date | datetime
DT = datetime  # the Formatters.datetime method shadows the name inside the class body


def _dec(value: NumberInput) -> Decimal:
    if isinstance(value, float | bool):
        raise TypeError("numbers to format must be int, str or Decimal, never float")
    d = Decimal(value) if not isinstance(value, Decimal) else value
    if not d.is_finite():
        raise ValueError(f"cannot format {value!r}")
    return d


def _round(value: Decimal, places: int) -> Decimal:
    return value.quantize(Decimal(1).scaleb(-places), rounding=ROUND_HALF_UP)


def _digits(value: Decimal, pack: Pack, trim: bool = False) -> str:
    """Grouped digits of an already rounded, non-negative-or-negative value (sign ignored)."""
    v = abs(value)
    text = format(v, "f")
    int_part, _, frac = text.partition(".")
    grouped = re.sub(r"\B(?=(\d{3})+(?!\d))", pack.format.thousands, int_part)
    if trim:
        frac = frac.rstrip("0")
    return f"{grouped}{pack.format.decimal}{frac}" if frac else grouped


def _signed(value: Decimal, body: str) -> str:
    return f"{MINUS}{body}" if value < 0 and value != 0 else body


def _compact_decimals(unit: CompactUnit) -> int:
    # R-007 default (b) until answered: one decimal below a billion, two from a billion.
    return 2 if unit.divide_by >= 1_000_000_000 else 1


_DATE_ONLY = re.compile(r"^(\d{4})-(\d{2})-(\d{2})$")
_NAIVE = re.compile(r"^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?$")
_HAS_ZONE = re.compile(r"(?:Z|[+-]\d{2}:?\d{2})$", re.IGNORECASE)


class _Parts:
    __slots__ = ("d", "h", "has_time", "mi", "mo", "s", "y")

    def __init__(self, y: int, mo: int, d: int, h: int, mi: int, s: int, has_time: bool) -> None:
        self.y, self.mo, self.d, self.h, self.mi, self.s, self.has_time = (
            y,
            mo,
            d,
            h,
            mi,
            s,
            has_time,
        )


class Formatters:
    """All formatters bound to one pack (``pack.fmt``)."""

    def __init__(self, pack: Pack) -> None:
        self.pack = pack

    # numbers -------------------------------------------------------------------------------

    def num(self, value: NumberInput, decimals: int = 0) -> str:
        r = _round(_dec(value), decimals)
        return _signed(r, _digits(r, self.pack))

    def pct(self, value: NumberInput, decimals: int = 0) -> str:
        return f"{self.num(value, decimals)}%"

    def area(self, hectares: NumberInput) -> str:
        r = _round(_dec(hectares) * Decimal(str(self.pack.area_unit.per_hectare)), 1)
        return f"{_signed(r, _digits(r, self.pack))} {self.pack.area_unit.label}"

    # money ---------------------------------------------------------------------------------

    def _symbol(self) -> str:
        c = self.pack.currency
        return f"{c.symbol} " if c.symbol_spacing == "space" else c.symbol

    def _format_major(self, major: Decimal, sign: bool, compact: bool) -> str:
        cur = self.pack.currency
        rounded = _round(major, cur.display_decimals)
        body: str | None = None
        if compact and cur.compact_units:
            for unit in sorted(cur.compact_units, key=lambda u: u.at_least, reverse=True):
                if abs(major) >= Decimal(str(unit.at_least)):
                    r = _round(major / Decimal(str(unit.divide_by)), _compact_decimals(unit))
                    rounded = r
                    body = f"{self._symbol()}{_digits(r, self.pack, trim=True)}{unit.suffix}"
                    break
        if body is None:
            body = f"{self._symbol()}{_digits(rounded, self.pack)}"
        if rounded == 0:
            return body
        if major < 0:
            return f"{MINUS}{body}"
        return f"+{body}" if sign else body

    def money(self, amount: Any, *, sign: bool = False, compact: bool = False) -> str:
        """``amount`` is a ``core.money.Money`` (or anything with ``amount_minor`` and ``currency``)
        in the pack's currency. A plain int is taken as pack-currency minor units."""
        if isinstance(amount, int) and not isinstance(amount, bool):
            minor, currency = amount, self.pack.currency.code
        else:
            minor, currency = int(amount.amount_minor), amount.currency
        if currency != self.pack.currency.code:
            raise ValueError(
                f"cannot format {currency} with the {self.pack.code} pack "
                f"({self.pack.currency.code})"
            )
        major = Decimal(minor).scaleb(-self.pack.currency.minor_unit_exponent)
        return self._format_major(major, sign, compact)

    def money_major(self, major: NumberInput, *, sign: bool = False, compact: bool = False) -> str:
        return self._format_major(_dec(major), sign, compact)

    def rate(self, amount: Any, per: str) -> str:
        """``Rp280.000/ha``: pass ``"area"`` for the pack's area unit label."""
        unit = self.pack.area_unit.label if per == "area" else per
        return f"{self.money(amount)}/{unit}"

    # dates ---------------------------------------------------------------------------------

    def _zone_label(self, iana: str | None) -> str:
        if iana is None:
            return self.pack.default_timezone.label
        for z in self.pack.timezones:
            if z.iana == iana:
                return z.label
        return iana

    def _parts(self, value: DateInput, tz: str | None) -> _Parts:
        iana = tz or self.pack.default_timezone.iana
        if isinstance(value, datetime):
            if value.tzinfo is None:
                raise ValueError("datetime must be timezone-aware")
            local = value.astimezone(ZoneInfo(iana))
            return _Parts(local.year, local.month, local.day, local.hour, local.minute,
                          local.second, True)  # fmt: skip
        if isinstance(value, date):
            return _Parts(value.year, value.month, value.day, 0, 0, 0, False)
        s = value.strip()
        if m := _DATE_ONLY.match(s):
            return _Parts(int(m[1]), int(m[2]), int(m[3]), 0, 0, 0, False)
        if m := _NAIVE.match(s):
            return _Parts(int(m[1]), int(m[2]), int(m[3]), int(m[4]), int(m[5]),
                          int(m[6] or 0), True)  # fmt: skip
        if _HAS_ZONE.search(s):
            instant = datetime.fromisoformat(s.replace("Z", "+00:00").replace("z", "+00:00"))
            return self._parts(instant.astimezone(UTC), tz)
        raise ValueError(f"not an ISO date or time: {value!r}")

    def _pattern(self, pattern: str, p: _Parts, label: str) -> str:
        def sub(m: re.Match[str]) -> str:
            tok = m.group(0)
            return {
                "YYYY": str(p.y),
                "MMM": MONTHS[p.mo - 1],
                "MM": f"{p.mo:02d}",
                "DD": f"{p.d:02d}",
                "D": str(p.d),
                "HH": f"{p.h:02d}",
                "mm": f"{p.mi:02d}",
                "ss": f"{p.s:02d}",
                "z": label,
            }[tok]

        return re.sub(r"YYYY|MMM|MM|DD|D|HH|mm|ss|z", sub, pattern)

    def date(self, value: DateInput, tz: str | None = None) -> str:
        return self._pattern(self.pack.format.date, self._parts(value, tz), "")

    def datetime(self, value: DateInput, tz: str | None = None) -> str:
        p = self._parts(value, tz)
        if not p.has_time:
            return self._pattern(self.pack.format.date, p, "")
        return self._pattern(self.pack.format.datetime, p, self._zone_label(tz))

    def audit_time(self, value: str | DT, tz: str | None = None) -> str:
        p = self._parts(value, tz)
        return f"{p.y}-{p.mo:02d}-{p.d:02d} {p.h:02d}:{p.mi:02d}:{p.s:02d} {self._zone_label(tz)}"

    def range(self, start: DateInput, end: DateInput, tz: str | None = None) -> str:
        a, b = self._parts(start, tz), self._parts(end, tz)
        if (a.y, a.mo, a.d) == (b.y, b.mo, b.d):
            return self.date(start, tz)
        if a.y == b.y and a.mo == b.mo:
            return f"{a.d}{EN_DASH}{b.d} {MONTHS[b.mo - 1]} {b.y}"
        if a.y == b.y:
            return f"{a.d} {MONTHS[a.mo - 1]} {EN_DASH} {b.d} {MONTHS[b.mo - 1]} {b.y}"
        return f"{self.date(start, tz)} {EN_DASH} {self.date(end, tz)}"

    def relative(self, instant: DT, now: DT) -> str | None:
        """``2 h ago`` only under 24 hours, else None (show the date)."""
        ms = (now - instant).total_seconds() * 1000
        if ms < 0 or ms >= 24 * 3_600_000:
            return None
        if ms < 60_000:
            return "just now"
        if ms < 3_600_000:
            return f"{int(ms // 60_000)} min ago"
        return f"{int(ms // 3_600_000)} h ago"

    # coordinates and phone -----------------------------------------------------------------

    @staticmethod
    def coordinates(lat: NumberInput, lon: NumberInput) -> str:
        def one(v: NumberInput) -> str:
            r = _round(_dec(v), 4)
            return _signed(r, format(abs(r), "f"))

        return f"{one(lat)}, {one(lon)}"

    def phone(self, value: str) -> str:
        example = self.pack.format.phone_example
        m = re.match(r"^(\+\d+)\s+(.+)$", example) if example else None
        if not m:
            return value.strip()
        dial, rest = m[1], m[2]
        groups = [len(g) for g in re.split(r"[-\s]", rest)]
        sep = "-" if "-" in rest else " "
        digits = re.sub(r"\D", "", value)
        dial_digits = dial[1:]
        if digits.startswith(dial_digits):
            digits = digits[len(dial_digits) :]
        elif digits.startswith("0"):
            digits = digits[1:]
        if len(digits) < sum(groups):
            return value.strip()
        out: list[str] = []
        at = 0
        for i, length in enumerate(groups):
            out.append(digits[at:] if i == len(groups) - 1 else digits[at : at + length])
            at += length
        return f"{dial} {sep.join(out)}"
