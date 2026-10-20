"""Tool declarations (names and tiers from specs/00-shared/tools-and-tiers.md)."""

from aigri.gateway.registry import Tool
from aigri.wallet.models import (
    FundingIn,
    FundingOut,
    PayoutAccountChangeIn,
    PayoutAccountChangeOut,
    PostingOut,
    PostPayoutIn,
    PostPremiumIn,
    PostRefundIn,
    ReleaseEscrowIn,
    TopUpIn,
    TxnOut,
    WithdrawalIn,
    WithdrawalOut,
)

TOOLS: tuple[Tool, ...] = (
    Tool("wallet.top_up", 3, roles=("client_owner",), input_model=TopUpIn, output_model=TxnOut),
    Tool("wallet.fund", 3, roles=("finance",), input_model=FundingIn, output_model=FundingOut),
    Tool(
        "wallet.withdraw",
        3,
        roles=("client_owner",),
        input_model=WithdrawalIn,
        output_model=WithdrawalOut,
    ),
    Tool(
        "payout_account.change",
        3,
        roles=("client_owner", "finance"),
        input_model=PayoutAccountChangeIn,
        output_model=PayoutAccountChangeOut,
    ),
    Tool(
        "wallet.post_premium",
        3,
        code_allowed=True,
        input_model=PostPremiumIn,
        output_model=PostingOut,
    ),
    Tool(
        "wallet.release_escrow",
        3,
        code_allowed=True,
        input_model=ReleaseEscrowIn,
        output_model=PostingOut,
    ),
    Tool(
        "wallet.post_refund",
        3,
        code_allowed=True,
        input_model=PostRefundIn,
        output_model=PostingOut,
    ),
    Tool(
        "wallet.post_payout",
        3,
        code_allowed=True,
        input_model=PostPayoutIn,
        output_model=PostingOut,
    ),
)
