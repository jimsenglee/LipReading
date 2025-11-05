"""add_admin_response_fields_to_review

Revision ID: a1b2c3d4e5f6
Revises: 9d1002767d44
Create Date: 2025-11-04 19:10:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '9d1002767d44'
branch_labels = None
depends_on = None


def upgrade():
    # add admin response fields to reviews table
    with op.batch_alter_table('reviews', schema=None) as batch_op:
        batch_op.add_column(sa.Column('admin_response', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('admin_responded_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('reviewed_by_admin_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            'fk_reviews_reviewed_by_admin_id',
            'accounts',
            ['reviewed_by_admin_id'],
            ['id']
        )


def downgrade():
    # remove admin response fields from reviews table
    with op.batch_alter_table('reviews', schema=None) as batch_op:
        batch_op.drop_constraint('fk_reviews_reviewed_by_admin_id', type_='foreignkey')
        batch_op.drop_column('reviewed_by_admin_id')
        batch_op.drop_column('admin_responded_at')
        batch_op.drop_column('admin_response')
