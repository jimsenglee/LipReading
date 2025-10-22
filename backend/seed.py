from flask import Flask
from dotenv import load_dotenv
import os
from werkzeug.security import generate_password_hash
from sqlalchemy import text

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
    # clear existing data completely (in correct order due to foreign keys)
    print("Clearing existing database data...")
    
    # Delete in reverse dependency order
    db.session.query(QuizQuestion).delete()
    db.session.query(Quiz).delete()
    db.session.query(Tutorial).delete()
    db.session.query(Category).delete()
    db.session.query(User).delete()
    db.session.query(Administrator).delete()
    db.session.query(Account).delete()
    
    # Reset auto-increment counters
    db.session.execute(text("ALTER TABLE accounts AUTO_INCREMENT = 1"))
    db.session.execute(text("ALTER TABLE users AUTO_INCREMENT = 1"))
    db.session.execute(text("ALTER TABLE administrators AUTO_INCREMENT = 1"))
    db.session.execute(text("ALTER TABLE categories AUTO_INCREMENT = 1"))
    db.session.execute(text("ALTER TABLE tutorials AUTO_INCREMENT = 1"))
    db.session.execute(text("ALTER TABLE quizzes AUTO_INCREMENT = 1"))
    db.session.execute(text("ALTER TABLE quiz_questions AUTO_INCREMENT = 1"))
    
    db.session.commit()
    print("Database cleared and reset to sequential IDs")
    
    # Create fresh accounts with proper password hashing (password: 1234)
    print("Creating fresh accounts...")
    
    admin = Administrator(
        public_id='ACC-A-20250101-0001',
        name='Admin User',
        email='admin@example.com',
        password_hash=generate_password_hash('1234'),
        account_type='Administrator',
        profile_image_path='profiles/avatar.jpg',  # Default avatar
    )
    
    user = User(
        public_id='ACC-U-20250101-0001',
        name='Demo User',
        email='user@example.com',
        password_hash=generate_password_hash('1234'),
        account_type='User',
        is_2fa_enabled=False,
        profile_image_path='profiles/avatar.jpg',  # Default avatar
    )
    
    db.session.add_all([admin, user])
    print("2 accounts created (1 admin, 1 user) with password: 1234")

    # Create categories with sequential IDs
    print("Creating categories...")
    cat_common = Category(public_id='CAT-20250101-0001', category_name='Common Phrases')
    cat_vowels = Category(public_id='CAT-20250101-0002', category_name='Vowels')
    cat_greetings = Category(public_id='CAT-20250101-0003', category_name='Greetings')
    db.session.add_all([cat_common, cat_vowels, cat_greetings])
    db.session.flush()
    print("Categories created")

    # Create tutorials with sequential IDs
    print("Creating tutorials...")
    tut1 = Tutorial(
        public_id='TUT-20250101-0001',
        category_id=cat_common.id,
        title='Can vs Cannot',
        description='Learn to distinguish between "can" and "cannot" in lip reading',
        video_path='/uploads/tutorials/tut_can_vs_cannot.mp4',
    )
    tut2 = Tutorial(
        public_id='TUT-20250101-0002',
        category_id=cat_vowels.id,
        title='Vowel A vs E',
        description='Master mouth shapes for vowels A and E',
        video_path='/uploads/tutorials/tut_vowel_a_e.mp4',
    )
    tut3 = Tutorial(
        public_id='TUT-20250101-0003',
        category_id=cat_greetings.id,
        title='Hello vs Hi',
        description='Distinguish between different greeting words',
        video_path='/uploads/tutorials/tut_hello_hi.mp4',
    )
    db.session.add_all([tut1, tut2, tut3])
    print("Tutorials created")

    # Create quizzes with sequential IDs
    print("Creating quizzes...")
    quiz1 = Quiz(public_id='QZ-20250101-0001', category_id=cat_common.id, title='Common Phrases Quiz')
    quiz2 = Quiz(public_id='QZ-20250101-0002', category_id=cat_vowels.id, title='Vowels Quiz')
    db.session.add_all([quiz1, quiz2])
    db.session.flush()
    print("Quizzes created")

    # Create quiz questions with sequential IDs
    print("Creating quiz questions...")
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
    q3 = QuizQuestion(
        quiz_id=quiz2.id,
        video_clip_path='/uploads/quizzes/q3.mp4',
        correct_answer='apple',
        incorrect_options='["orange","banana","grape"]',
    )
    db.session.add_all([q1, q2, q3])
    print("Quiz questions created")


def main() -> None:
    app: Flask = create_app()
    with app.app_context():
        seed_programmatic()
        db.session.commit()
        print("\nDatabase seeding completed successfully!")
        print("Summary:")
        print("  - All data cleared and IDs reset to sequential order")
        print("  - 2 accounts created (1 admin, 1 user) - password: 1234")
        print("  - 3 categories created")
        print("  - 3 tutorials created")
        print("  - 2 quizzes created")
        print("  - 3 quiz questions created")
        print("\nLogin credentials:")
        print("  - Admin: admin@example.com / 1234")
        print("  - User: user@example.com / 1234")
        print("\nFuture registrations will auto-increment from ID 3 onwards")


if __name__ == '__main__':
    main()


