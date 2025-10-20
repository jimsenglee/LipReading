from flask import jsonify, request
import sqlalchemy as sa

from ..extensions import db
from ..models import Quiz, QuizQuestion
from . import bp


@bp.get('/quizzes')
def list_quizzes():
    category_id = request.args.get('categoryId', type=int)
    stmt = sa.select(Quiz)
    if category_id:
        stmt = stmt.where(Quiz.category_id == category_id)
    stmt = stmt.order_by(Quiz.title)
    rows = db.session.scalars(stmt).all()
    return jsonify([
        {
            'id': q.id,
            'publicId': q.public_id,
            'categoryId': q.category_id,
            'title': q.title,
        }
        for q in rows
    ])


@bp.get('/quizzes/<int:quiz_id>/questions')
def get_quiz_questions(quiz_id: int):
    rows = db.session.scalars(
        sa.select(QuizQuestion).where(QuizQuestion.quiz_id == quiz_id)
    ).all()
    return jsonify([
        {
            'id': r.id,
            'quizId': r.quiz_id,
            'videoClipPath': r.video_clip_path,
            'correctAnswer': r.correct_answer,
            'incorrectOptions': r.incorrect_options,
        }
        for r in rows
    ])


