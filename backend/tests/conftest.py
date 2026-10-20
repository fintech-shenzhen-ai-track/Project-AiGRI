"""Shared fixtures.

DB tests create a throwaway database on the server named by ``TEST_ADMIN_URL`` (a superuser DSN,
default ``postgresql://aigri_owner:aigri_owner@localhost:5432/postgres``), migrate it, and drop it
afterwards. When no usable server exists they are skipped with a reason; CI sets REQUIRE_DB=1
so a missing server fails instead.
"""

import os
import socket
import uuid
from collections.abc import Iterator
from dataclasses import dataclass
from urllib.parse import urlsplit, urlunsplit

import pytest

os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://aigri_app:aigri_app@localhost:5432/x")
os.environ.setdefault(
    "DATABASE_OWNER_URL", "postgresql+asyncpg://aigri_owner:aigri_owner@localhost:5432/x"
)
os.environ.setdefault("SESSION_SECRET", "test-secret-test-secret")
os.environ.setdefault("HEALTH_TIMEOUT_S", "0.3")

ADMIN_URL = os.environ.get(
    "TEST_ADMIN_URL", "postgresql://aigri_owner:aigri_owner@localhost:5432/postgres"
)


def _reachable(url: str) -> bool:
    parts = urlsplit(url)
    try:
        with socket.create_connection((parts.hostname or "localhost", parts.port or 5432), 0.5):
            return True
    except OSError:
        return False


def _with_db(url: str, dbname: str, user: str | None = None, password: str | None = None) -> str:
    p = urlsplit(url)
    host = p.hostname or "localhost"
    port = p.port or 5432
    u = user or p.username or ""
    pw = password if password is not None else (p.password or "")
    return urlunsplit((p.scheme, f"{u}:{pw}@{host}:{port}", f"/{dbname}", "", ""))


@dataclass
class TestDb:
    __test__ = False
    name: str
    owner_url: str
    app_url: str
    admin_url: str


@pytest.fixture(scope="session")
def test_db() -> Iterator[TestDb]:
    if not _reachable(ADMIN_URL) and not os.environ.get("REQUIRE_DB"):
        pytest.skip("no PostgreSQL reachable at TEST_ADMIN_URL (start the stack or set it)")
    import asyncio

    import asyncpg
    from alembic import command
    from alembic.config import Config

    name = f"aigri_test_{uuid.uuid4().hex[:10]}"

    async def _admin(sql: str) -> None:
        conn = await asyncpg.connect(ADMIN_URL)
        try:
            await conn.execute(sql)
        finally:
            await conn.close()

    try:
        asyncio.run(_admin(f'CREATE DATABASE "{name}"'))
    except (OSError, asyncpg.PostgresError) as exc:
        if os.environ.get("REQUIRE_DB"):
            raise
        pytest.skip(f"cannot use PostgreSQL at TEST_ADMIN_URL: {type(exc).__name__}")
    owner_url = _with_db(ADMIN_URL, name)
    app_url = _with_db(ADMIN_URL, name, "aigri_app", "aigri_app")
    try:
        cfg = Config(os.path.join(os.path.dirname(__file__), "..", "alembic.ini"))
        cfg.set_main_option(
            "script_location", os.path.join(os.path.dirname(__file__), "..", "migrations")
        )
        cfg.set_main_option(
            "sqlalchemy.url", owner_url.replace("postgresql://", "postgresql+asyncpg://")
        )
        command.upgrade(cfg, "head")
        yield TestDb(name=name, owner_url=owner_url, app_url=app_url, admin_url=ADMIN_URL)
    finally:
        asyncio.run(_admin(f'DROP DATABASE IF EXISTS "{name}" WITH (FORCE)'))
