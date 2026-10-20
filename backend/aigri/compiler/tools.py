"""Tool declarations (names and tiers from specs/00-shared/tools-and-tiers.md)."""

from aigri.gateway.registry import INSURER_ROLES, Tool

TOOLS: tuple[Tool, ...] = (
    Tool("policy.answer_question", 0, agent_allowed=True, roles=("client_owner", *INSURER_ROLES)),
    Tool("policy.compile", 0, agent_allowed=True, quarantined=True, code_allowed=True),
    Tool("policy_record.upload", 3, roles=("product_manager",)),
    Tool("policy_record.review_field", 3, roles=("product_manager",)),
    Tool("policy_record.set_limits", 3, roles=("product_manager",)),
    Tool("policy_record.publish", 3, roles=("product_manager",)),
)
