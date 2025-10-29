from datetime import datetime
from typing import Optional, TYPE_CHECKING
import sqlalchemy as sa
import sqlalchemy.orm as so

from ..extensions import db

if TYPE_CHECKING:
    from .accessibility_settings import AccessibilitySettings
    from .notification_settings import NotificationSettings
    from .login_activity import LoginActivity
    from .third_party_app import ThirdPartyApp
    from .transcription import Transcription
    from .practice_session import PracticeSession
    from .quiz_attempt import QuizAttempt
    from .tutorial import Tutorial


class Account(db.Model):
    __tablename__ = 'accounts'

    id: so.Mapped[int] = so.mapped_column(primary_key=True, autoincrement=True)
    public_id: so.Mapped[str] = so.mapped_column(sa.String(64), unique=True, index=True)
    name: so.Mapped[str] = so.mapped_column(sa.String(255), nullable=False)
    email: so.Mapped[str] = so.mapped_column(sa.String(255), nullable=False, unique=True, index=True)
    password_hash: so.Mapped[str] = so.mapped_column(sa.String(255), nullable=False)
    profile_image_path: so.Mapped[Optional[str]] = so.mapped_column(sa.String(255))
    registration_date: so.Mapped[datetime] = so.mapped_column(sa.DateTime(), nullable=False, default=datetime.utcnow)
    account_type: so.Mapped[str] = so.mapped_column(sa.String(20), nullable=False, index=True)
    status: so.Mapped[str] = so.mapped_column(sa.String(20), nullable=False, default='active', index=True)

    # relationships - these will be overridden in subclasses
    accessibility_settings: so.Mapped['AccessibilitySettings'] = so.relationship(back_populates='user', uselist=False)
    notification_settings: so.Mapped['NotificationSettings'] = so.relationship(back_populates='user', uselist=False)
    login_activity: so.WriteOnlyMapped['LoginActivity'] = so.relationship(back_populates='user', cascade='all, delete-orphan')
    connected_apps: so.WriteOnlyMapped['ThirdPartyApp'] = so.relationship(back_populates='user', cascade='all, delete-orphan')
    transcriptions: so.WriteOnlyMapped['Transcription'] = so.relationship(back_populates='user', cascade='all, delete-orphan')
    practice_sessions: so.WriteOnlyMapped['PracticeSession'] = so.relationship(back_populates='user', cascade='all, delete-orphan')
    quiz_attempts: so.WriteOnlyMapped['QuizAttempt'] = so.relationship(back_populates='user', cascade='all, delete-orphan')
    bookmarked_tutorials: so.WriteOnlyMapped['Tutorial'] = so.relationship(
        secondary='user_bookmarks', back_populates='bookmarked_by'
    )

    __mapper_args__ = {
        'polymorphic_on': account_type,
        'polymorphic_identity': 'account',
    }

    def __repr__(self) -> str:
        return f"<Account {self.email}>"


