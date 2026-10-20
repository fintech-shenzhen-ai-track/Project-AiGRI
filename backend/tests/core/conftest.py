"""Fixtures for DB-backed core tests: async engines for the app and owner roles."""

from collections.abc import AsyncIterator

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from tests.conftest import TestDb


def _async(url: str) -> str:
    return url.replace("postgresql://", "postgresql+asyncpg://")


@pytest.fixture
async def app_engine(test_db: TestDb) -> AsyncIterator[AsyncEngine]:
    engine = create_async_engine(_async(test_db.app_url), pool_size=20, max_overflow=0)
    yield engine
    await engine.dispose()


@pytest.fixture
async def owner_engine(test_db: TestDb) -> AsyncIterator[AsyncEngine]:
    engine = create_async_engine(_async(test_db.owner_url), pool_size=5)
    yield engine
    await engine.dispose()


async def _clear_audit(owner_engine: AsyncEngine) -> None:
    async with owner_engine.begin() as conn:
        await conn.execute(text("ALTER TABLE audit_events DISABLE TRIGGER USER"))
        await conn.execute(text("DELETE FROM audit_events"))
        await conn.execute(text("ALTER TABLE audit_events ENABLE TRIGGER USER"))


@pytest.fixture
async def fresh_audit(owner_engine: AsyncEngine) -> AsyncIterator[None]:
    """Empty ``audit_events`` before and after a test (the owner disables the triggers briefly)."""
    await _clear_audit(owner_engine)
    yield
    await _clear_audit(owner_engine)
