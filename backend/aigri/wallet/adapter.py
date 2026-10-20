"""PartnerWalletAdapter: the only way the backend talks to a partner wallet (FR-12.1, C08).

The protocol is partner-shaped: create wallet, top up, transfer, refund, balance, statement.
``SandboxAdapter`` calls ``mock_services/wallet``; a licensed partner would implement the same
protocol. Amounts are integer minor units. Every write carries an idempotency key and a replay
returns the first result with ``replayed=True``.
"""

from __future__ import annotations

from typing import Any, Protocol, runtime_checkable

import httpx
from pydantic import BaseModel, ConfigDict, Field


class PartnerWalletError(Exception):
    """The partner refused or failed. ``code`` is the partner's machine-readable reason."""

    def __init__(self, status: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status, self.code, self.message = status, code, message


class InsufficientFunds(PartnerWalletError):
    pass


class _Model(BaseModel):
    model_config = ConfigDict(frozen=True, extra="ignore")


class PartnerWallet(_Model):
    wallet_id: str
    currency: str
    replayed: bool = False


class PartnerBalance(_Model):
    wallet_id: str
    currency: str
    balance_minor: int


class PartnerMovement(_Model):
    """Result of a top-up, VA payment, transfer or refund."""

    id: str
    kind: str
    amount_minor: int
    currency: str
    replayed: bool = False
    wallet_id: str | None = None
    from_wallet_id: str | None = None
    to_wallet_id: str | None = None
    refund_of: str | None = None


class PartnerStatementLine(_Model):
    movement_id: str
    kind: str
    amount_minor: int
    balance_after_minor: int


class PartnerStatement(_Model):
    wallet_id: str
    currency: str
    lines: list[PartnerStatementLine] = Field(default_factory=list)


@runtime_checkable
class PartnerWalletAdapter(Protocol):
    async def create_wallet(
        self, *, owner_ref: str, currency: str, wallet_id: str | None = None
    ) -> PartnerWallet: ...

    async def top_up(
        self, *, wallet_id: str, amount_minor: int, currency: str, idempotency_key: str
    ) -> PartnerMovement: ...

    async def transfer(
        self,
        *,
        from_wallet_id: str,
        to_wallet_id: str,
        amount_minor: int,
        currency: str,
        idempotency_key: str,
        trigger: dict[str, Any] | None = None,
    ) -> PartnerMovement: ...

    async def refund(self, *, transfer_id: str, idempotency_key: str) -> PartnerMovement: ...

    async def balance(self, *, wallet_id: str) -> PartnerBalance: ...

    async def statement(self, *, wallet_id: str) -> PartnerStatement: ...


class SandboxAdapter:
    """Talks to ``mock_services/wallet`` over HTTP. Sandbox only (SANDBOX=true)."""

    def __init__(self, base_url: str, *, client: httpx.AsyncClient | None = None) -> None:
        self._base = base_url.rstrip("/")
        self._client = client

    async def _call(self, method: str, path: str, body: dict[str, Any] | None = None) -> Any:
        url = f"{self._base}{path}"
        if self._client is not None:
            resp = await self._client.request(method, url, json=body)
        else:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.request(method, url, json=body)
        data = resp.json()
        if resp.status_code >= 400:
            err = data.get("error", {})
            code = str(err.get("code", "partner_error"))
            cls = InsufficientFunds if code == "insufficient_funds" else PartnerWalletError
            raise cls(resp.status_code, code, str(err.get("message", "Partner wallet error.")))
        return data

    async def create_wallet(
        self, *, owner_ref: str, currency: str, wallet_id: str | None = None
    ) -> PartnerWallet:
        body = {"owner_ref": owner_ref, "currency": currency, "wallet_id": wallet_id}
        return PartnerWallet.model_validate(await self._call("POST", "/wallets", body))

    async def top_up(
        self, *, wallet_id: str, amount_minor: int, currency: str, idempotency_key: str
    ) -> PartnerMovement:
        body = {
            "amount_minor": amount_minor,
            "currency": currency,
            "idempotency_key": idempotency_key,
        }
        data = await self._call("POST", f"/wallets/{wallet_id}/top-ups", body)
        return PartnerMovement.model_validate(data)

    async def simulate_va_payment(
        self, *, wallet_id: str, amount_minor: int, currency: str, idempotency_key: str
    ) -> PartnerMovement:
        """Sandbox helper: a Virtual Account payment arriving (not part of the protocol)."""
        body = {
            "amount_minor": amount_minor,
            "currency": currency,
            "idempotency_key": idempotency_key,
        }
        data = await self._call("POST", f"/wallets/{wallet_id}/virtual-account-payments", body)
        return PartnerMovement.model_validate(data)

    async def transfer(
        self,
        *,
        from_wallet_id: str,
        to_wallet_id: str,
        amount_minor: int,
        currency: str,
        idempotency_key: str,
        trigger: dict[str, Any] | None = None,
    ) -> PartnerMovement:
        body = {
            "from_wallet_id": from_wallet_id,
            "to_wallet_id": to_wallet_id,
            "amount_minor": amount_minor,
            "currency": currency,
            "idempotency_key": idempotency_key,
            "trigger": trigger,
        }
        return PartnerMovement.model_validate(await self._call("POST", "/transfers", body))

    async def refund(self, *, transfer_id: str, idempotency_key: str) -> PartnerMovement:
        body = {"transfer_id": transfer_id, "idempotency_key": idempotency_key}
        return PartnerMovement.model_validate(await self._call("POST", "/refunds", body))

    async def balance(self, *, wallet_id: str) -> PartnerBalance:
        return PartnerBalance.model_validate(
            await self._call("GET", f"/wallets/{wallet_id}/balance")
        )

    async def statement(self, *, wallet_id: str) -> PartnerStatement:
        return PartnerStatement.model_validate(
            await self._call("GET", f"/wallets/{wallet_id}/statement")
        )
