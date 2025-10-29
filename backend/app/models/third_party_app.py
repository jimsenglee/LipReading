from datetime import datetime
import sqlalchemy as sa
import sqlalchemy.orm as so
from typing import TYPE_CHECKING

from ..extensions import db

if TYPE_CHECKING:
    from .user import User


class ThirdPartyApp(db.Model):
    __tablename__ = 'third_party_apps'

    id: so.Mapped[int] = so.mapped_column(primary_key=True, autoincrement=True)
    user_id: so.Mapped[int] = so.mapped_column(sa.ForeignKey('accounts.id'), index=True, nullable=False)
    app_name: so.Mapped[str] = so.mapped_column(sa.String(255), nullable=False)
    date_granted: so.Mapped[datetime] = so.mapped_column(sa.DateTime(), nullable=False, default=datetime.utcnow)

    user: so.Mapped['User'] = so.relationship(back_populates='connected_apps')

    def __repr__(self) -> str:
        return f"<ThirdPartyApp {self.app_name} user_id={self.user_id}>"


