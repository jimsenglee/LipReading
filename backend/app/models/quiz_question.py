import sqlalchemy as sa
import sqlalchemy.orm as so

from ..extensions import db


class QuizQuestion(db.Model):
    __tablename__ = 'quiz_questions'

    id: so.Mapped[int] = so.mapped_column(primary_key=True, autoincrement=True)
    quiz_id: so.Mapped[int] = so.mapped_column(sa.ForeignKey('quizzes.id'), nullable=False, index=True)
    video_clip_path: so.Mapped[str] = so.mapped_column(sa.String(255), nullable=False)
    correct_answer: so.Mapped[str] = so.mapped_column(sa.String(255), nullable=False)
    incorrect_options: so.Mapped[str] = so.mapped_column(sa.Text(), nullable=False)

    quiz: so.Mapped['Quiz'] = so.relationship(back_populates='questions')

    def __repr__(self) -> str:
        return f"<QuizQuestion id={self.id} quiz_id={self.quiz_id}>"


