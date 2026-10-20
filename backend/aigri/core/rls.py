"""Row-level security helper, used by migrations (plan.md section "RLS").

Every feature calls ``apply_tenant_policy`` in its own migration for each tenant table.
"""

import re
from collections.abc import Callable
from typing import Any

_IDENT = re.compile(r"^[a-z_][a-z0-9_]*$")


def _ident(name: str) -> str:
    if not _IDENT.match(name):
        raise ValueError(f"unsafe SQL identifier: {name!r}")
    return name


def tenant_policy_sql(
    table: str,
    insurer_col: str | None = "insurer_id",
    client_col: str | None = "client_id",
    user_col: str | None = None,
) -> list[str]:
    """Return the statements that enable, force and define the isolation policy.

    A row is visible when the session role is ``superadmin``, or when one of the named
    columns equals the matching ``app.*`` setting of the session.
    """
    t = _ident(table)
    terms = ["current_setting('app.role', true) = 'superadmin'"]
    if insurer_col:
        c = _ident(insurer_col)
        terms.append(f"{c} = nullif(current_setting('app.insurer_id', true), '')::uuid")
    if client_col:
        c = _ident(client_col)
        terms.append(f"{c} = nullif(current_setting('app.client_id', true), '')::uuid")
    if user_col:
        c = _ident(user_col)
        terms.append(f"{c} = nullif(current_setting('app.user_id', true), '')::uuid")
    using = "\n    OR ".join(terms)
    return [
        f"ALTER TABLE {t} ENABLE ROW LEVEL SECURITY",
        f"ALTER TABLE {t} FORCE ROW LEVEL SECURITY",
        f"DROP POLICY IF EXISTS insurer_isolation ON {t}",
        f"CREATE POLICY insurer_isolation ON {t}\n  USING (\n    {using}\n  )",
    ]


def apply_tenant_policy(
    execute: Callable[[str], Any],
    table: str,
    insurer_col: str | None = "insurer_id",
    client_col: str | None = "client_id",
    user_col: str | None = None,
) -> None:
    """Apply the policy using ``execute`` (for example ``op.execute``)."""
    for stmt in tenant_policy_sql(table, insurer_col, client_col, user_col):
        execute(stmt)
