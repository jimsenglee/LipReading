from datetime import datetime
from typing import Optional
import sqlalchemy as sa
import sqlalchemy.orm as so

from ..extensions import db

# Forward references for type hints
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from .category import Category
    from .user import User


class Tutorial(db.Model):
    __tablename__ = 'tutorials'

    id: so.Mapped[int] = so.mapped_column(primary_key=True, autoincrement=True)
    public_id: so.Mapped[str] = so.mapped_column(sa.String(20), unique=True, index=True)
    category_id: so.Mapped[int] = so.mapped_column(sa.ForeignKey('categories.id'), nullable=False, index=True)
    title: so.Mapped[str] = so.mapped_column(sa.String(255), nullable=False)
    description: so.Mapped[str | None] = so.mapped_column(sa.Text())
    video_path: so.Mapped[str] = so.mapped_column(sa.String(255), nullable=False)
    subtitle_path: so.Mapped[Optional[str]] = so.mapped_column(sa.String(255))  # subtitle file path for educational video player
    
    # enhanced fields for tutorial series functionality
    status: so.Mapped[str] = so.mapped_column(sa.String(20), nullable=False, default='draft', index=True)
    difficulty: so.Mapped[str] = so.mapped_column(sa.String(20), nullable=False, default='beginner', index=True)
    author: so.Mapped[str] = so.mapped_column(sa.String(255), nullable=False, default='System')
    thumbnail_path: so.Mapped[Optional[str]] = so.mapped_column(sa.String(255))
    views: so.Mapped[int] = so.mapped_column(sa.Integer, nullable=False, default=0)
    rating: so.Mapped[Optional[float]] = so.mapped_column(sa.DECIMAL(3, 2), default=0.0)
    created_at: so.Mapped[datetime] = so.mapped_column(sa.DateTime, nullable=False, default=datetime.utcnow)
    updated_at: so.Mapped[datetime] = so.mapped_column(sa.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # NEW FIELDS FOR TUTORIAL SERIES (Udemy-like functionality)
    series_type: so.Mapped[str] = so.mapped_column(sa.String(20), nullable=False, default='single', index=True)  # 'single' or 'series'
    parent_series_id: so.Mapped[Optional[int]] = so.mapped_column(sa.ForeignKey('tutorials.id'), nullable=True, index=True)  # For videos within a series
    video_order: so.Mapped[Optional[int]] = so.mapped_column(sa.Integer, nullable=True)  # Order within series
    video_title: so.Mapped[Optional[str]] = so.mapped_column(sa.String(255))  # Individual video title
    video_description: so.Mapped[Optional[str]] = so.mapped_column(sa.Text())  # Individual video description
    video_duration: so.Mapped[Optional[int]] = so.mapped_column(sa.Integer, nullable=True)  # Duration in seconds
    learning_objectives: so.Mapped[Optional[str]] = so.mapped_column(sa.Text())  # JSON array of objectives
    prerequisites: so.Mapped[Optional[str]] = so.mapped_column(sa.Text())  # JSON array of prerequisites
    tags: so.Mapped[Optional[str]] = so.mapped_column(sa.Text())  # JSON array of tags
    is_preview: so.Mapped[bool] = so.mapped_column(sa.Boolean, nullable=False, default=False)  # Free preview video

    category: so.Mapped['Category'] = so.relationship(back_populates='tutorials')
    bookmarked_by: so.WriteOnlyMapped['User'] = so.relationship(
        secondary='user_bookmarks', back_populates='bookmarked_tutorials'
    )
    
    # NEW RELATIONSHIPS FOR TUTORIAL SERIES
    parent_series: so.Mapped[Optional['Tutorial']] = so.relationship('Tutorial', remote_side=[id], back_populates='series_videos')
    series_videos: so.WriteOnlyMapped[list['Tutorial']] = so.relationship('Tutorial', back_populates='parent_series', cascade='all, delete-orphan', passive_deletes=True)

    def __repr__(self) -> str:
        return f"<Tutorial {self.title}>"


