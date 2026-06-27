"""add booking consent fields

Records that the customer agreed to the Terms / Cancellation Policy at
booking time: a flag, a timestamp, and the originating IP.

Revision ID: a1b2c3d4e5f6
Revises: 558ceb404b7e
Create Date: 2026-06-27
"""
from alembic import op
import sqlalchemy as sa

revision = "a1b2c3d4e5f6"
down_revision = "558ceb404b7e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "bookings",
        sa.Column("consent_agreed", sa.Boolean(), nullable=False,
                  server_default=sa.false()),
    )
    op.add_column(
        "bookings",
        sa.Column("consent_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "bookings",
        sa.Column("consent_ip", sa.String(length=64), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("bookings", "consent_ip")
    op.drop_column("bookings", "consent_at")
    op.drop_column("bookings", "consent_agreed")
