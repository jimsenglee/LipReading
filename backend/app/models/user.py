import sqlalchemy as sa
import sqlalchemy.orm as so
from typing import TYPE_CHECKING

from ..extensions import db
from .account import Account

if TYPE_CHECKING:
    from .accessibility_settings import AccessibilitySettings
    from .notification_settings import NotificationSettings
    from .login_activity import LoginActivity
    from .third_party_app import ThirdPartyApp
    from .transcription import Transcription
    from .practice_session import PracticeSession
    from .quiz_attempt import QuizAttempt
    from .tutorial import Tutorial


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

    # Flask-Login required methods
    def is_authenticated(self) -> bool:
        """return True if the user is authenticated, i.e. they have provided valid credentials"""
        return True

    def is_active(self) -> bool:
        """return True if this is an active user - in addition to being authenticated, they also have activated their account"""
        return True

    def is_anonymous(self) -> bool:
        """return True if this is an anonymous user"""
        return False

    def get_id(self) -> str:
        """return a unique identifier for this user, in unicode format"""
        return str(self.id)

    def check_password(self, password: str) -> bool:
        """check if the provided password matches the user's password hash"""
        from werkzeug.security import check_password_hash
        return check_password_hash(self.password_hash, password)

    def __repr__(self) -> str:
        return f"<User {self.email}>"


