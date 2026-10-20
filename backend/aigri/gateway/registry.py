"""Tool registry (FR-02.1). Matches specs/00-shared/tools-and-tiers.md exactly.

Each module declares ``TOOLS: tuple[Tool, ...]`` in ``<module>/tools.py``; ``load_all()`` imports
those files and builds the registry. Nothing registers as an import side effect.
"""

from __future__ import annotations

from dataclasses import dataclass
from importlib import import_module
from typing import Literal

from pydantic import BaseModel

Tier = Literal[0, 1, 2, 3]

CLIENT_ROLES = ("client_owner",)
INSURER_ROLES = ("product_manager", "underwriter_adjuster", "finance")
PLATFORM_ROLES = ("superadmin",)
SIGNED_IN_ROLES = CLIENT_ROLES + INSURER_ROLES + PLATFORM_ROLES
TOKEN_HOLDER = "token_holder"

# Modules whose tools.py is loaded. Tool names must be unique across all of them.
TOOL_MODULES: tuple[str, ...] = (
    "aigri.agent",
    "aigri.assets",
    "aigri.claims",
    "aigri.compiler",
    "aigri.curation",
    "aigri.damage",
    "aigri.gateway",
    "aigri.hazard",
    "aigri.nudges",
    "aigri.purchase",
    "aigri.risk",
    "aigri.rules",
    "aigri.wallet",
)


class RegistryError(Exception):
    pass


@dataclass(frozen=True, slots=True)
class Tool:
    name: str
    tier: Tier
    agent_allowed: bool = False
    quarantined: bool = False  # the agent runs it only through the quarantined reader
    roles: tuple[str, ...] = ()
    code_allowed: bool = False
    input_model: type[BaseModel] | None = None
    output_model: type[BaseModel] | None = None
    policies: tuple[str, ...] = ()  # names from gateway.policies (phase B)
    audit_action: str = ""

    def __post_init__(self) -> None:
        if not self.audit_action:
            object.__setattr__(self, "audit_action", self.name)
        if self.agent_allowed and self.tier >= 2:
            raise RegistryError(f"{self.name}: Tier {self.tier} tools are never agent tools")
        if self.quarantined and not self.agent_allowed:
            raise RegistryError(f"{self.name}: quarantined implies agent_allowed")


class Registry:
    def __init__(self, tools: list[Tool] | tuple[Tool, ...] = ()) -> None:
        self._tools: dict[str, Tool] = {}
        for t in tools:
            self.register(t)

    def register(self, tool: Tool) -> None:
        if tool.name in self._tools:
            raise RegistryError(f"duplicate tool {tool.name}")
        self._tools[tool.name] = tool

    def get(self, name: str) -> Tool | None:
        return self._tools.get(name)

    def require(self, name: str) -> Tool:
        tool = self._tools.get(name)
        if tool is None:
            raise RegistryError(f"unknown tool {name}")
        return tool

    def all(self) -> list[Tool]:
        return sorted(self._tools.values(), key=lambda t: t.name)

    def agent_tools(self) -> list[Tool]:
        """The planner's tool list: Tier 2 and 3 are never in it (FR-02.3)."""
        return [t for t in self.all() if t.agent_allowed]

    def __contains__(self, name: str) -> bool:
        return name in self._tools


def load_all() -> Registry:
    tools: list[Tool] = []
    for mod in TOOL_MODULES:
        tools.extend(import_module(f"{mod}.tools").TOOLS)
    return Registry(tools)


_registry: Registry | None = None


def get_registry() -> Registry:
    global _registry
    if _registry is None:
        _registry = load_all()
    return _registry
