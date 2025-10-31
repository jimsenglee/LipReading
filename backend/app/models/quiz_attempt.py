from datetime import datetime
import sqlalchemy as sa
import sqlalchemy.orm as so
from typing import TYPE_CHECKING

from ..extensions import db

if TYPE_CHECKING:
    from .user import User
    from .quiz import Quiz


class QuizAttempt(db.Model):
    __tablename__ = 'quiz_attempts'

    id: so.Mapped[int] = so.mapped_column(primary_key=True, autoincrement=True)
    public_id: so.Mapped[str] = so.mapped_column(sa.String(25), unique=True, index=True)
    user_id: so.Mapped[int] = so.mapped_column(sa.ForeignKey('accounts.id'), nullable=False, index=True)
    quiz_id: so.Mapped[int] = so.mapped_column(sa.ForeignKey('quizzes.id'), nullable=False, index=True)
    
    # attempt tracking
    attempt_number: so.Mapped[int] = so.mapped_column(sa.Integer, nullable=False)
    score: so.Mapped[float] = so.mapped_column(sa.Float(), nullable=False)  # percentage score (e.g., 85.0)
    passed: so.Mapped[bool] = so.mapped_column(sa.Boolean, nullable=False)  # true if score >= passing_score
    answers_json: so.Mapped[str | None] = so.mapped_column(sa.Text())  # JSON object mapping question_id to user answer
    completion_date: so.Mapped[datetime] = so.mapped_column(sa.DateTime(), nullable=False, default=datetime.utcnow)

    user: so.Mapped['User'] = so.relationship(back_populates='quiz_attempts')
    quiz: so.Mapped['Quiz'] = so.relationship()

    def __repr__(self) -> str:
        return f"<QuizAttempt user_id={self.user_id} quiz_id={self.quiz_id} attempt={self.attempt_number} score={self.score} passed={self.passed}>"


