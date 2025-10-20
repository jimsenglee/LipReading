import sqlalchemy as sa
import sqlalchemy.orm as so

from ..extensions import db


class Tutorial(db.Model):
    __tablename__ = 'tutorials'

    id: so.Mapped[int] = so.mapped_column(primary_key=True, autoincrement=True)
    public_id: so.Mapped[str] = so.mapped_column(sa.String(20), unique=True, index=True)
    category_id: so.Mapped[int] = so.mapped_column(sa.ForeignKey('categories.id'), nullable=False, index=True)
    title: so.Mapped[str] = so.mapped_column(sa.String(255), nullable=False)
    description: so.Mapped[str | None] = so.mapped_column(sa.Text())
    video_path: so.Mapped[str] = so.mapped_column(sa.String(255), nullable=False)

    category: so.Mapped['Category'] = so.relationship(back_populates='tutorials')
    bookmarked_by: so.WriteOnlyMapped['User'] = so.relationship(
        secondary='user_bookmarks', back_populates='bookmarked_tutorials'
    )

    def __repr__(self) -> str:
        return f"<Tutorial {self.title}>"


