"""Tool declarations (names and tiers from specs/00-shared/tools-and-tiers.md)."""

from aigri.gateway.registry import Tool

TOOLS: tuple[Tool, ...] = (
    Tool("wallet.top_up", 3, roles=("client_owner",)),
    Tool("wallet.fund", 3, roles=("finance",)),
    Tool("wallet.withdraw", 3, roles=("client_owner",)),
    Tool("payout_account.change", 3, roles=("client_owner", "finance")),
    Tool("wallet.post_premium", 3, code_allowed=True),
    Tool("wallet.release_escrow", 3, code_allowed=True),
    Tool("wallet.post_refund", 3, code_allowed=True),
    Tool("wallet.post_payout", 3, code_allowed=True),
)
