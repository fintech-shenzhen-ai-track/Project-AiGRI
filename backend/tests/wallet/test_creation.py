"""T-12.03: wallet creation interface used by onboarding (idempotent, audited, mirrored)."""

import importlib.util
import threading
import uuid
from collections.abc import AsyncIterator
from pathlib import Path

import asyncpg
import pytest
from sqlalchemy import text
from sqlalchemy.exc import DBAPIError
from sqlalchemy.ext.asyncio import AsyncConnection, AsyncEngine, create_async_engine

from aigri.wallet.adapter import SandboxAdapter
from aigri.wallet.creation import WalletCreation, WalletService
from aigri.wallet.fakes import RecordingAudit
from tests.conftest import TestDb

pytestmark = pytest.mark.db

APP = Path(__file__).resolve().parents[3] / "mock_services" / "wallet" / "app.py"


async def _session(test_db: TestDb, **settings: str) -> tuple[AsyncEngine, AsyncConnection]:
    """A connection as the app role with the given tenant settings (no elevated role)."""
    engine = create_async_engine(test_db.app_url.replace("postgresql://", "postgresql+asyncpg://"))
    c = await engine.connect()
    for key, value in settings.items():
        await c.execute(text("select set_config(:k, :v, false)"), {"k": f"app.{key}", "v": value})
    return engine, c


@pytest.fixture
def adapter() -> AsyncIterator[SandboxAdapter]:  # type: ignore[misc]
    spec = importlib.util.spec_from_file_location("mock_wallet_app2", APP)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    mod.Handler.store = mod.Store()
    server = mod.make_server(0, "127.0.0.1")
    threading.Thread(target=server.serve_forever, daemon=True).start()
    yield SandboxAdapter(f"http://127.0.0.1:{server.server_address[1]}")  # type: ignore[misc]
    server.shutdown()
    server.server_close()


async def test_create_wallets_is_idempotent_and_audited(
    test_db: TestDb, adapter: SandboxAdapter
) -> None:
    owner = await asyncpg.connect(test_db.owner_url)
    try:
        cid = await owner.fetchval(
            "insert into clients (country, kind, name) values ('ID','agri_business','c')"
            " returning id"
        )
        iid = await owner.fetchval(
            "insert into insurers (country, code, legal_name, display_name)"
            " values ('ID', $1, 'x', 'x') returning id",
            "I" + uuid.uuid4().hex[:8],
        )
    finally:
        await owner.close()
    audit = RecordingAudit()
    engine, conn = await _session(test_db, role="client_owner", client_id=str(cid))
    try:
        svc: WalletCreation = WalletService(conn, adapter, audit)
        first = await svc.create_client_wallet(client_id=cid, currency="IDR")
        again = await svc.create_client_wallet(client_id=cid, currency="IDR")
        assert first.created and not again.created and first.wallet_id == again.wallet_id
        with pytest.raises(DBAPIError):  # a client session cannot create another tenant's wallet
            await WalletService(conn, adapter, audit).create_client_wallet(
                client_id=uuid.uuid4(), currency="IDR"
            )
        await conn.rollback()
    finally:
        await conn.close()
        await engine.dispose()
    engine, conn = await _session(test_db, role="finance", insurer_id=str(iid))
    try:
        ins = await WalletService(conn, adapter, audit).create_insurer_wallet(
            insurer_id=iid, currency="IDR"
        )
        assert ins.owner_type == "insurer" and ins.wallet_id != first.wallet_id
        await conn.rollback()
    finally:
        await conn.close()
        await engine.dispose()
    assert [e["action"] for e in audit.events] == ["wallet.created", "wallet.created"]
    mirror = await adapter.balance(wallet_id=str(first.wallet_id))
    assert mirror.balance_minor == 0 and mirror.currency == "IDR"
