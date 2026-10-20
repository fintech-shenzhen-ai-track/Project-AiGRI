"""T-12.02: PartnerWalletAdapter against the real mock service on an ephemeral port."""

import importlib.util
import threading
from collections.abc import Iterator
from pathlib import Path

import pytest

from aigri.wallet.adapter import InsufficientFunds, PartnerWalletAdapter, SandboxAdapter

APP = Path(__file__).resolve().parents[3] / "mock_services" / "wallet" / "app.py"


@pytest.fixture
def adapter() -> Iterator[SandboxAdapter]:
    spec = importlib.util.spec_from_file_location("mock_wallet_app", APP)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    mod.Handler.store = mod.Store()  # fresh database per test
    server = mod.make_server(0, "127.0.0.1")
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield SandboxAdapter(f"http://127.0.0.1:{server.server_address[1]}")
    finally:
        server.shutdown()
        server.server_close()


def test_sandbox_adapter_satisfies_protocol(adapter: SandboxAdapter) -> None:
    assert isinstance(adapter, PartnerWalletAdapter)


async def test_create_top_up_transfer_refund_statement(adapter: SandboxAdapter) -> None:
    a = await adapter.create_wallet(owner_ref="insurer:1", currency="IDR")
    b = await adapter.create_wallet(owner_ref="client:1", currency="IDR")
    await adapter.top_up(
        wallet_id=a.wallet_id, amount_minor=1000, currency="IDR", idempotency_key="t1"
    )
    tr = await adapter.transfer(
        from_wallet_id=a.wallet_id,
        to_wallet_id=b.wallet_id,
        amount_minor=400,
        currency="IDR",
        idempotency_key="payout:c1",
        trigger={"event_seq": 7},
    )
    assert (await adapter.balance(wallet_id=a.wallet_id)).balance_minor == 600
    assert (await adapter.balance(wallet_id=b.wallet_id)).balance_minor == 400
    await adapter.refund(transfer_id=tr.id, idempotency_key="r1")
    assert (await adapter.balance(wallet_id=a.wallet_id)).balance_minor == 1000
    st = await adapter.statement(wallet_id=b.wallet_id)
    assert [line.amount_minor for line in st.lines] == [400, -400]
    assert st.lines[-1].balance_after_minor == 0


async def test_transfer_is_idempotent(adapter: SandboxAdapter) -> None:
    a = await adapter.create_wallet(owner_ref="i", currency="IDR")
    b = await adapter.create_wallet(owner_ref="c", currency="IDR")
    await adapter.top_up(
        wallet_id=a.wallet_id, amount_minor=1000, currency="IDR", idempotency_key="t"
    )
    first = await adapter.transfer(
        from_wallet_id=a.wallet_id,
        to_wallet_id=b.wallet_id,
        amount_minor=300,
        currency="IDR",
        idempotency_key="k",
    )
    again = await adapter.transfer(
        from_wallet_id=a.wallet_id,
        to_wallet_id=b.wallet_id,
        amount_minor=300,
        currency="IDR",
        idempotency_key="k",
    )
    assert not first.replayed and again.replayed and again.id == first.id
    assert (await adapter.balance(wallet_id=b.wallet_id)).balance_minor == 300


async def test_insufficient_funds_and_double_refund(adapter: SandboxAdapter) -> None:
    a = await adapter.create_wallet(owner_ref="i", currency="IDR")
    b = await adapter.create_wallet(owner_ref="c", currency="IDR")
    with pytest.raises(InsufficientFunds):
        await adapter.transfer(
            from_wallet_id=a.wallet_id,
            to_wallet_id=b.wallet_id,
            amount_minor=1,
            currency="IDR",
            idempotency_key="x",
        )
    await adapter.top_up(
        wallet_id=a.wallet_id, amount_minor=50, currency="IDR", idempotency_key="t"
    )
    tr = await adapter.transfer(
        from_wallet_id=a.wallet_id,
        to_wallet_id=b.wallet_id,
        amount_minor=50,
        currency="IDR",
        idempotency_key="y",
    )
    await adapter.refund(transfer_id=tr.id, idempotency_key="r")
    with pytest.raises(Exception, match="already refunded"):
        await adapter.refund(transfer_id=tr.id, idempotency_key="r2")


async def test_simulate_va_payment_credits_wallet(adapter: SandboxAdapter) -> None:
    a = await adapter.create_wallet(owner_ref="c", currency="IDR")
    await adapter.simulate_va_payment(
        wallet_id=a.wallet_id, amount_minor=77, currency="IDR", idempotency_key="va1"
    )
    assert (await adapter.balance(wallet_id=a.wallet_id)).balance_minor == 77
