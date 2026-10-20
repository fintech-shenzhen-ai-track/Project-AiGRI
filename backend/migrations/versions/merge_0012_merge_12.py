"""merge 12

Revision ID: merge_0012
Revises: 0001_ids, 0012_wallet
"""

from alembic import op

revision = "merge_0012"
down_revision = ("0001_ids", "0012_wallet")
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
