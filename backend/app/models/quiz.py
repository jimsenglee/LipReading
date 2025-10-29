import sqlalchemy as sa
import sqlalchemy.orm as so
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from ..extensions import db

# forward references for type hints
if TYPE_CHECKING:
    from .category import Category
    from .quiz_question import QuizQuestion


class Quiz(db.Model):
    __tablename__ = 'quizzes'

    id: so.Mapped[int] = so.mapped_column(primary_key=True, autoincrement=True)
    public_id: so.Mapped[str] = so.mapped_column(sa.String(20), unique=True, index=True)
    category_id: so.Mapped[int] = so.mapped_column(sa.ForeignKey('categories.id'), nullable=False, index=True)
    title: so.Mapped[str] = so.mapped_column(sa.String(255), nullable=False)
    description: so.Mapped[str | None] = so.mapped_column(sa.Text())
    status: so.Mapped[str] = so.mapped_column(sa.String(20), nullable=False, default='active', index=True)
    
    # phase 2: add missing fields for education module
    difficulty: so.Mapped[str] = so.mapped_column(sa.String(20), nullable=False, default='beginner', index=True)
    author: so.Mapped[str] = so.mapped_column(sa.String(255), nullable=False, default='System')
    thumbnail_path: so.Mapped[str | None] = so.mapped_column(sa.String(255))
    views: so.Mapped[int] = so.mapped_column(sa.Integer, nullable=False, default=0)
    rating: so.Mapped[float | None] = so.mapped_column(sa.DECIMAL(3, 2), default=0.0)
    total_questions: so.Mapped[int] = so.mapped_column(sa.Integer, nullable=False, default=0)
    estimated_duration: so.Mapped[int] = so.mapped_column(sa.Integer, nullable=False, default=0) # duration in minutes
    tags: so.Mapped[str | None] = so.mapped_column(sa.Text()) # JSON array of tags
    
    # quiz series functionality (similar to tutorial series)
    series_type: so.Mapped[str] = so.mapped_column(sa.String(20), nullable=False, default='single', index=True)  # 'single' or 'series'
    parent_series_id: so.Mapped[int | None] = so.mapped_column(sa.ForeignKey('quizzes.id'), nullable=True, index=True)  # For quizzes within a series
    quiz_order: so.Mapped[int | None] = so.mapped_column(sa.Integer, nullable=True)  # Order within series
    quiz_title: so.Mapped[str | None] = so.mapped_column(sa.String(255))  # Individual quiz title
    quiz_description: so.Mapped[str | None] = so.mapped_column(sa.Text())  # Individual quiz description
    
    created_at: so.Mapped[datetime] = so.mapped_column(sa.DateTime, nullable=False, default=datetime.utcnow)
    updated_at: so.Mapped[datetime] = so.mapped_column(sa.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    category: so.Mapped['Category'] = so.relationship(back_populates='quizzes')
    questions: so.WriteOnlyMapped['QuizQuestion'] = so.relationship(back_populates='quiz', cascade='all, delete-orphan', passive_deletes=True)
    
    # quiz series relationships
    parent_series: so.Mapped[Optional['Quiz']] = so.relationship('Quiz', remote_side=[id], back_populates='series_quizzes')
    series_quizzes: so.WriteOnlyMapped[list['Quiz']] = so.relationship('Quiz', back_populates='parent_series', cascade='all, delete-orphan', passive_deletes=True)

    def __repr__(self) -> str:
        return f"<Quiz {self.title}>"


