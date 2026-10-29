"""003 reservations

Revision ID: 003_reservations
Revises: 002_auth_and_eligibility
Create Date: 2026-10-29
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers used by Alembic
revision = "003_reservations"
down_revision = "002_auth_and_eligibility"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "reservations",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("resource_id", sa.String(length=64), nullable=False),
        sa.Column("requester_id", sa.Integer(), nullable=False),
        sa.Column("reviewed_by", sa.Integer(), nullable=True),
        sa.Column("start_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="Pending"),
        sa.Column("purpose", sa.Text(), nullable=False),
        sa.Column("review_notes", sa.Text(), nullable=True),
        sa.Column(
            "submitted_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("collected_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("returned_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["resource_id"], ["resources.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["requester_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["reviewed_by"], ["users.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Individual column indexes
    op.create_index("ix_reservations_id", "reservations", ["id"])
    op.create_index("ix_reservations_resource_id", "reservations", ["resource_id"])
    op.create_index("ix_reservations_requester_id", "reservations", ["requester_id"])
    op.create_index("ix_reservations_status", "reservations", ["status"])

    # Composite index for overlap detection
    op.create_index(
        "ix_reservations_resource_window",
        "reservations",
        ["resource_id", "start_at", "end_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_reservations_resource_window", table_name="reservations")
    op.drop_index("ix_reservations_status", table_name="reservations")
    op.drop_index("ix_reservations_requester_id", table_name="reservations")
    op.drop_index("ix_reservations_resource_id", table_name="reservations")
    op.drop_index("ix_reservations_id", table_name="reservations")
    op.drop_table("reservations")
