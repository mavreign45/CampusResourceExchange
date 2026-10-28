"""Initial schema for categories, locations, custodians, and resources

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-28 22:50:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Categories table
    op.create_table(
        'categories',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_categories_id'), 'categories', ['id'], unique=False)
    op.create_index(op.f('ix_categories_name'), 'categories', ['name'], unique=True)

    # 2. Locations table
    op.create_table(
        'locations',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('building', sa.String(length=120), nullable=False),
        sa.Column('room', sa.String(length=80), nullable=False),
        sa.Column('campus_zone', sa.String(length=80), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_locations_id'), 'locations', ['id'], unique=False)
    op.create_index(op.f('ix_locations_building'), 'locations', ['building'], unique=False)

    # 3. Custodians table
    op.create_table(
        'custodians',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=120), nullable=False),
        sa.Column('department', sa.String(length=150), nullable=False),
        sa.Column('role', sa.String(length=100), nullable=True),
        sa.Column('contact_email', sa.String(length=150), nullable=False),
        sa.Column('office', sa.String(length=100), nullable=True),
        sa.Column('hours', sa.String(length=120), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_custodians_id'), 'custodians', ['id'], unique=False)
    op.create_index(op.f('ix_custodians_department'), 'custodians', ['department'], unique=False)

    # 4. Resources table
    op.create_table(
        'resources',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('model_number', sa.String(length=100), nullable=True),
        sa.Column('short_description', sa.String(length=350), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('image_url', sa.String(length=500), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('location_id', sa.Integer(), nullable=False),
        sa.Column('custodian_id', sa.Integer(), nullable=False),
        sa.Column('availability_status', sa.String(length=50), nullable=False, server_default='available'),
        sa.Column('estimated_available_date', sa.String(length=120), nullable=True),
        sa.Column('requires_verification', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('requires_training', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('requires_supervision', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('training_requirement', sa.String(length=255), nullable=True),
        sa.Column('eligibility', sa.String(length=255), nullable=True),
        sa.Column('max_borrow_hours', sa.Integer(), nullable=False, server_default='24'),
        sa.Column('max_borrow_duration', sa.String(length=80), nullable=True),
        sa.Column('item_condition', sa.String(length=50), nullable=False, server_default='Good'),
        sa.Column('specifications', sa.JSON(), nullable=True),
        sa.Column('accessories_included', sa.JSON(), nullable=True),
        sa.Column('usage_guidelines', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['custodian_id'], ['custodians.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['location_id'], ['locations.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_resources_id'), 'resources', ['id'], unique=False)
    op.create_index(op.f('ix_resources_name'), 'resources', ['name'], unique=False)
    op.create_index(op.f('ix_resources_category_id'), 'resources', ['category_id'], unique=False)
    op.create_index(op.f('ix_resources_location_id'), 'resources', ['location_id'], unique=False)
    op.create_index(op.f('ix_resources_custodian_id'), 'resources', ['custodian_id'], unique=False)
    op.create_index(op.f('ix_resources_availability_status'), 'resources', ['availability_status'], unique=False)
    op.create_index(op.f('ix_resources_requires_verification'), 'resources', ['requires_verification'], unique=False)


def downgrade() -> None:
    op.drop_table('resources')
    op.drop_table('custodians')
    op.drop_table('locations')
    op.drop_table('categories')
