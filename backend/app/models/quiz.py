import sqlalchemy as sa
import sqlalchemy.orm as so

from ..extensions import db


class Quiz(db.Model):
    __tablename__ = 'quizzes'

    id: so.Mapped[int] = so.mapped_column(primary_key=True, autoincrement=True)
    public_id: so.Mapped[str] = so.mapped_column(sa.String(20), unique=True, index=True)
    category_id: so.Mapped[int] = so.mapped_column(sa.ForeignKey('categories.id'), nullable=False, index=True)
    title: so.Mapped[str] = so.mapped_column(sa.String(255), nullable=False)

    category: so.Mapped['Category'] = so.relationship(back_populates='quizzes')
    questions: so.WriteOnlyMapped['QuizQuestion'] = so.relationship(back_populates='quiz', cascade='all, delete-orphan')

    def __repr__(self) -> str:
        return f"<Quiz {self.title}>"


