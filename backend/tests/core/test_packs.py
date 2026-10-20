"""core.packs: loading, validation, serving and formatters."""

import json
from datetime import UTC, date, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any

import pytest
import yaml

from aigri.core import packs
from aigri.core.money import Money

REPO = Path(__file__).resolve().parents[3]


def test_all_packs_load() -> None:
    assert {p.code for p in packs.all_packs()} == {"ID", "PH", "TH", "VN"}
    assert packs.get_pack("id").status == "live"
    assert [p.code for p in packs.all_packs() if p.status == "planned"] == ["PH", "TH", "VN"]
    assert all(p.insurers == [] for p in packs.all_packs() if p.status == "planned")


def test_packs_routes() -> None:
    from fastapi.testclient import TestClient

    from aigri.api.app import create_app

    c = TestClient(create_app())
    listing = c.get("/api/v1/packs")
    assert listing.status_code == 200
    assert {p["code"] for p in listing.json()} == {"ID", "PH", "TH", "VN"}
    one = c.get("/api/v1/packs/ID").json()
    assert one["currency"]["minor_unit_exponent"] == 0 and one["insurers"][0]["code"] == "JSD"
    missing = c.get("/api/v1/packs/ZZ")
    assert missing.status_code == 404 and missing.json()["error"]["code"] == "not_found"


def test_unknown_pack() -> None:
    with pytest.raises(packs.PackNotFound):
        packs.get_pack("ZZ")


def test_currency_exponents_follow_decisions_d38() -> None:
    assert packs.currency_exponent("IDR") == 0
    assert packs.currency_exponent("PHP") == 2
    assert packs.currency_exponent("THB") == 2
    with pytest.raises(packs.PackNotFound):
        packs.currency_exponent("USD")


def _id_doc() -> dict[str, Any]:
    doc: dict[str, Any] = yaml.safe_load((REPO / "packs" / "ID.yaml").read_text())
    return doc


def test_schema_rejects_unknown_key() -> None:
    doc = _id_doc()
    doc["surprise"] = 1
    with pytest.raises(packs.PackError):
        packs.parse_pack(doc)


def test_schema_rejects_missing_required() -> None:
    doc = _id_doc()
    del doc["currency"]
    with pytest.raises(packs.PackError):
        packs.parse_pack(doc)


def test_typed_model_alone_rejects_invalid(monkeypatch: pytest.MonkeyPatch) -> None:
    # Deployed images may lack the schema file; the typed model must still refuse bad packs.
    monkeypatch.setenv("PACKS_SCHEMA", "")
    monkeypatch.setattr(packs, "_schema", lambda: None)
    doc = _id_doc()
    doc["format"]["thousands"] = ","
    doc["format"]["decimal"] = ","
    with pytest.raises(packs.PackError):
        packs.parse_pack(doc)
    doc = _id_doc()
    doc["timezones"][1]["default"] = True
    with pytest.raises(packs.PackError):
        packs.parse_pack(doc)
    doc = _id_doc()
    doc["regions"].append({"code": "9999", "name": "X", "level": "regency", "parent": "00"})
    with pytest.raises(packs.PackError):
        packs.parse_pack(doc)


def test_planned_pack_with_insurers_is_rejected() -> None:
    doc: dict[str, Any] = yaml.safe_load((REPO / "packs" / "PH.yaml").read_text())
    doc["insurers"] = [{"code": "ABC", "name": "Invented", "initials": "AB"}]
    with pytest.raises(packs.PackError):
        packs.parse_pack(doc)


def test_file_name_must_match_code(tmp_path: Path) -> None:
    (tmp_path / "XX.yaml").write_text((REPO / "packs" / "ID.yaml").read_text())
    with pytest.raises(packs.PackError):
        packs.load_packs(tmp_path)


ID = packs.get_pack("ID").fmt


def test_user_story_examples_us_01_5() -> None:
    assert ID.money(Money(187_800_000, "IDR")) == "Rp187.800.000"
    assert ID.area(48) == "48,0 ha"
    assert ID.pct("3.5", 1) == "3,5%"
    assert ID.datetime(datetime(2026, 2, 24, 7, 32, tzinfo=UTC)) == "24 Feb 2026, 14:32 WIB"
    assert ID.money(Money(-13_440_000, "IDR"), sign=True) == "−Rp13.440.000"


def test_money_signs_and_compact() -> None:
    assert ID.money(187_800_000, sign=True) == "+Rp187.800.000"
    assert ID.money(0, sign=True) == "Rp0"
    assert ID.money(187_800_000, compact=True) == "Rp187,8 jt"
    assert ID.money(1_240_000_000, compact=True) == "Rp1,24 M"
    assert ID.money(1_000_000, compact=True) == "Rp1 jt"
    assert ID.money(950_000, compact=True) == "Rp950.000"


def test_money_wrong_currency_and_floats_rejected() -> None:
    with pytest.raises(ValueError):
        ID.money(Money(100, "PHP"))
    with pytest.raises(TypeError):
        ID.num(1.5)  # type: ignore[arg-type]


def test_half_up_rounding() -> None:
    assert ID.num("0.5") == "1"
    assert ID.num("-0.5") == "−1"
    assert ID.num("2.675", 2) == "2,68"
    assert ID.pct("92") == "92%"


def test_other_pack_formats() -> None:
    th = packs.get_pack("TH").fmt
    assert th.area(1) == "6.3 rai"  # 6.25 rounded half-up to one decimal
    ph = packs.get_pack("PH").fmt
    assert ph.money(Money(123_456, "PHP")) == "₱1,234.56"


def test_range_forms() -> None:
    assert ID.range("2026-02-06", "2026-02-08") == "6–8 Feb 2026"
    assert ID.range("2026-01-01", "2026-04-30") == "1 Jan – 30 Apr 2026"
    assert ID.range("2025-12-28", "2026-01-03") == "28 Dec 2025 – 3 Jan 2026"
    assert ID.range("2026-02-06", "2026-02-06") == "6 Feb 2026"


def test_dates_and_audit_time() -> None:
    assert ID.date(date(2026, 2, 16)) == "16 Feb 2026"
    assert ID.audit_time("2026-02-16T01:20:11Z") == "2026-02-16 08:20:11 WIB"
    assert ID.datetime("2026-02-16T01:20:00Z", "Asia/Makassar") == "16 Feb 2026, 09:20 WITA"
    with pytest.raises(ValueError):
        ID.datetime(datetime(2026, 2, 16, 8, 0))  # noqa: DTZ001


def test_relative() -> None:
    now = datetime(2026, 2, 16, 8, 20, tzinfo=UTC)
    assert ID.relative(datetime(2026, 2, 16, 6, 20, tzinfo=UTC), now) == "2 h ago"
    assert ID.relative(datetime(2026, 2, 15, 6, 20, tzinfo=UTC), now) is None


def test_coordinates_and_phone() -> None:
    assert ID.coordinates("-6.8571", "110.639") == "−6.8571, 110.6390"
    assert ID.phone("081227410938") == "+62 812-2741-0938"
    assert ID.phone("12") == "12"


# ---- shared cases (stand-in now; specs/01-foundation/format-cases.json after T-01.10) -------

_CASE_FILES = [
    REPO / "specs" / "01-foundation" / "format-cases.json",
    REPO / "portals" / "tests" / "fixtures" / "format-cases.standin.json",
]


def _arg(v: Any) -> Any:
    if isinstance(v, float):
        return Decimal(repr(v))
    return v


def _run_case(case: dict[str, Any]) -> str | None:
    fmt = packs.get_pack(case["pack"]).fmt
    args = [_arg(a) for a in case["args"]]
    kind = case["kind"]
    if kind in ("money", "rate"):
        m = args[0]
        money = Money(int(m["amount_minor"]), m["currency"])
        if kind == "rate":
            return fmt.rate(money, args[1])
        opts = args[1] if len(args) > 1 else {}
        return fmt.money(money, sign=opts.get("sign", False), compact=opts.get("compact", False))
    if kind == "moneyMajor":
        opts = args[1] if len(args) > 1 else {}
        return fmt.money_major(
            args[0], sign=opts.get("sign", False), compact=opts.get("compact", False)
        )
    if kind == "relative":
        t, n = (datetime.fromisoformat(a.replace("Z", "+00:00")) for a in args)
        return fmt.relative(t, n)
    if kind == "coordinates":
        return fmt.coordinates(*args)
    method = {"dateTime": "datetime", "auditTime": "audit_time"}.get(kind, kind)
    return getattr(fmt, method)(*args)  # type: ignore[no-any-return]


@pytest.mark.parametrize("path", [p for p in _CASE_FILES if p.exists()][:1] or [None])
def test_shared_format_cases(path: Path | None) -> None:
    if path is None:
        pytest.skip("no shared format cases file")
    cases = json.loads(path.read_text(encoding="utf-8"))["cases"]
    failures = []
    for case in cases:
        got = _run_case(case)
        if got != case["expected"]:
            failures.append(f"{case['id']}: got {got!r}, expected {case['expected']!r}")
    assert not failures, "\n".join(failures)
