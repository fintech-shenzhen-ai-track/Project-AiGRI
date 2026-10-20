"""Registry vs specs/00-shared/tools-and-tiers.md parity (FR-02.1, T-02.01)."""

import re
from pathlib import Path

import pytest

from aigri.gateway.registry import (
    INSURER_ROLES,
    SIGNED_IN_ROLES,
    TOKEN_HOLDER,
    Registry,
    RegistryError,
    Tool,
    get_registry,
    load_all,
)

SPEC = Path(__file__).resolve().parents[3] / "specs" / "00-shared" / "tools-and-tiers.md"
ROW = re.compile(r"^\| `([\w.]+)` \| (\d) \| (.*?) \| (.*?) \| (.*?) \| (.*?) \|$")


def _roles(cell: str) -> set[str]:
    cell = cell.strip()
    if cell == "—":
        return set()
    if cell == "token holder":
        return {TOKEN_HOLDER}
    if cell.startswith("any signed-in"):
        return set(SIGNED_IN_ROLES)
    out: set[str] = set()
    for part in cell.split(","):
        part = re.sub(r"\s*\(.*\)", "", part).strip()
        if part.startswith("any insurer role"):
            out |= set(INSURER_ROLES)
        else:
            out.add(part)
    return out


def _spec_rows() -> dict[str, tuple[int, bool, bool, set[str], bool]]:
    rows = {}
    for line in SPEC.read_text().splitlines():
        m = ROW.match(line)
        if not m:
            continue
        name, tier, agent, roles, code, _notes = m.groups()
        rows[name] = (
            int(tier),
            agent.startswith("yes"),
            "quarantined" in agent,
            _roles(roles),
            code.startswith("yes"),
        )
    return rows


def test_spec_table_parsed() -> None:
    loose = [ln for ln in SPEC.read_text().splitlines() if re.match(r"^\| `[\w.]+` \| \d \|", ln)]
    assert len(_spec_rows()) == len(loose) > 0


def test_registry_matches_spec_exactly() -> None:
    spec = _spec_rows()
    reg = {t.name: t for t in load_all().all()}
    assert set(reg) == set(spec), set(reg) ^ set(spec)
    for name, (tier, agent, quarantined, roles, code) in spec.items():
        t = reg[name]
        assert (t.tier, t.agent_allowed, t.quarantined, set(t.roles), t.code_allowed) == (
            tier,
            agent,
            quarantined,
            roles,
            code,
        ), name


def test_tier_2_and_3_never_agent_tools() -> None:
    assert all(t.tier <= 1 for t in get_registry().agent_tools())
    for t in get_registry().all():
        if t.tier >= 2:
            assert not t.agent_allowed


def test_agent_tool_list_excludes_unregistered() -> None:
    names = {t.name for t in get_registry().agent_tools()}
    assert "claim.decide" not in names
    assert "claim.submit" not in names
    assert "claim.draft_appeal" in names


def test_tier3_agent_tool_is_rejected_at_construction() -> None:
    with pytest.raises(RegistryError):
        Tool("x.y", 3, agent_allowed=True)


def test_duplicate_registration_rejected() -> None:
    with pytest.raises(RegistryError):
        Registry([Tool("a.b", 0), Tool("a.b", 1)])
