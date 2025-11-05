from ..extensions import db  # re-export for convenience

# import models so alembic can detect them; order matters for inheritance
from .account import Account  # noqa: F401
from .user import User  # noqa: F401
from .administrator import Administrator  # noqa: F401
from .accessibility_settings import AccessibilitySettings  # noqa: F401
from .notification_settings import NotificationSettings  # noqa: F401
from .login_activity import LoginActivity  # noqa: F401
from .third_party_app import ThirdPartyApp  # noqa: F401
from .category import Category  # noqa: F401
from .tutorial import Tutorial  # noqa: F401
from .user_bookmark import user_bookmarks  # noqa: F401
from .quiz import Quiz  # noqa: F401
from .quiz_question import QuizQuestion  # noqa: F401
from .quiz_attempt import QuizAttempt  # noqa: F401
from .transcription import Transcription  # noqa: F401
from .practice_session import PracticeSession  # noqa: F401
from .practice_word import PracticeWord  # noqa: F401
from .feedback import Feedback  # noqa: F401
from .report import Report  # noqa: F401
from .review import Review  # noqa: F401
from .user_progress import UserProgress  # noqa: F401


