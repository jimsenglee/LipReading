"""
Practice Word model for real-time lip reading practice
Following README.txt separation of concerns
"""
import sqlalchemy as sa
import sqlalchemy.orm as so
from datetime import datetime
from typing import TYPE_CHECKING

from ..extensions import db

if TYPE_CHECKING:
    from .category import Category


class PracticeWord(db.Model):
    __tablename__ = 'practice_words'

    id: so.Mapped[int] = so.mapped_column(primary_key=True, autoincrement=True)
    public_id: so.Mapped[str] = so.mapped_column(sa.String(20), unique=True, index=True)
    category_id: so.Mapped[int] = so.mapped_column(sa.ForeignKey('categories.id'), nullable=False, index=True)
    
    # word details
    word: so.Mapped[str] = so.mapped_column(sa.String(255), nullable=False)
    phonetics: so.Mapped[str | None] = so.mapped_column(sa.String(255))  # e.g., /həˈloʊ/
    description: so.Mapped[str | None] = so.mapped_column(sa.Text())  # contextual description
    
    # video reference
    video_path: so.Mapped[str] = so.mapped_column(sa.String(255), nullable=False)  # path to demonstration video
    
    # metadata
    difficulty: so.Mapped[str] = so.mapped_column(sa.String(20), nullable=False, default='beginner', index=True)  # beginner, intermediate, advanced
    status: so.Mapped[str] = so.mapped_column(sa.String(20), nullable=False, default='active', index=True)
    sort_order: so.Mapped[int] = so.mapped_column(sa.Integer, nullable=False, default=0)
    
    # timestamps
    created_at: so.Mapped[datetime] = so.mapped_column(sa.DateTime, nullable=False, default=datetime.utcnow)
    updated_at: so.Mapped[datetime] = so.mapped_column(sa.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # relationships
    category: so.Mapped['Category'] = so.relationship(back_populates='practice_words')

    def __repr__(self) -> str:
        return f"<PracticeWord {self.word}>"

