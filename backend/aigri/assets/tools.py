"""Tool declarations (names and tiers from specs/00-shared/tools-and-tiers.md)."""

from aigri.gateway.registry import TOKEN_HOLDER, Tool

TOOLS: tuple[Tool, ...] = (
    Tool("capture.read_session", 0, roles=(TOKEN_HOLDER,)),
    Tool("evidence.capture", 3, roles=("client_owner",)),
    Tool("asset.edit", 3, roles=("client_owner",)),
    Tool("asset.draft_edit", 1, agent_allowed=True),
)
