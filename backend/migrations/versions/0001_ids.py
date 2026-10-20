"""0001_ids: per-kind, per-insurer, per-year counters for human ids (T-01.14, D-35).

Revision ID: 0001_ids
Revises: 0001_core
"""

from alembic import op

revision = "0001_ids"
down_revision = "0001_core"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE id_counters (
          kind text NOT NULL,
          scope text NOT NULL DEFAULT '',
          year smallint NOT NULL,
          last_value bigint NOT NULL,
          PRIMARY KEY (kind, scope, year)
        )"""
    )
    op.execute("GRANT SELECT, INSERT, UPDATE ON id_counters TO aigri_app")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS id_counters")
