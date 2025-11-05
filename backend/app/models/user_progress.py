from datetime import datetime
import sqlalchemy as sa
import sqlalchemy.orm as so
from typing import TYPE_CHECKING

from ..extensions import db

if TYPE_CHECKING:
    from .user import User
    from .tutorial import Tutorial


class UserProgress(db.Model):
    __tablename__ = 'user_progress'

    id: so.Mapped[int] = so.mapped_column(primary_key=True, autoincrement=True)
    public_id: so.Mapped[str] = so.mapped_column(sa.String(25), unique=True, index=True)
    user_id: so.Mapped[int] = so.mapped_column(sa.ForeignKey('accounts.id'), nullable=False, index=True)
    tutorial_id: so.Mapped[int] = so.mapped_column(sa.ForeignKey('tutorials.id'), nullable=False, index=True)
    series_id: so.Mapped[int] = so.mapped_column(sa.ForeignKey('tutorials.id'), nullable=False, index=True)  # parent series id
    
    # simple completion tracking
    is_completed: so.Mapped[bool] = so.mapped_column(sa.Boolean, nullable=False, default=False)
    created_at: so.Mapped[datetime] = so.mapped_column(sa.DateTime, nullable=False, default=datetime.utcnow)
    updated_at: so.Mapped[datetime] = so.mapped_column(sa.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: so.Mapped['User'] = so.relationship(back_populates='video_progress')
    tutorial: so.Mapped['Tutorial'] = so.relationship(foreign_keys=[tutorial_id])
    series: so.Mapped['Tutorial'] = so.relationship(foreign_keys=[series_id])

    def __repr__(self) -> str:
        return f"<UserProgress user_id={self.user_id} tutorial_id={self.tutorial_id} completed={self.is_completed}>"


