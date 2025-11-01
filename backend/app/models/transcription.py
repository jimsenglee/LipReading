from datetime import datetime
import sqlalchemy as sa
import sqlalchemy.orm as so
from typing import TYPE_CHECKING

from ..extensions import db

if TYPE_CHECKING:
    from .user import User


class Transcription(db.Model):
    __tablename__ = 'transcriptions'

    id: so.Mapped[int] = so.mapped_column(primary_key=True, autoincrement=True)
    public_id: so.Mapped[str] = so.mapped_column(sa.String(25), unique=True, index=True)
    user_id: so.Mapped[int] = so.mapped_column(sa.ForeignKey('accounts.id'), nullable=False, index=True)
    title: so.Mapped[str] = so.mapped_column(sa.String(255), nullable=False)
    content_text: so.Mapped[str | None] = so.mapped_column(sa.Text())
    timestamps_json: so.Mapped[str | None] = so.mapped_column(sa.Text())
    creation_date: so.Mapped[datetime] = so.mapped_column(sa.DateTime(), nullable=False, default=datetime.utcnow)
    video_source_path: so.Mapped[str | None] = so.mapped_column(sa.String(255))
    
    # AI processing fields
    processing_status: so.Mapped[str] = so.mapped_column(sa.String(20), nullable=False, default='pending', index=True)
    gdrive_file_id: so.Mapped[str | None] = so.mapped_column(sa.String(255), index=True)
    colab_job_id: so.Mapped[str | None] = so.mapped_column(sa.String(255), index=True)
    processed_at: so.Mapped[datetime | None] = so.mapped_column(sa.DateTime())
    duration_seconds: so.Mapped[int | None] = so.mapped_column(sa.Integer)

    user: so.Mapped['User'] = so.relationship(back_populates='transcriptions')

    def __repr__(self) -> str:
        return f"<Transcription {self.title}>"


