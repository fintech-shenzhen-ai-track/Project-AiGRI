"""Database engine and the tenant-scoped transaction (FR-01.7).

Every request or job transaction goes through ``tenant_session``, which sets ``app.role``,
``app.insurer_id``, ``app.client_id`` and ``app.user_id`` for that transaction only. The setting is
transaction-local (``set_config(..., true)`` is the parameterised form of ``SET LOCAL``), so a
pooled connection never keeps a previous caller's tenant. All four settings are written every
time; an unset one is the empty string, which the policies read as "no tenant".

The API and worker connect as ``aigri_app``: not the table owner, no BYPASSRLS.
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from dataclasses import dataclass
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection, AsyncEngine, create_async_engine

# Values of app.role: the membership roles (0001 CHECK) plus "system" for worker jobs.
ROLES = frozenset(
    {"client_owner", "product_manager", "underwriter_adjuster", "finance", "superadmin", "system"}
)


def async_url(url: str) -> str:
    """Normalise a ``postgresql://`` DSN to the asyncpg driver form."""
    for prefix in ("postgresql://", "postgres://"):
        if url.startswith(prefix):
            return "postgresql+asyncpg://" + url[len(prefix) :]
    return url


def make_engine(url: str | None = None, **kwargs: object) -> AsyncEngine:
    """Engine for ``url`` (default: ``DATABASE_URL``, the app role)."""
    if url is None:
        from aigri.core.config import get_settings

        url = get_settings().database_url
    return create_async_engine(async_url(url), pool_pre_ping=True, **kwargs)


@dataclass(frozen=True)
class TenantContext:
    role: str
    insurer_id: UUID | str | None = None
    client_id: UUID | str | None = None
    user_id: UUID | str | None = None

    def __post_init__(self) -> None:
        if self.role not in ROLES:
            raise ValueError(f"unknown role {self.role!r}")
        for name in ("insurer_id", "client_id", "user_id"):
            value = getattr(self, name)
            if value is not None:
                UUID(str(value))  # raises ValueError on anything that is not a UUID

    def settings(self) -> dict[str, str]:
        return {
            "app.role": self.role,
            "app.insurer_id": "" if self.insurer_id is None else str(self.insurer_id),
            "app.client_id": "" if self.client_id is None else str(self.client_id),
            "app.user_id": "" if self.user_id is None else str(self.user_id),
        }


async def apply_context(conn: AsyncConnection, ctx: TenantContext) -> None:
    """Set the tenant settings for the current transaction."""
    for key, value in ctx.settings().items():
        await conn.execute(text("SELECT set_config(:k, :v, true)"), {"k": key, "v": value})


@asynccontextmanager
async def tenant_session(engine: AsyncEngine, ctx: TenantContext) -> AsyncIterator[AsyncConnection]:
    """One transaction with the tenant settings applied. Commits on exit, rolls back on error."""
    async with engine.begin() as conn:
        await apply_context(conn, ctx)
        yield conn
