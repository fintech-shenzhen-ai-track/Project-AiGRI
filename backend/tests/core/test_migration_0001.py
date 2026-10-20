"""T-01.03: alembic upgrade head on an empty DB; aigri_app cannot change audit_events."""

import asyncpg
import pytest

from tests.conftest import TestDb

pytestmark = pytest.mark.db


async def test_upgrade_creates_tables_and_clock_row(test_db: TestDb) -> None:
    conn = await asyncpg.connect(test_db.owner_url)
    try:
        tables = {
            r["tablename"]
            for r in await conn.fetch("select tablename from pg_tables where schemaname='public'")
        }
        assert {
            "users",
            "memberships",
            "sessions",
            "otp_codes",
            "insurers",
            "clients",
            "client_consents",
            "audit_events",
            "outbox",
            "files",
            "clock_state",
            "notifications",
            "push_subscriptions",
        } <= tables
        assert await conn.fetchval("select mode from clock_state where id = 1") == "real"
    finally:
        await conn.close()


async def test_app_role_is_not_owner_and_cannot_bypass_rls(test_db: TestDb) -> None:
    conn = await asyncpg.connect(test_db.owner_url)
    try:
        row = await conn.fetchrow(
            "select rolsuper, rolbypassrls, rolinherit from pg_roles where rolname='aigri_app'"
        )
        assert row is not None
        assert not row["rolsuper"] and not row["rolbypassrls"] and not row["rolinherit"]
        owners = await conn.fetch(
            "select 1 from pg_tables where schemaname='public' and tableowner='aigri_app'"
        )
        assert owners == []
    finally:
        await conn.close()


async def test_app_cannot_update_or_delete_audit_events(test_db: TestDb) -> None:
    owner = await asyncpg.connect(test_db.owner_url)
    try:
        await owner.execute(
            "insert into audit_events (ts, actor_type, actor_label, action, object_type, "
            "object_id, payload, prev_hash, hash) values (now(), 'system', 't', 'a.b', 'x', '1', "
            "'{}', 'sha256:0', 'sha256:1')"
        )
    finally:
        await owner.close()
    app = await asyncpg.connect(test_db.app_url)
    try:
        assert await app.fetchval("select count(*) from audit_events") == 1
        await app.execute(
            "insert into audit_events (ts, actor_type, actor_label, action, object_type, "
            "object_id, payload, prev_hash, hash) values (now(), 'system', 't', 'a.c', 'x', '2', "
            "'{}', 'sha256:1', 'sha256:2')"
        )
        with pytest.raises(asyncpg.InsufficientPrivilegeError):
            await app.execute("update audit_events set action = 'x'")
        with pytest.raises(asyncpg.InsufficientPrivilegeError):
            await app.execute("delete from audit_events")
    finally:
        await app.close()


async def test_trigger_blocks_update_even_for_owner(test_db: TestDb) -> None:
    owner = await asyncpg.connect(test_db.owner_url)
    try:
        with pytest.raises(asyncpg.InsufficientPrivilegeError):
            await owner.execute("update audit_events set action = 'x'")
        with pytest.raises(asyncpg.InsufficientPrivilegeError):
            await owner.execute("delete from audit_events")
    finally:
        await owner.close()
