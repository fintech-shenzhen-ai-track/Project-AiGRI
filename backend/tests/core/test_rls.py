"""T-01.11: tenant_session and the catalog-driven RLS harness."""

import uuid
from collections.abc import AsyncIterator

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

from aigri.core import rls_check
from aigri.core.db import TenantContext, tenant_session

pytestmark = pytest.mark.db

INS_A, INS_B = (str(uuid.uuid4()) for _ in range(2))
CLI_1, CLI_2 = (str(uuid.uuid4()) for _ in range(2))
USR_1, USR_2 = (str(uuid.uuid4()) for _ in range(2))
SUPER = TenantContext("superadmin")


@pytest.fixture
async def seeded(owner_engine: AsyncEngine) -> AsyncIterator[None]:
    async with tenant_session(owner_engine, SUPER) as c:
        for code, i in (("AAA", INS_A), ("BBB", INS_B)):
            await c.execute(
                text(
                    "INSERT INTO insurers (id, country, code, legal_name, display_name)"
                    " VALUES (:i, 'ID', :c, :c, :c)"
                ),
                {"i": i, "c": code},
            )
        for n, u in (("1", USR_1), ("2", USR_2)):
            await c.execute(
                text("INSERT INTO users (id, email) VALUES (:u, :e)"),
                {"u": u, "e": f"rls{n}-{u}@example.test"},
            )
        for cli, usr in ((CLI_1, USR_1), (CLI_2, USR_2)):
            await c.execute(
                text(
                    "INSERT INTO clients (id, country, kind, name, contact_user_id)"
                    " VALUES (:c, 'ID', 'individual_farmer', 'Test', :u)"
                ),
                {"c": cli, "u": usr},
            )
        for cli, ins, usr in ((CLI_1, INS_A, USR_1), (CLI_2, INS_B, USR_2)):
            await c.execute(
                text(
                    "INSERT INTO client_consents (client_id, scope, insurer_id, payload_hash,"
                    " given_by) VALUES (:c, 'insurer_share', :i, 'sha256:x', :u)"
                ),
                {"c": cli, "i": ins, "u": usr},
            )
            await c.execute(
                text(
                    "INSERT INTO files (owner_client_id, owner_insurer_id, kind, storage_key,"
                    " mime, bytes, sha256) VALUES (:c, :i, 'letter', :k, 'text/plain', 1, 'x')"
                ),
                {"c": cli, "i": ins, "k": f"k-{cli}"},
            )
            await c.execute(
                text(
                    "INSERT INTO notifications (user_id, channel, template) VALUES"
                    " (:u, 'in_app', 't')"
                ),
                {"u": usr},
            )
            await c.execute(
                text(
                    "INSERT INTO push_subscriptions (user_id, endpoint, keys) VALUES"
                    " (:u, 'https://example.test/x', '{}')"
                ),
                {"u": usr},
            )
    yield
    async with tenant_session(owner_engine, SUPER) as c:
        for table in ("push_subscriptions", "notifications", "files", "client_consents", "clients"):
            await c.execute(text(f"DELETE FROM {table}"))
        await c.execute(text("DELETE FROM users WHERE id IN (:a, :b)"), {"a": USR_1, "b": USR_2})
        await c.execute(text("DELETE FROM insurers WHERE id IN (:a, :b)"), {"a": INS_A, "b": INS_B})


async def _count(engine: AsyncEngine, ctx: TenantContext, table: str) -> int:
    async with tenant_session(engine, ctx) as c:
        return int((await c.execute(text(f"SELECT count(*) FROM {table}"))).scalar_one())


async def test_harness_passes_on_the_0001_tables(owner_engine: AsyncEngine) -> None:
    async with owner_engine.connect() as conn:
        assert await rls_check.violations(conn) == []
        covered = set(await rls_check.policy_tables(conn))
    assert {"clients", "client_consents", "files", "notifications", "push_subscriptions"} <= covered
    # R-003 (a): identity tables, memberships named explicitly; R-002 (a): audit_events.
    for name in ("users", "memberships", "sessions", "otp_codes", "insurers", "audit_events"):
        assert name in rls_check.NO_POLICY_ALLOWLIST
        assert name not in covered


@pytest.mark.parametrize(
    "statement",
    [
        "DROP POLICY insurer_isolation ON client_consents",
        "ALTER TABLE files NO FORCE ROW LEVEL SECURITY",
        "ALTER TABLE notifications DISABLE ROW LEVEL SECURITY",
    ],
)
async def test_harness_fails_when_protection_is_removed(
    owner_engine: AsyncEngine, statement: str
) -> None:
    async with owner_engine.connect() as conn:
        trans = await conn.begin()
        await conn.execute(text(statement))
        problems = await rls_check.violations(conn)
        await trans.rollback()
    assert problems, statement


async def test_harness_flags_a_new_table_without_policy(owner_engine: AsyncEngine) -> None:
    async with owner_engine.connect() as conn:
        trans = await conn.begin()
        await conn.execute(text("CREATE TABLE forgotten (id int, insurer_id uuid)"))
        problems = await rls_check.violations(conn)
        await trans.rollback()
    assert any(p.startswith("forgotten:") for p in problems)


@pytest.mark.usefixtures("seeded")
async def test_insurer_sees_only_its_own_rows(app_engine: AsyncEngine) -> None:
    a = TenantContext("underwriter_adjuster", insurer_id=INS_A)
    assert await _count(app_engine, a, "client_consents") == 1
    assert await _count(app_engine, a, "files") == 1
    assert await _count(app_engine, a, "clients") == 0  # insurers read clients through views
    async with tenant_session(app_engine, a) as c:
        rows = (
            await c.execute(
                text(
                    "SELECT cc.insurer_id FROM client_consents cc"
                    " LEFT JOIN files f ON f.owner_client_id = cc.client_id"
                )
            )
        ).all()
    assert {str(r[0]) for r in rows} == {INS_A}


@pytest.mark.usefixtures("seeded")
async def test_client_and_user_scopes(app_engine: AsyncEngine) -> None:
    c1 = TenantContext("client_owner", client_id=CLI_1, user_id=USR_1)
    assert await _count(app_engine, c1, "clients") == 1
    assert await _count(app_engine, c1, "client_consents") == 1
    assert await _count(app_engine, c1, "files") == 1
    assert await _count(app_engine, c1, "notifications") == 1
    assert await _count(app_engine, c1, "push_subscriptions") == 1
    async with tenant_session(app_engine, c1) as c:
        who = (await c.execute(text("SELECT user_id FROM notifications"))).scalar_one()
    assert str(who) == USR_1


@pytest.mark.usefixtures("seeded")
async def test_no_context_sees_nothing_and_superadmin_sees_all(app_engine: AsyncEngine) -> None:
    async with app_engine.begin() as c:  # no tenant_session: no settings at all
        for table in ("clients", "client_consents", "files", "notifications", "push_subscriptions"):
            assert (await c.execute(text(f"SELECT count(*) FROM {table}"))).scalar_one() == 0
    for table in ("clients", "client_consents", "files", "notifications", "push_subscriptions"):
        assert await _count(app_engine, SUPER, table) == 2


@pytest.mark.usefixtures("seeded")
async def test_every_policy_table_hides_rows_from_strangers(
    app_engine: AsyncEngine, owner_engine: AsyncEngine
) -> None:
    """Catalog-driven: rows exist, a session for unrelated tenant ids sees none of them."""
    async with owner_engine.connect() as conn:
        tables = await rls_check.policy_tables(conn)
    stranger = TenantContext(
        "underwriter_adjuster",
        insurer_id=uuid.uuid4(),
        client_id=uuid.uuid4(),
        user_id=uuid.uuid4(),
    )
    assert tables
    for table in tables:
        assert await _count(app_engine, stranger, table) == 0, table


async def test_settings_do_not_leak_across_pooled_connections(app_engine: AsyncEngine) -> None:
    async with tenant_session(app_engine, TenantContext("superadmin")) as c:
        assert (await c.execute(text("SELECT current_setting('app.role', true)"))).scalar_one() == (
            "superadmin"
        )
    async with app_engine.begin() as c:
        assert (await c.execute(text("SELECT current_setting('app.role', true)"))).scalar_one() in (
            "",
            None,
        )


def test_context_validation() -> None:
    with pytest.raises(ValueError):
        TenantContext("root")
    with pytest.raises(ValueError):
        TenantContext("superadmin", insurer_id="'; drop table x; --")
    assert TenantContext("system").settings()["app.insurer_id"] == ""
