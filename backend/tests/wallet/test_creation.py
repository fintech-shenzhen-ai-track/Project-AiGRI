"""T-12.03: wallet creation interface used by onboarding (idempotent, audited, mirrored)."""

import importlib.util
import threading
import uuid
from collections.abc import AsyncIterator
from pathlib import Path

import asyncpg
import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection, create_async_engine

from aigri.wallet.adapter import SandboxAdapter
from aigri.wallet.creation import WalletCreation, WalletService
from aigri.wallet.fakes import RecordingAudit
from tests.conftest import TestDb

pytestmark = pytest.mark.db

APP = Path(__file__).resolve().parents[3] / "mock_services" / "wallet" / "app.py"


@pytest.fixture
async def conn(test_db: TestDb) -> AsyncIterator[AsyncConnection]:
    engine = create_async_engine(
        test_db.owner_url.replace("postgresql://", "postgresql+asyncpg://")
    )
    async with engine.connect() as c:
        await c.execute(text("select set_config('app.role', 'superadmin', false)"))
        yield c
        await c.rollback()
    await engine.dispose()


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
    test_db: TestDb, conn: AsyncConnection, adapter: SandboxAdapter
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
    svc: WalletCreation = WalletService(conn, adapter, audit)
    first = await svc.create_client_wallet(client_id=cid, currency="IDR")
    again = await svc.create_client_wallet(client_id=cid, currency="IDR")
    ins = await svc.create_insurer_wallet(insurer_id=iid, currency="IDR")
    assert first.created and not again.created and first.wallet_id == again.wallet_id
    assert ins.owner_type == "insurer" and ins.wallet_id != first.wallet_id
    assert [e["action"] for e in audit.events] == ["wallet.created", "wallet.created"]
    mirror = await adapter.balance(wallet_id=str(first.wallet_id))
    assert mirror.balance_minor == 0 and mirror.currency == "IDR"
