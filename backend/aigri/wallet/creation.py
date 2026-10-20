"""Wallet creation interface used by 06's onboarding (C08, T-12.03).

06 calls ``WalletCreation.create_client_wallet`` when a Client finishes onboarding and
``create_insurer_wallet`` when an Insurer is created. Both are idempotent: asking twice for the
same owner and currency returns the same wallet and writes one ``wallet.created`` entry.

``WalletService`` is the real implementation. It runs in the caller's own tenant session: the
tenant policy lets a session create its own wallet, so no elevated role is involved. It also needs
the partner adapter and an audit writer. ``AuditPort`` stands in for ``core.audit`` until 01 phase
B part 2 lands; wire the real writer in then.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Any, Protocol

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from aigri.wallet.adapter import PartnerWalletAdapter


@dataclass(frozen=True, slots=True)
class WalletRef:
    wallet_id: uuid.UUID
    owner_type: str
    owner_id: uuid.UUID | None
    currency: str
    created: bool  # False when it already existed


class AuditPort(Protocol):
    """The slice of ``core.audit`` the wallet needs (actor_type ``system`` for creation)."""

    async def write(
        self,
        *,
        action: str,
        object_type: str,
        object_id: str,
        payload: dict[str, Any],
        client_id: uuid.UUID | None = None,
        insurer_id: uuid.UUID | None = None,
    ) -> None: ...


class WalletCreation(Protocol):
    async def create_client_wallet(self, *, client_id: uuid.UUID, currency: str) -> WalletRef: ...

    async def create_insurer_wallet(self, *, insurer_id: uuid.UUID, currency: str) -> WalletRef: ...


class WalletService:
    def __init__(
        self, conn: AsyncConnection, adapter: PartnerWalletAdapter, audit: AuditPort
    ) -> None:
        self._conn, self._adapter, self._audit = conn, adapter, audit

    async def create_client_wallet(self, *, client_id: uuid.UUID, currency: str) -> WalletRef:
        return await self._ensure("client", client_id, currency, client_id=client_id)

    async def create_insurer_wallet(self, *, insurer_id: uuid.UUID, currency: str) -> WalletRef:
        return await self._ensure("insurer", insurer_id, currency, insurer_id=insurer_id)

    async def _ensure(
        self,
        owner_type: str,
        owner_id: uuid.UUID,
        currency: str,
        *,
        client_id: uuid.UUID | None = None,
        insurer_id: uuid.UUID | None = None,
    ) -> WalletRef:
        row = (
            await self._conn.execute(
                text(
                    "INSERT INTO wallets (owner_type, owner_id, client_id, insurer_id, currency)"
                    " VALUES (:t, :o, :c, :i, :cur) ON CONFLICT DO NOTHING RETURNING id"
                ),
                {"t": owner_type, "o": owner_id, "c": client_id, "i": insurer_id, "cur": currency},
            )
        ).first()
        if row is None:
            existing = (
                await self._conn.execute(
                    text(
                        "SELECT id FROM wallets WHERE owner_type = :t AND owner_id = :o"
                        " AND currency = :cur"
                    ),
                    {"t": owner_type, "o": owner_id, "cur": currency},
                )
            ).one()
            return WalletRef(existing[0], owner_type, owner_id, currency, created=False)
        wallet_id: uuid.UUID = row[0]
        await self._adapter.create_wallet(
            owner_ref=f"{owner_type}:{owner_id}", currency=currency, wallet_id=str(wallet_id)
        )
        await self._audit.write(
            action="wallet.created",
            object_type="wallet",
            object_id=str(wallet_id),
            payload={"owner_type": owner_type, "owner_id": str(owner_id), "currency": currency},
            client_id=client_id,
            insurer_id=insurer_id,
        )
        return WalletRef(wallet_id, owner_type, owner_id, currency, created=True)
