"""Client wallet routes (feature 12, T-12.03). Stubs: the shapes are final, the data is empty and
the movements answer 501 until phase B posts them through ``wallet/``."""

from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query, Response

from aigri.api.errors import ApiError
from aigri.core import packs
from aigri.gateway.authorize import Authorized
from aigri.gateway.deps import gate
from aigri.wallet.models import (
    ClientWalletOut,
    Money,
    PayoutAccountChangeIn,
    PayoutAccountChangeOut,
    SeasonSummary,
    TopUpIn,
    TxnOut,
    TxnPage,
    WithdrawalIn,
    WithdrawalOut,
)

router = APIRouter(prefix="/client/wallet", tags=["wallet"])

_ZERO_WALLET_ID = "00000000-0000-0000-0000-000000000000"


def _not_built() -> ApiError:
    return ApiError(501, "not_implemented", "This is not available yet. Nothing was changed.")


@router.get("", response_model=ClientWalletOut)
async def get_wallet(_: Annotated[Authorized, Depends(gate("client.read"))]) -> ClientWalletOut:
    pack = packs.default_pack()
    zero = Money(amount_minor=0, currency=pack.currency.code)
    return ClientWalletOut(
        wallet_id=_ZERO_WALLET_ID,
        balance=zero,
        country_label=f"{pack.name} · {pack.currency.code}",
        season=SeasonSummary(premiums_paid=zero, payouts_received=zero, withdrawn=zero),
        accounts=[],
    )


@router.get("/transactions", response_model=TxnPage)
async def list_transactions(
    _: Annotated[Authorized, Depends(gate("client.read"))],
    filter: Annotated[Literal["all", "in", "out"], Query()] = "all",  # noqa: A002
    cursor: str | None = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
) -> TxnPage:
    return TxnPage(items=[], next_cursor=None)


@router.post("/top-up", response_model=TxnOut)
async def top_up(body: TopUpIn, _: Annotated[Authorized, Depends(gate("wallet.top_up"))]) -> TxnOut:
    raise _not_built()


@router.post("/withdrawals", response_model=WithdrawalOut)
async def withdraw(
    body: WithdrawalIn, _: Annotated[Authorized, Depends(gate("wallet.withdraw"))]
) -> WithdrawalOut:
    raise _not_built()


@router.post("/payout-accounts", response_model=PayoutAccountChangeOut)
async def change_payout_account(
    body: PayoutAccountChangeIn,
    _: Annotated[Authorized, Depends(gate("payout_account.change"))],
) -> PayoutAccountChangeOut:
    raise _not_built()


@router.get("/statement.csv")
async def statement_csv(_: Annotated[Authorized, Depends(gate("client.read"))]) -> Response:
    header = "date,kind,direction,amount_minor,currency,balance_after_minor,reference\n"
    return Response(header, media_type="text/csv")
