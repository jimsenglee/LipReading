import sqlalchemy as sa
import sqlalchemy.orm as so

from ..extensions import db
from .account import Account


class Administrator(Account):
    __tablename__ = 'administrators'

    id: so.Mapped[int] = so.mapped_column(sa.ForeignKey('accounts.id'), primary_key=True)

    __mapper_args__ = {
        'polymorphic_identity': 'Administrator',
    }

    def __repr__(self) -> str:
        return f"<Administrator {self.email}>"


