"""Insurer wallet routes (feature 12, T-12.03). Stubs: final shapes, empty data, writes 501."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from aigri.api.errors import ApiError
from aigri.core import clock, packs
from aigri.gateway.authorize import Authorized
from aigri.gateway.deps import gate
from aigri.wallet.models import (
    AlertLevelIn,
    FundingIn,
    FundingOut,
    InsurerPayoutPage,
    InsurerWalletOut,
    IntegrityCheck,
    Money,
    MoneyInPage,
    ReconciliationOut,
)

router = APIRouter(prefix="/insurer/wallet", tags=["wallet"])

_ZERO_WALLET_ID = "00000000-0000-0000-0000-000000000000"

_CHECKS: tuple[tuple[str, str], ...] = (
    ("payouts_without_approval", "Payouts without an approval event"),
    ("double_payouts", "Double payouts"),
    ("ledger_audit_mismatch", "Ledger and Audit Log mismatches"),
    ("account_change_before_payout", "Payout-account changes in the 24 h before a payout"),
)


def _not_built() -> ApiError:
    return ApiError(501, "not_implemented", "This is not available yet. Nothing was changed.")


@router.get("", response_model=InsurerWalletOut)
async def get_wallet(_: Annotated[Authorized, Depends(gate("insurer.read"))]) -> InsurerWalletOut:
    zero = Money(amount_minor=0, currency=packs.default_pack().currency.code)
    now = clock.now()
    return InsurerWalletOut(
        wallet_id=_ZERO_WALLET_ID,
        balance=zero,
        integrity=[
            IntegrityCheck.model_validate(
                {"code": code, "label": label, "count": 0, "ok": True, "checked_at": now}
            )
            for code, label in _CHECKS
        ],
        payouts_this_month=zero,
        pending_funds=zero,
        money_in_this_month=zero,
    )


@router.get("/payouts", response_model=InsurerPayoutPage)
async def list_payouts(
    _: Annotated[Authorized, Depends(gate("insurer.read"))],
    cursor: str | None = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
) -> InsurerPayoutPage:
    return InsurerPayoutPage(items=[], next_cursor=None)


@router.get("/money-in", response_model=MoneyInPage)
async def list_money_in(
    _: Annotated[Authorized, Depends(gate("insurer.read"))],
    cursor: str | None = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
) -> MoneyInPage:
    return MoneyInPage(items=[], next_cursor=None)


@router.post("/funding", response_model=FundingOut)
async def fund(
    body: FundingIn, _: Annotated[Authorized, Depends(gate("wallet.fund"))]
) -> FundingOut:
    raise _not_built()


@router.put("/alert-level", response_model=InsurerWalletOut)
async def set_alert_level(
    body: AlertLevelIn, _: Annotated[Authorized, Depends(gate("wallet.fund"))]
) -> InsurerWalletOut:
    raise _not_built()


@router.get("/reconciliation", response_model=ReconciliationOut)
async def reconciliation(
    _: Annotated[Authorized, Depends(gate("insurer.read"))], product: str | None = None
) -> ReconciliationOut:
    zero = Money(amount_minor=0, currency=packs.default_pack().currency.code)
    return ReconciliationOut(
        product=product,
        premiums_in=zero,
        payouts_out=zero,
        refunds=zero,
        running_balance=zero,
        lines=[],
    )
