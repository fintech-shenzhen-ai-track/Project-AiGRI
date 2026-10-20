"""Tool declarations (names and tiers from specs/00-shared/tools-and-tiers.md)."""

from aigri.gateway.registry import SIGNED_IN_ROLES, Tool

TOOLS: tuple[Tool, ...] = (
    Tool("client.read", 0, roles=("client_owner",)),
    Tool("insurer.read", 0, roles=("product_manager", "underwriter_adjuster", "finance")),
    Tool("admin.read", 0, roles=("superadmin",)),
    Tool("notifications.subscribe", 3, roles=SIGNED_IN_ROLES),
)
