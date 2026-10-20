"""Tool declarations (names and tiers from specs/00-shared/tools-and-tiers.md)."""

from aigri.gateway.registry import Tool

TOOLS: tuple[Tool, ...] = (
    Tool("purchase.draft", 1, agent_allowed=True, roles=("client_owner",)),
    Tool("purchase.confirm", 2, roles=("client_owner",)),
    Tool("consent.share_with_insurer", 2, roles=("client_owner",)),
    Tool("underwriting.decide", 3, roles=("underwriter_adjuster",)),
)
