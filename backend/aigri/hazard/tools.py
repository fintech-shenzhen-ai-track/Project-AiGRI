"""Tool declarations (names and tiers from specs/00-shared/tools-and-tiers.md)."""

from aigri.gateway.registry import Tool

TOOLS: tuple[Tool, ...] = (
    Tool("hazard.ingest", 0, code_allowed=True),
    Tool("alert.send", 0, agent_allowed=True, code_allowed=True),
    Tool("loss.report", 3, roles=("client_owner",)),
)
