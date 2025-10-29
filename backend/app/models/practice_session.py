from datetime import datetime
import sqlalchemy as sa
import sqlalchemy.orm as so
from typing import TYPE_CHECKING

from ..extensions import db

if TYPE_CHECKING:
    from .user import User


class PracticeSession(db.Model):
    __tablename__ = 'practice_sessions'

    id: so.Mapped[int] = so.mapped_column(primary_key=True, autoincrement=True)
    public_id: so.Mapped[str] = so.mapped_column(sa.String(25), unique=True, index=True)
    user_id: so.Mapped[int] = so.mapped_column(sa.ForeignKey('accounts.id'), nullable=False, index=True)
    reference_video_path: so.Mapped[str] = so.mapped_column(sa.String(255), nullable=False)
    session_date: so.Mapped[datetime] = so.mapped_column(sa.DateTime(), nullable=False, default=datetime.utcnow)

    user: so.Mapped['User'] = so.relationship(back_populates='practice_sessions')

    def __repr__(self) -> str:
        return f"<PracticeSession user_id={self.user_id} at={self.session_date.isoformat()}>"


