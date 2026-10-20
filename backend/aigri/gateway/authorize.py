"""authorize(). Phase A holds only the role and caller-kind checks that gate() needs to be
meaningful. T-02.04 adds tenant, tag and tier checks and the ``gateway.denied`` audit entry;
T-02.05 and T-02.06 add the consent and trigger gates. Keep the signature.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from aigri.gateway.actor import Actor
from aigri.gateway.errors import GatewayDenied
from aigri.gateway.registry import Tool, get_registry


@dataclass(frozen=True, slots=True)
class Authorized:
    tool: Tool
    actor: Actor


def authorize(tool_name: str, actor: Actor, args: dict[str, Any] | None = None) -> Authorized:
    tool = get_registry().get(tool_name)
    if tool is None:
        raise GatewayDenied("unknown_tool", tool_name)
    if actor.kind == "agent" and not tool.agent_allowed:
        raise GatewayDenied("not_registered_for_agent", tool_name)
    if actor.kind == "person" and actor.role not in tool.roles:
        raise GatewayDenied("role", tool_name)
    if actor.kind == "code" and not tool.code_allowed:
        raise GatewayDenied("not_registered_for_code", tool_name)
    return Authorized(tool, actor)
