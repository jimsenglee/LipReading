import sqlalchemy as sa
import sqlalchemy.orm as so

from ..extensions import db


class AccessibilitySettings(db.Model):
    __tablename__ = 'accessibility_settings'

    user_id: so.Mapped[int] = so.mapped_column(sa.ForeignKey('users.id'), primary_key=True)
    font_size: so.Mapped[str] = so.mapped_column(sa.String(20), nullable=False, default='Medium')
    theme: so.Mapped[str] = so.mapped_column(sa.String(20), nullable=False, default='Light')

    user: so.Mapped['User'] = so.relationship(back_populates='accessibility_settings')

    def __repr__(self) -> str:
        return f"<AccessibilitySettings user_id={self.user_id}>"


