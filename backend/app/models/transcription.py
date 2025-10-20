from datetime import datetime
import sqlalchemy as sa
import sqlalchemy.orm as so

from ..extensions import db


class Transcription(db.Model):
    __tablename__ = 'transcriptions'

    id: so.Mapped[int] = so.mapped_column(primary_key=True, autoincrement=True)
    public_id: so.Mapped[str] = so.mapped_column(sa.String(25), unique=True, index=True)
    user_id: so.Mapped[int] = so.mapped_column(sa.ForeignKey('users.id'), nullable=False, index=True)
    title: so.Mapped[str] = so.mapped_column(sa.String(255), nullable=False)
    content_text: so.Mapped[str | None] = so.mapped_column(sa.Text())
    timestamps_json: so.Mapped[str | None] = so.mapped_column(sa.Text())
    creation_date: so.Mapped[datetime] = so.mapped_column(sa.DateTime(), nullable=False, default=datetime.utcnow)
    video_source_path: so.Mapped[str | None] = so.mapped_column(sa.String(255))

    user: so.Mapped['User'] = so.relationship(back_populates='transcriptions')

    def __repr__(self) -> str:
        return f"<Transcription {self.title}>"


