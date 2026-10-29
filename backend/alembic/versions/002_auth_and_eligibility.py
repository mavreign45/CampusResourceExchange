"""Schema migration for users and eligibility verifications

Revision ID: 002_auth_and_eligibility
Revises: 001_initial_schema
Create Date: 2026-10-28 23:25:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '002_auth_and_eligibility'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('full_name', sa.String(length=120), nullable=False),
        sa.Column('email', sa.String(length=150), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=50), server_default='Student', nullable=False),
        sa.Column('department', sa.String(length=150), nullable=True),
        sa.Column('student_id', sa.String(length=50), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_role'), 'users', ['role'], unique=False)

    # 2. Eligibility Verifications table
    op.create_table(
        'eligibility_verifications',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('resource_id', sa.String(length=64), nullable=True),
        sa.Column('requirement_type', sa.String(length=120), nullable=False),
        sa.Column('status', sa.String(length=50), server_default='Pending Review', nullable=False),
        sa.Column('evidence_details', sa.Text(), nullable=True),
        sa.Column('submitted_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('reviewed_by', sa.Integer(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('review_notes', sa.Text(), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['resource_id'], ['resources.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['reviewed_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_eligibility_verifications_id'), 'eligibility_verifications', ['id'], unique=False)
    op.create_index(op.f('ix_eligibility_verifications_user_id'), 'eligibility_verifications', ['user_id'], unique=False)
    op.create_index(op.f('ix_eligibility_verifications_resource_id'), 'eligibility_verifications', ['resource_id'], unique=False)
    op.create_index(op.f('ix_eligibility_verifications_requirement_type'), 'eligibility_verifications', ['requirement_type'], unique=False)
    op.create_index(op.f('ix_eligibility_verifications_status'), 'eligibility_verifications', ['status'], unique=False)
    op.create_index(op.f('ix_eligibility_verifications_reviewed_by'), 'eligibility_verifications', ['reviewed_by'], unique=False)


def downgrade() -> None:
    op.drop_table('eligibility_verifications')
    op.drop_table('users')
