"""core.clock: real and demo modes; no datetime.now() outside core/clock.py (FR-01.9)."""

import ast
from collections.abc import Iterator
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from aigri.core import clock

BACKEND = Path(__file__).resolve().parents[2]
REPO = BACKEND.parent


@pytest.fixture(autouse=True)
def _reset_clock() -> Iterator[None]:
    clock.set_real()
    yield
    clock.set_real()


def test_real_mode_is_utc_and_close_to_wall_clock() -> None:
    t = clock.now()
    assert t.tzinfo is not None
    assert t.utcoffset() == timedelta(0)
    assert clock.mode() == "real"
    assert abs(t - datetime.now(UTC)) < timedelta(seconds=2)  # noqa: DTZ005 (test of the clock)


def test_demo_mode_returns_story_time() -> None:
    story = datetime(2026, 2, 16, 8, 20, 11, tzinfo=UTC)
    clock.set_story_now(story)
    assert clock.mode() == "demo"
    assert clock.now() == story
    assert clock.now() == story  # frozen: the story clock does not tick


def test_story_time_is_normalised_to_utc() -> None:
    from datetime import timezone

    wib = timezone(timedelta(hours=7))
    clock.set_story_now(datetime(2026, 2, 16, 15, 20, tzinfo=wib))
    assert clock.now() == datetime(2026, 2, 16, 8, 20, tzinfo=UTC)
    assert clock.now().utcoffset() == timedelta(0)


def test_naive_story_time_is_rejected() -> None:
    with pytest.raises(ValueError):
        clock.set_story_now(datetime(2026, 2, 16, 8, 20))  # noqa: DTZ001


def test_demo_mode_without_story_time_is_rejected() -> None:
    with pytest.raises(ValueError):
        clock.configure("demo", None)


def test_set_real_returns_to_wall_clock() -> None:
    clock.set_story_now(datetime(2020, 1, 1, tzinfo=UTC))
    clock.set_real()
    assert clock.mode() == "real"
    assert clock.now().year >= 2026


def test_configure_round_trip() -> None:
    story = datetime(2026, 2, 24, 14, 32, tzinfo=UTC)
    clock.configure("demo", story)
    assert clock.state() == ("demo", story)
    clock.configure("real", story)  # story time is kept in the table but ignored in real mode
    assert clock.mode() == "real"
    assert clock.now() != story


def _banned_calls(path: Path) -> list[str]:
    tree = ast.parse(path.read_text(), filename=str(path))
    bad: list[str] = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute):
            f = node.func
            base = f.value
            name = base.id if isinstance(base, ast.Name) else getattr(base, "attr", "")
            if (name, f.attr) in {
                ("datetime", "now"),
                ("datetime", "utcnow"),
                ("datetime", "today"),
                ("date", "today"),
            }:
                bad.append(f"{path}:{node.lineno} {name}.{f.attr}()")
    return bad


def test_banned_call_detector_finds_violations(tmp_path: Path) -> None:
    f = tmp_path / "x.py"
    f.write_text("import datetime\nx = datetime.datetime.now()\n")
    assert _banned_calls(f)  # module form
    f.write_text("from datetime import datetime\ny = datetime.now()\n")
    assert _banned_calls(f)


def test_no_datetime_now_outside_core_clock() -> None:
    roots = [BACKEND / "aigri", BACKEND / "scripts", REPO / "bench", REPO / "mock_services"]
    roots += [REPO / "seed"]
    allowed = BACKEND / "aigri" / "core" / "clock.py"
    violations: list[str] = []
    for root in roots:
        if not root.exists():
            continue
        for path in root.rglob("*.py"):
            if path == allowed or ".venv" in path.parts:
                continue
            violations += _banned_calls(path)
    assert not violations, "use core.clock.now():\n" + "\n".join(violations)
