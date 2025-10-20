import sqlalchemy as sa
import sqlalchemy.orm as so

from ..extensions import db


class NotificationSettings(db.Model):
    __tablename__ = 'notification_settings'

    user_id: so.Mapped[int] = so.mapped_column(sa.ForeignKey('users.id'), primary_key=True)
    reminder_frequency: so.Mapped[str] = so.mapped_column(sa.String(20), nullable=False, default='None')

    user: so.Mapped['User'] = so.relationship(back_populates='notification_settings')

    def __repr__(self) -> str:
        return f"<NotificationSettings user_id={self.user_id}>"


