"""Simplify user bookmarks table

Revision ID: a1b2c3d4e5f6
Revises: 61d6a0444828
Create Date: 2025-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '61d6a0444828'
branch_labels = None
depends_on = None


def upgrade():
    # Drop unused columns from user_bookmarks table
    with op.batch_alter_table('user_bookmarks', schema=None) as batch_op:
        batch_op.drop_column('progress_percentage')
        batch_op.drop_column('last_watched_position')
        batch_op.drop_column('total_watch_time')
        batch_op.drop_column('is_completed')
        batch_op.drop_column('completed_at')
        batch_op.drop_column('enrolled_at')
        batch_op.drop_column('last_accessed_at')
        batch_op.drop_column('rating')
        batch_op.drop_column('review_text')
        batch_op.drop_column('reviewed_at')


def downgrade():
    # Re-add the dropped columns
    with op.batch_alter_table('user_bookmarks', schema=None) as batch_op:
        batch_op.add_column(sa.Column('progress_percentage', sa.Integer(), nullable=False, server_default='0'))
        batch_op.add_column(sa.Column('last_watched_position', sa.Integer(), nullable=False, server_default='0'))
        batch_op.add_column(sa.Column('total_watch_time', sa.Integer(), nullable=False, server_default='0'))
        batch_op.add_column(sa.Column('is_completed', sa.Boolean(), nullable=False, server_default='0'))
        batch_op.add_column(sa.Column('completed_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('enrolled_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')))
        batch_op.add_column(sa.Column('last_accessed_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')))
        batch_op.add_column(sa.Column('rating', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('review_text', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('reviewed_at', sa.DateTime(), nullable=True))

