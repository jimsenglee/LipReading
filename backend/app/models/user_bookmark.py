import sqlalchemy as sa
from datetime import datetime

from ..extensions import db


user_bookmarks = db.Table(
    'user_bookmarks',
    db.metadata,
        sa.Column('user_id', sa.Integer, sa.ForeignKey('accounts.id'), primary_key=True),
    sa.Column('tutorial_id', sa.Integer, sa.ForeignKey('tutorials.id'), primary_key=True),
    # phase 4: add progress tracking fields to existing table
    sa.Column('progress_percentage', sa.Integer, nullable=False, default=0),
    sa.Column('last_watched_position', sa.Integer, nullable=False, default=0), # position in seconds
    sa.Column('total_watch_time', sa.Integer, nullable=False, default=0), # total time watched in seconds
    sa.Column('is_completed', sa.Boolean, nullable=False, default=False),
    sa.Column('completed_at', sa.DateTime, nullable=True),
    sa.Column('enrolled_at', sa.DateTime, nullable=False, default=datetime.utcnow),
    sa.Column('last_accessed_at', sa.DateTime, nullable=False, default=datetime.utcnow),
    # phase 4: add review system fields to existing table
    sa.Column('rating', sa.Integer, nullable=True), # 1-5 star rating
    sa.Column('review_text', sa.Text, nullable=True), # review comment
    sa.Column('reviewed_at', sa.DateTime, nullable=True), # when review was submitted
)


