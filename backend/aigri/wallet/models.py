"""Wire models for the wallet endpoints and tools (api-conventions.md: money is
``{"amount_minor", "currency"}``, lists are ``{"items", "next_cursor"}``)."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class Money(BaseModel):
    amount_minor: int
    currency: str = Field(min_length=3, max_length=3, pattern="^[A-Z]{3}$")


class PositiveMoney(BaseModel):
    amount_minor: int = Field(gt=0)
    currency: str = Field(min_length=3, max_length=3, pattern="^[A-Z]{3}$")


class PayoutAccountOut(BaseModel):
    id: str
    kind: Literal["bank", "ewallet"]
    provider: str
    masked_number: str
    account_name: str
    rail: str
    verified: bool
    is_default: bool
    changed_at: datetime | None = None
    hold_until: datetime | None = None  # D-19: payouts land in the wallet until this time


class SeasonSummary(BaseModel):
    premiums_paid: Money
    payouts_received: Money
    withdrawn: Money


class TxnOut(BaseModel):
    id: str
    kind: Literal[
        "top_up", "premium", "escrow_release", "refund", "payout", "withdrawal", "funding"
    ]
    direction: Literal["in", "out"]
    title: str
    amount: Money
    balance_after: Money
    status: Literal["posted", "failed", "pending_funds"]
    created_at: datetime
    ref_type: Literal["policy", "claim", "purchase"] | None = None
    ref_id: str | None = None


class TxnPage(BaseModel):
    items: list[TxnOut]
    next_cursor: str | None = None


class ClientWalletOut(BaseModel):
    wallet_id: str
    balance: Money
    sandbox: bool = True
    country_label: str  # "Indonesia · IDR", from the pack
    season: SeasonSummary
    accounts: list[PayoutAccountOut]
    payout_arrived: TxnOut | None = None  # only when a payout arrived since the last visit
    previous_balance: Money | None = None  # start of the count-up


class TopUpIn(PositiveMoney):
    pass


class WithdrawalIn(PositiveMoney):
    payout_account_id: str


class WithdrawalOut(BaseModel):
    txn_id: str
    amount: Money
    fee: Money
    rail: str
    status: Literal["posted", "failed"]
    replayed: bool = False


class PayoutAccountChangeIn(BaseModel):
    kind: Literal["bank", "ewallet"]
    provider: str
    account_number: str = Field(min_length=4)
    account_name: str
    rail: str
    otp_code: str = Field(min_length=4, max_length=8)
    make_default: bool = False


class PayoutAccountChangeOut(BaseModel):
    account: PayoutAccountOut
    hold_until: datetime


class IntegrityCheck(BaseModel):
    code: Literal[
        "payouts_without_approval",
        "double_payouts",
        "ledger_audit_mismatch",
        "account_change_before_payout",
    ]
    label: str
    count: int
    ok: bool
    checked_at: datetime


class InsurerWalletOut(BaseModel):
    wallet_id: str
    balance: Money
    sandbox: bool = True
    low_balance_alert: Money | None = None
    integrity: list[IntegrityCheck]
    payouts_this_month: Money
    pending_funds: Money
    money_in_this_month: Money


class InsurerPayoutOut(BaseModel):
    txn_id: str
    payout_no: str  # PAY-26-00318
    claim_id: str
    claim_no: str
    client_name: str
    amount: Money
    status: Literal["posted", "failed", "pending_funds"]
    trigger_event_seq: int | None  # the claim.approved Audit Log entry
    trigger_label: str  # "Approval by <adjuster>, <time>"
    created_at: datetime


class InsurerPayoutPage(BaseModel):
    items: list[InsurerPayoutOut]
    next_cursor: str | None = None


class MoneyInOut(BaseModel):
    txn_id: str
    kind: Literal["funding", "escrow_release"]
    title: str
    amount: Money
    created_at: datetime


class MoneyInPage(BaseModel):
    items: list[MoneyInOut]
    next_cursor: str | None = None


class FundingIn(PositiveMoney):
    pass


class FundingOut(BaseModel):
    txn_id: str
    balance: Money
    replayed: bool = False


class AlertLevelIn(BaseModel):
    low_balance_alert_minor: int = Field(ge=0)
    currency: str = Field(min_length=3, max_length=3, pattern="^[A-Z]{3}$")


class ReconciliationLine(BaseModel):
    when: datetime
    kind: Literal["premium", "payout", "refund"]
    amount: Money
    running_balance: Money
    ref_type: Literal["policy", "claim"]
    ref_id: str


class ReconciliationOut(BaseModel):
    product: str | None
    premiums_in: Money
    payouts_out: Money
    refunds: Money
    running_balance: Money
    lines: list[ReconciliationLine]


# ---- Code-only tools (Tier 3, triggered by a recorded event; never an agent call) -------------


class PostingIn(BaseModel):
    """Common shape of the code tools: amount plus the Audit Log seq of the triggering event."""

    model_config = ConfigDict(extra="forbid")

    amount_minor: int = Field(gt=0)
    currency: str = Field(min_length=3, max_length=3, pattern="^[A-Z]{3}$")
    trigger_event_seq: int = Field(gt=0)


class PostPremiumIn(PostingIn):
    purchase_id: str  # trigger: purchase.confirmed


class ReleaseEscrowIn(PostingIn):
    purchase_id: str  # trigger: policy.issued
    policy_id: str


class PostRefundIn(PostingIn):
    purchase_id: str  # trigger: purchase.declined


class PostPayoutIn(PostingIn):
    claim_id: str  # trigger: claim.approved; amount = the decision's final amount


class PostingOut(BaseModel):
    txn_id: str
    status: Literal["posted", "pending_funds"]
    replayed: bool = False
