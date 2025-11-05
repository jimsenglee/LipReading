import sqlalchemy as sa
import sqlalchemy.orm as so
from typing import TYPE_CHECKING

from ..extensions import db

if TYPE_CHECKING:
    from .tutorial import Tutorial
    from .quiz import Quiz
    from .practice_word import PracticeWord


class Category(db.Model):
    __tablename__ = 'categories'

    id: so.Mapped[int] = so.mapped_column(primary_key=True, autoincrement=True)
    public_id: so.Mapped[str] = so.mapped_column(sa.String(20), unique=True, index=True)
    category_name: so.Mapped[str] = so.mapped_column(sa.String(255), nullable=False, unique=True)
    status: so.Mapped[str] = so.mapped_column(sa.String(20), nullable=False, default='active', index=True)
    sort_order: so.Mapped[int] = so.mapped_column(sa.Integer, nullable=False, default=0)
    created_at: so.Mapped[sa.DateTime] = so.mapped_column(sa.DateTime, nullable=False, server_default=sa.func.now())
    updated_at: so.Mapped[sa.DateTime] = so.mapped_column(sa.DateTime, nullable=False, server_default=sa.func.now(), onupdate=sa.func.now())

    tutorials: so.WriteOnlyMapped['Tutorial'] = so.relationship(back_populates='category', cascade='all, delete-orphan')
    quizzes: so.WriteOnlyMapped['Quiz'] = so.relationship(back_populates='category', cascade='all, delete-orphan')
    practice_words: so.WriteOnlyMapped['PracticeWord'] = so.relationship(back_populates='category', cascade='all, delete-orphan')

    def __repr__(self) -> str:
        return f"<Category {self.category_name}>"


