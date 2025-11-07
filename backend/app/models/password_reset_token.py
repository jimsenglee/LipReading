from datetime import datetime
import sqlalchemy as sa
import sqlalchemy.orm as so
from typing import TYPE_CHECKING

from ..extensions import db

if TYPE_CHECKING:
    from .account import Account


class PasswordResetToken(db.Model):
    __tablename__ = 'password_reset_tokens'
    
    id: so.Mapped[int] = so.mapped_column(primary_key=True, autoincrement=True)
    user_id: so.Mapped[int] = so.mapped_column(sa.ForeignKey('accounts.id'), nullable=False, index=True)
    token: so.Mapped[str] = so.mapped_column(sa.String(255), unique=True, nullable=False, index=True)
    expires_at: so.Mapped[datetime] = so.mapped_column(sa.DateTime(), nullable=False)
    used: so.Mapped[bool] = so.mapped_column(sa.Boolean(), nullable=False, default=False)
    created_at: so.Mapped[datetime] = so.mapped_column(sa.DateTime(), nullable=False, default=datetime.utcnow)
    
    user: so.Mapped['Account'] = so.relationship()
    
    def __repr__(self) -> str:
        return f"<PasswordResetToken user_id={self.user_id} expires_at={self.expires_at.isoformat()}>"

