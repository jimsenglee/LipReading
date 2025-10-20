import sqlalchemy as sa
import sqlalchemy.orm as so

from ..extensions import db
from .account import Account


class User(Account):
    __tablename__ = 'users'

    id: so.Mapped[int] = so.mapped_column(sa.ForeignKey('accounts.id'), primary_key=True)
    is_2fa_enabled: so.Mapped[bool] = so.mapped_column(sa.Boolean(), nullable=False, default=False)

    # relationships
    accessibility_settings: so.Mapped['AccessibilitySettings'] = so.relationship(back_populates='user', uselist=False)
    notification_settings: so.Mapped['NotificationSettings'] = so.relationship(back_populates='user', uselist=False)
    login_activity: so.WriteOnlyMapped['LoginActivity'] = so.relationship(back_populates='user', cascade='all, delete-orphan')
    connected_apps: so.WriteOnlyMapped['ThirdPartyApp'] = so.relationship(back_populates='user', cascade='all, delete-orphan')
    transcriptions: so.WriteOnlyMapped['Transcription'] = so.relationship(back_populates='user', cascade='all, delete-orphan')
    practice_sessions: so.WriteOnlyMapped['PracticeSession'] = so.relationship(back_populates='user', cascade='all, delete-orphan')
    quiz_attempts: so.WriteOnlyMapped['QuizAttempt'] = so.relationship(back_populates='user', cascade='all, delete-orphan')

    # bookmarks many-to-many via association table declared in user_bookmark.py
    bookmarked_tutorials: so.WriteOnlyMapped['Tutorial'] = so.relationship(
        secondary='user_bookmarks', back_populates='bookmarked_by'
    )

    __mapper_args__ = {
        'polymorphic_identity': 'User',
    }

    def __repr__(self) -> str:
        return f"<User {self.email}>"


