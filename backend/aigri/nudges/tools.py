"""Tool declarations (names and tiers from specs/00-shared/tools-and-tiers.md)."""

from aigri.gateway.registry import Tool

TOOLS: tuple[Tool, ...] = (
    Tool("nudge.draft", 1, agent_allowed=True, roles=("superadmin",)),
    Tool("nudge.mark_seen", 3, roles=("product_manager", "underwriter_adjuster", "finance")),
    Tool("nudge.send", 3, roles=("superadmin",), code_allowed=True),
    Tool("nudge.set_rule", 3, roles=("superadmin",)),
    Tool("dispute.open", 3, roles=("client_owner",)),
    Tool("dispute.resolve", 3, roles=("superadmin",)),
)
