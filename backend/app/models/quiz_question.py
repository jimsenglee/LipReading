import sqlalchemy as sa
import sqlalchemy.orm as so
from typing import TYPE_CHECKING

from ..extensions import db

if TYPE_CHECKING:
    from .quiz import Quiz


class QuizQuestion(db.Model):
    __tablename__ = 'quiz_questions'

    id: so.Mapped[int] = so.mapped_column(primary_key=True, autoincrement=True)
    quiz_id: so.Mapped[int] = so.mapped_column(sa.ForeignKey('quizzes.id'), nullable=False, index=True)
    
    # polymorphic question type support
    question_type: so.Mapped[str] = so.mapped_column(sa.String(20), nullable=False, default='video_mcq', index=True)  # 'video_mcq', 'true_false'
    question_text: so.Mapped[str | None] = so.mapped_column(sa.Text())  # for 'true_false' type questions
    points: so.Mapped[int] = so.mapped_column(sa.Integer, nullable=False, default=1)
    explanation: so.Mapped[str | None] = so.mapped_column(sa.Text())  # optional explanation shown in results
    
    # video_mcq specific fields (optional for polymorphic support)
    video_clip_path: so.Mapped[str | None] = so.mapped_column(sa.String(255))  # optional, required only for video_mcq
    correct_answer: so.Mapped[str] = so.mapped_column(sa.String(255), nullable=False)  # required for all types
    incorrect_options: so.Mapped[str | None] = so.mapped_column(sa.Text())  # optional, JSON array for video_mcq only

    quiz: so.Mapped['Quiz'] = so.relationship(back_populates='questions')

    def __repr__(self) -> str:
        return f"<QuizQuestion id={self.id} quiz_id={self.quiz_id} type={self.question_type}>"


