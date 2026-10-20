"""T-12.01: ledger constraints and the payout trigger check, enforced by the database."""

import json
import random
import string
import uuid
from collections.abc import AsyncIterator
from typing import Any

import asyncpg
import pytest

from tests.conftest import TestDb

pytestmark = pytest.mark.db


async def _approval(
    conn: asyncpg.Connection, cur: str, claim_id: str, amount: int, action: str
) -> int:
    return int(
        await conn.fetchval(
            "insert into audit_events (ts, actor_type, actor_label, action, object_type, object_id,"
            " payload, prev_hash, hash) values (now(), 'person', 't', $1, 'claim', $2, $3::jsonb,"
            " 'p', $4) returning seq",
            action,
            claim_id,
            json.dumps({"final_amount_minor": amount, "currency": cur}),
            f"h-{uuid.uuid4().hex}",
        )
    )


class World:
    def __init__(self, conn: asyncpg.Connection, ins: uuid.UUID, cli: uuid.UUID) -> None:
        self.conn = conn
        self.cur = "".join(random.choices(string.ascii_uppercase, k=3))
        self.ins, self.cli = ins, cli
        self.ins_w = uuid.uuid4()
        self.cli_w = uuid.uuid4()
        self.ext_w = uuid.uuid4()

    async def txn(
        self,
        kind: str,
        key: str,
        amount: int,
        seq: int | None = None,
        ref: dict[str, Any] | None = None,
        status: str = "posted",
    ) -> uuid.UUID:
        return uuid.UUID(
            str(
                await self.conn.fetchval(
                    "insert into wallet_txns (kind, idempotency_key, amount_minor, currency,"
                    " trigger_event_seq, trigger_ref, status) values ($1,$2,$3,'"
                    + self.cur
                    + "',$4,$5::jsonb,"
                    " $6) returning id",
                    kind,
                    key,
                    amount,
                    seq,
                    json.dumps(ref or {}),
                    status,
                )
            )
        )

    async def entry(self, txn: uuid.UUID, wallet: uuid.UUID, amt: int, after: int) -> None:
        await self.conn.execute(
            "insert into ledger_entries (txn_id, wallet_id, amount_minor, currency,"
            " balance_after_minor) values ($1,$2,$3,'" + self.cur + "',$4)",
            txn,
            wallet,
            amt,
            after,
        )

    async def balance(self, wallet: uuid.UUID) -> int:
        return int(
            await self.conn.fetchval(
                "select coalesce((select balance_after_minor from ledger_entries"
                " where wallet_id=$1 order by id desc limit 1), 0)",
                wallet,
            )
        )


@pytest.fixture
async def world(test_db: TestDb) -> AsyncIterator[World]:
    conn = await asyncpg.connect(test_db.owner_url)
    await conn.execute("select set_config('app.role', 'superadmin', false)")
    ins = await conn.fetchval(
        "insert into insurers (country, code, legal_name, display_name) values"
        " ('ID', $1, 'x', 'x') returning id",
        "I" + uuid.uuid4().hex[:8],
    )
    cli = await conn.fetchval(
        "insert into clients (country, kind, name) values ('ID', 'agri_business', 'c') returning id"
    )
    w = World(conn, ins, cli)
    await conn.execute(
        "insert into wallets (id, owner_type, owner_id, insurer_id, client_id, currency) values"
        " ($1,'insurer',$2,$2,null,'" + w.cur + "'), ($3,'client',$4,null,$4,'" + w.cur + "')",
        w.ins_w,
        ins,
        w.cli_w,
        cli,
    )
    await conn.execute(
        "insert into wallets (id, owner_type, currency) values ($1,'platform_external','"
        + w.cur
        + "')",
        w.ext_w,
    )
    try:
        yield w
    finally:
        await conn.close()


async def _fund(w: World, amount: int) -> None:
    async with w.conn.transaction():
        t = await w.txn("funding", f"fund:{uuid.uuid4()}", amount)
        await w.entry(t, w.ext_w, -amount, await w.balance(w.ext_w) - amount)
        await w.entry(t, w.ins_w, amount, await w.balance(w.ins_w) + amount)


async def test_entries_must_sum_to_zero(world: World) -> None:
    with pytest.raises(asyncpg.CheckViolationError):
        async with world.conn.transaction():
            t = await world.txn("funding", "f1", 100)
            await world.entry(t, world.ext_w, -100, -100)
            await world.entry(t, world.ins_w, 90, 90)
    await _fund(world, 100)
    assert await world.balance(world.ins_w) == 100


async def test_negative_balance_rejected_except_external(world: World) -> None:
    await _fund(world, 500)  # the external source goes to -500: allowed
    assert await world.balance(world.ext_w) == -500
    with pytest.raises(asyncpg.CheckViolationError):
        async with world.conn.transaction():
            t = await world.txn("withdrawal", "w1", 600)
            await world.entry(t, world.ins_w, -600, -100)
            await world.entry(t, world.cli_w, 600, 600)


async def test_balance_after_must_chain(world: World) -> None:
    await _fund(world, 500)
    with pytest.raises(asyncpg.PostgresError):
        async with world.conn.transaction():
            t = await world.txn("withdrawal", "w2", 100)
            await world.entry(t, world.ins_w, -100, 999)
            await world.entry(t, world.cli_w, 100, 100)


async def test_ledger_is_append_only(world: World) -> None:
    await _fund(world, 500)
    with pytest.raises(asyncpg.InsufficientPrivilegeError):
        await world.conn.execute("update ledger_entries set amount_minor = 1")
    with pytest.raises(asyncpg.InsufficientPrivilegeError):
        await world.conn.execute("delete from ledger_entries")
    with pytest.raises(asyncpg.InsufficientPrivilegeError):
        await world.conn.execute("update wallet_txns set amount_minor = 1")


async def test_idempotency_key_unique(world: World) -> None:
    await world.txn("funding", "dup", 1)
    with pytest.raises(asyncpg.UniqueViolationError):
        await world.txn("funding", "dup", 1)


async def _payout(w: World, claim: str, amount: int, seq: int | None) -> None:
    async with w.conn.transaction():
        t = await w.txn("payout", f"payout:{claim}", amount, seq=seq, ref={"claim_id": claim})
        await w.entry(t, w.ins_w, -amount, await w.balance(w.ins_w) - amount)
        await w.entry(t, w.cli_w, amount, await w.balance(w.cli_w) + amount)


async def test_payout_trigger_check(world: World) -> None:
    await _fund(world, 1000)
    c = str(uuid.uuid4())
    ok = await _approval(world.conn, world.cur, c, 400, "claim.approved")
    with pytest.raises(asyncpg.CheckViolationError):  # no approval seq
        await _payout(world, c, 400, None)
    denied = await _approval(world.conn, world.cur, c, 400, "claim.denied")
    with pytest.raises(asyncpg.CheckViolationError):  # seq of another action
        await _payout(world, c, 400, denied)
    with pytest.raises(asyncpg.CheckViolationError):  # approval for another claim
        await _payout(world, str(uuid.uuid4()), 400, ok)
    with pytest.raises(asyncpg.CheckViolationError):  # wrong amount
        await _payout(world, c, 401, ok)
    await _payout(world, c, 400, ok)
    with pytest.raises(asyncpg.UniqueViolationError):  # replay
        await _payout(world, c, 400, ok)
    assert await world.conn.fetchval("select count(*) from wallet_txns where kind='payout'") == 1


async def test_pending_payout_can_post_later(world: World) -> None:
    c = str(uuid.uuid4())
    seq = await _approval(world.conn, world.cur, c, 400, "claim.approved")
    t = await world.txn("payout", f"payout:{c}", 400, status="pending_funds", ref={"claim_id": c})
    with pytest.raises(asyncpg.CheckViolationError):  # posting still needs the approval seq
        await world.conn.execute("update wallet_txns set status='posted' where id=$1", t)
    await world.conn.execute(
        "update wallet_txns set status='posted', trigger_event_seq=$2 where id=$1", t, seq
    )


async def test_tenant_isolation_on_wallets(test_db: TestDb, world: World) -> None:
    app = await asyncpg.connect(test_db.app_url)
    try:
        assert await app.fetchval("select count(*) from wallets") == 0
        await app.execute("select set_config('app.client_id', $1, false)", str(world.cli))
        rows = await app.fetch("select owner_type from wallets")
        assert [r["owner_type"] for r in rows] == ["client"]
        with pytest.raises(asyncpg.InsufficientPrivilegeError):
            await app.execute("delete from ledger_entries")
    finally:
        await app.close()


async def _approved_payout_txn(w: World, amount: int = 400) -> uuid.UUID:
    c = str(uuid.uuid4())
    seq = await _approval(w.conn, w.cur, c, amount, "claim.approved")
    return await w.txn("payout", f"payout:{c}", amount, seq=seq, ref={"claim_id": c})


async def _new_client(w: World) -> uuid.UUID:
    return uuid.UUID(
        str(
            await w.conn.fetchval(
                "insert into clients (country, kind, name) values ('ID','agri_business','o')"
                " returning id"
            )
        )
    )


async def test_entries_need_a_posted_txn(world: World) -> None:
    await _fund(world, 1000)
    for status in ("pending_funds", "failed"):
        c = str(uuid.uuid4())
        t = await world.txn("payout", f"payout:{c}", 400, status=status, ref={"claim_id": c})
        with pytest.raises(asyncpg.CheckViolationError):
            async with world.conn.transaction():
                await world.entry(t, world.ins_w, -400, 600)
                await world.entry(t, world.cli_w, 400, 400)


async def test_payout_entries_must_match_amount_and_wallets(world: World) -> None:
    await _fund(world, 1000)
    t = await _approved_payout_txn(world)  # a smaller movement than the approved amount
    with pytest.raises(asyncpg.CheckViolationError):
        async with world.conn.transaction():
            await world.entry(t, world.ins_w, -300, 700)
            await world.entry(t, world.cli_w, 300, 300)
    async with world.conn.transaction():
        f = await world.txn("top_up", f"tu:{uuid.uuid4()}", 500)
        await world.entry(f, world.ext_w, -500, await world.balance(world.ext_w) - 500)
        await world.entry(f, world.cli_w, 500, 500)
    t = await _approved_payout_txn(world)  # wrong direction: the client wallet is debited
    with pytest.raises(asyncpg.CheckViolationError):
        async with world.conn.transaction():
            await world.entry(t, world.cli_w, -400, 100)
            await world.entry(t, world.ins_w, 400, await world.balance(world.ins_w) + 400)
    t = await _approved_payout_txn(world)  # a third leg
    with pytest.raises(asyncpg.CheckViolationError):
        async with world.conn.transaction():
            await world.entry(t, world.ins_w, -400, 600)
            await world.entry(t, world.cli_w, 300, 800)
            await world.entry(t, world.cli_w, 100, 900)
    other = await _new_client(world)  # credited client is not the one the txn names
    c = str(uuid.uuid4())
    seq = await _approval(world.conn, world.cur, c, 400, "claim.approved")
    named = uuid.UUID(
        str(
            await world.conn.fetchval(
                "insert into wallet_txns (kind, idempotency_key, amount_minor, currency,"
                " trigger_event_seq, trigger_ref, client_id) values ('payout', $1, 400, $2, $3,"
                " $4::jsonb, $5) returning id",
                f"payout:{c}",
                world.cur,
                seq,
                json.dumps({"claim_id": c}),
                other,
            )
        )
    )
    with pytest.raises(asyncpg.CheckViolationError):
        async with world.conn.transaction():
            await world.entry(named, world.ins_w, -400, 600)
            await world.entry(named, world.cli_w, 400, 900)


async def test_tenant_columns_come_from_the_wallet(world: World) -> None:
    other = await _new_client(world)
    async with world.conn.transaction():
        t = await world.txn("funding", f"fund:{uuid.uuid4()}", 100)
        for wallet, amt in ((world.ext_w, -100), (world.ins_w, 100)):
            await world.conn.execute(
                "insert into ledger_entries (txn_id, wallet_id, amount_minor, currency,"
                " balance_after_minor, client_id) values ($1,$2,$3,'" + world.cur + "',$3,$4)",
                t,
                wallet,
                amt,
                other,
            )
    rows = await world.conn.fetch(
        "select wallet_id, client_id, insurer_id from ledger_entries where txn_id=$1", t
    )
    by_wallet = {r["wallet_id"]: r for r in rows}
    assert by_wallet[world.ext_w]["client_id"] is None
    assert by_wallet[world.ins_w]["client_id"] is None
    assert by_wallet[world.ins_w]["insurer_id"] == world.ins
