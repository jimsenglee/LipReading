from flask import Flask
from dotenv import load_dotenv
import os

# load env before importing the app so SQLALCHEMY_DATABASE_URI has password
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.flaskenv'))

from app import create_app
from app.extensions import db
from app.models import (
    Account,
    User,
    Administrator,
    Category,
    Tutorial,
    Quiz,
    QuizQuestion,
)


def seed_programmatic() -> None:
    # accounts
    admin = Administrator(
        public_id='ACC-A-20250101-0001',
        name='admin user',
        email='admin@example.com',
        password_hash='placeholder-hash',
        account_type='Administrator',
    )
    user = User(
        public_id='ACC-U-20250101-0001',
        name='demo user',
        email='user@example.com',
        password_hash='placeholder-hash',
        account_type='User',
        is_2fa_enabled=False,
    )
    db.session.add_all([admin, user])

    # categories
    cat_common = Category(public_id='CAT-0001', category_name='common phrases')
    cat_vowels = Category(public_id='CAT-0002', category_name='vowels')
    db.session.add_all([cat_common, cat_vowels])
    db.session.flush()

    # tutorials
    tut1 = Tutorial(
        public_id='TUT-0001',
        category_id=cat_common.id,
        title='can vs cannot',
        description='learn to distinguish can vs cannot',
        video_path='/uploads/tutorials/tut_can_vs_cannot.mp4',
    )
    tut2 = Tutorial(
        public_id='TUT-0002',
        category_id=cat_vowels.id,
        title='vowel a vs e',
        description='mouth shapes for a and e',
        video_path='/uploads/tutorials/tut_vowel_a_e.mp4',
    )
    db.session.add_all([tut1, tut2])

    # quizzes
    quiz1 = Quiz(public_id='QZ-0001', category_id=cat_common.id, title='common phrases quiz')
    db.session.add(quiz1)
    db.session.flush()

    # quiz questions
    q1 = QuizQuestion(
        quiz_id=quiz1.id,
        video_clip_path='/uploads/quizzes/q1.mp4',
        correct_answer='see you tomorrow',
        incorrect_options='["see you later","are you tomorrow","see you soon"]',
    )
    q2 = QuizQuestion(
        quiz_id=quiz1.id,
        video_clip_path='/uploads/quizzes/q2.mp4',
        correct_answer='i cannot go',
        incorrect_options='["i can go","i gone","i cannot going"]',
    )
    db.session.add_all([q1, q2])


def main() -> None:
    app: Flask = create_app()
    with app.app_context():
        seed_programmatic()
        db.session.commit()


if __name__ == '__main__':
    main()


