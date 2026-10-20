"""Tool declarations (names and tiers from specs/00-shared/tools-and-tiers.md)."""

from aigri.gateway.registry import Tool

TOOLS: tuple[Tool, ...] = (
    Tool("curation.run", 0, agent_allowed=True, roles=("client_owner",), code_allowed=True),
)
