"""Tool declarations (names and tiers from specs/00-shared/tools-and-tiers.md)."""

from aigri.gateway.registry import Tool

TOOLS: tuple[Tool, ...] = (
    Tool("claim.precheck", 0, agent_allowed=True, code_allowed=True),
    Tool("claim.draft_packet", 1, agent_allowed=True, roles=("client_owner",), code_allowed=True),
    Tool("claim.draft_appeal", 1, agent_allowed=True, roles=("client_owner",), code_allowed=True),
    Tool("claim.draft_info_request", 1, agent_allowed=True, roles=("underwriter_adjuster",)),
    Tool("claim.submit", 2, roles=("client_owner",)),
    Tool("claim.start_review", 3, roles=("underwriter_adjuster",)),
    Tool("claim.request_info", 3, roles=("underwriter_adjuster",)),
    Tool("claim.decide", 3, roles=("underwriter_adjuster",)),
)
