"""add_admin_response_to_feedback

Revision ID: 9d1002767d44
Revises: 166bf4cf086e
Create Date: 2025-11-04 00:35:05.047031

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9d1002767d44'
down_revision = '166bf4cf086e'
branch_labels = None
depends_on = None


def upgrade():
    # add admin response and updated_at fields to feedback table
    with op.batch_alter_table('feedback', schema=None) as batch_op:
        batch_op.add_column(sa.Column('admin_response', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('updated_at', sa.DateTime(), nullable=True))


def downgrade():
    # remove admin response and updated_at fields from feedback table
    with op.batch_alter_table('feedback', schema=None) as batch_op:
        batch_op.drop_column('updated_at')
        batch_op.drop_column('admin_response')
