import sqlalchemy as sa
import sqlalchemy.orm as so

from ..extensions import db


class Category(db.Model):
    __tablename__ = 'categories'

    id: so.Mapped[int] = so.mapped_column(primary_key=True, autoincrement=True)
    public_id: so.Mapped[str] = so.mapped_column(sa.String(20), unique=True, index=True)
    category_name: so.Mapped[str] = so.mapped_column(sa.String(255), nullable=False, unique=True)

    tutorials: so.WriteOnlyMapped['Tutorial'] = so.relationship(back_populates='category', cascade='all, delete-orphan')
    quizzes: so.WriteOnlyMapped['Quiz'] = so.relationship(back_populates='category', cascade='all, delete-orphan')

    def __repr__(self) -> str:
        return f"<Category {self.category_name}>"


