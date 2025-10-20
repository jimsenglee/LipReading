from datetime import datetime
from typing import Optional
import sqlalchemy as sa
import sqlalchemy.orm as so

from ..extensions import db


class Account(db.Model):
    __tablename__ = 'accounts'

    id: so.Mapped[int] = so.mapped_column(primary_key=True, autoincrement=True)
    public_id: so.Mapped[str] = so.mapped_column(sa.String(64), unique=True, index=True)
    name: so.Mapped[str] = so.mapped_column(sa.String(255), nullable=False)
    email: so.Mapped[str] = so.mapped_column(sa.String(255), nullable=False, unique=True, index=True)
    password_hash: so.Mapped[str] = so.mapped_column(sa.String(255), nullable=False)
    profile_image_path: so.Mapped[Optional[str]] = so.mapped_column(sa.String(255))
    registration_date: so.Mapped[datetime] = so.mapped_column(sa.DateTime(), nullable=False, default=datetime.utcnow)
    account_type: so.Mapped[str] = so.mapped_column(sa.String(20), nullable=False, index=True)

    __mapper_args__ = {
        'polymorphic_on': account_type,
        'polymorphic_identity': 'account',
    }

    def __repr__(self) -> str:
        return f"<Account {self.email}>"


