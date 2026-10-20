"""Tool declarations (names and tiers from specs/00-shared/tools-and-tiers.md)."""

from aigri.gateway.registry import Tool

TOOLS: tuple[Tool, ...] = (
    Tool(
        "rules.propose_amount",
        0,
        agent_allowed=True,
        roles=("underwriter_adjuster",),
        code_allowed=True,
    ),
)
