"""Catalog-driven RLS check (FR-01.8, plan "RLS"): used by ``tests/core/test_rls.py``.

Every ordinary table in ``public`` must have row-level security enabled and forced and at least
one policy, unless its name is in ``NO_POLICY_ALLOWLIST`` with a reason. New tables from any
feature are therefore covered automatically; a table a feature intentionally leaves open must be
added here (an edit to this file in that feature's pull request, reviewed by lane A).
"""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

NO_POLICY_ALLOWLIST: dict[str, str] = {
    # R-003 (a): sign-in looks these up before any tenant is known; Clients read the roster.
    "users": "identity: looked up at sign-in before a tenant is known (R-003)",
    "memberships": "identity: carries insurer_id but is read at sign-in (R-003)",
    "sessions": "identity: session lookup precedes tenant context (R-003)",
    "otp_codes": "identity: sign-in (R-003)",
    "insurers": "roster: every Client may read the insurer list (R-003)",
    # R-002 (a): append must read the latest row of any tenant; app role has INSERT/SELECT only.
    "audit_events": "append-only chain; tenant reads go through audited views (R-002)",
    "clock_state": "single platform row, no tenant data",
    "outbox": "system infrastructure written by services, read by the worker",
    "alembic_version": "migration bookkeeping",
    "spatial_ref_sys": "PostGIS reference data",
}

_TABLES_SQL = text(
    """
    SELECT c.relname AS name, c.relrowsecurity AS enabled, c.relforcerowsecurity AS forced,
           (SELECT count(*) FROM pg_policy p WHERE p.polrelid = c.oid) AS policies
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND NOT c.relispartition
    ORDER BY c.relname
    """
)


async def policy_tables(conn: AsyncConnection) -> list[str]:
    """Names of tables that carry at least one policy."""
    rows = (await conn.execute(_TABLES_SQL)).mappings().all()
    return [r["name"] for r in rows if r["policies"] > 0]


async def violations(conn: AsyncConnection) -> list[str]:
    """Human-readable problems; an empty list means every table is covered or allowlisted."""
    problems: list[str] = []
    for r in (await conn.execute(_TABLES_SQL)).mappings().all():
        name = r["name"]
        if name in NO_POLICY_ALLOWLIST:
            continue
        if not r["enabled"]:
            problems.append(f"{name}: row level security is not enabled")
        if not r["forced"]:
            problems.append(f"{name}: row level security is not forced")
        if r["policies"] == 0:
            problems.append(f"{name}: no policy")
    return problems
