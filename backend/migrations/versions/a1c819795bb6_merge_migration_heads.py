"""merge migration heads

Revision ID: a1c819795bb6
Revises: 55d92898d5d8, a1b2c3d4e5f7
Create Date: 2025-11-08 00:48:10.260546

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1c819795bb6'
down_revision = ('55d92898d5d8', 'a1b2c3d4e5f7')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
