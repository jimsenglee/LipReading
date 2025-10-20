import sqlalchemy as sa

from ..extensions import db


user_bookmarks = db.Table(
    'user_bookmarks',
    db.metadata,
    sa.Column('user_id', sa.Integer, sa.ForeignKey('users.id'), primary_key=True),
    sa.Column('tutorial_id', sa.Integer, sa.ForeignKey('tutorials.id'), primary_key=True),
)


