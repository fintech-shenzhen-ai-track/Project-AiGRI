"""Tool declarations (names and tiers from specs/00-shared/tools-and-tiers.md)."""

from aigri.gateway.registry import Tool

TOOLS: tuple[Tool, ...] = (Tool("risk.compute", 0, agent_allowed=True, code_allowed=True),)
