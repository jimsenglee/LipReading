from datetime import datetime
import sqlalchemy as sa
import sqlalchemy.orm as so
from typing import TYPE_CHECKING

from ..extensions import db

if TYPE_CHECKING:
    from .account import Account


class LoginActivity(db.Model):
    __tablename__ = 'login_activity'

    id: so.Mapped[int] = so.mapped_column(primary_key=True, autoincrement=True)
    user_id: so.Mapped[int] = so.mapped_column(sa.ForeignKey('accounts.id'), index=True, nullable=False)
    timestamp: so.Mapped[datetime] = so.mapped_column(sa.DateTime(), nullable=False, default=datetime.utcnow)
    ip_address: so.Mapped[str | None] = so.mapped_column(sa.String(45))
    device_info: so.Mapped[str | None] = so.mapped_column(sa.Text())

    user: so.Mapped['Account'] = so.relationship(back_populates='login_activity')

    def __repr__(self) -> str:
        return f"<LoginActivity user_id={self.user_id} at={self.timestamp.isoformat()}>"


