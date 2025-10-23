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
    cat_business = Category(public_id='CAT-20250101-0004', category_name='Business Communication')
    cat_education = Category(public_id='CAT-20250101-0005', category_name='Educational Content')
    cat_medical = Category(public_id='CAT-20250101-0006', category_name='Medical Terms')
    cat_technology = Category(public_id='CAT-20250101-0007', category_name='Technology Terms')
    cat_social = Category(public_id='CAT-20250101-0008', category_name='Social Interactions')
    db.session.add_all([cat_common, cat_vowels, cat_greetings, cat_business, cat_education, cat_medical, cat_technology, cat_social])
    db.session.flush()
    print("8 categories created")

    # Create tutorials with enhanced data
    print("Creating tutorials...")
    from datetime import datetime
    
    tut1 = Tutorial(
        public_id='TUT-20250101-0001',
        category_id=cat_common.id,
        title='Can vs Cannot - Lip Reading Basics',
        description='Learn to distinguish between "can" and "cannot" in lip reading. This fundamental tutorial covers the subtle differences in mouth movements and facial expressions.',
        video_path='/uploads/tutorials/tut_can_vs_cannot.mp4',
        status='published',
        difficulty='beginner',
        author='Admin User',
        thumbnail_path='tutorials/thumbnails/can_vs_cannot.jpg',
        views=1250,
        rating=4.5,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    tut2 = Tutorial(
        public_id='TUT-20250101-0002',
        category_id=cat_vowels.id,
        title='Vowel A vs E - Advanced Techniques',
        description='Master mouth shapes for vowels A and E. This intermediate tutorial focuses on precise lip positioning and tongue placement.',
        video_path='/uploads/tutorials/tut_vowel_a_e.mp4',
        status='published',
        difficulty='intermediate',
        author='Admin User',
        thumbnail_path='tutorials/thumbnails/vowel_a_e.jpg',
        views=890,
        rating=4.2,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    tut3 = Tutorial(
        public_id='TUT-20250101-0003',
        category_id=cat_greetings.id,
        title='Hello vs Hi - Greeting Recognition',
        description='Distinguish between different greeting words. Learn to identify common greetings through lip reading patterns.',
        video_path='/uploads/tutorials/tut_hello_hi.mp4',
        status='published',
        difficulty='beginner',
        author='Admin User',
        thumbnail_path='tutorials/thumbnails/hello_hi.jpg',
        views=2100,
        rating=4.7,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    tut4 = Tutorial(
        public_id='TUT-20250101-0004',
        category_id=cat_common.id,
        title='Business Phrases - Professional Context',
        description='Advanced lip reading for business and professional environments. Covers common workplace phrases and expressions.',
        video_path='/uploads/tutorials/tut_business_phrases.mp4',
        status='published',
        difficulty='advanced',
        author='Admin User',
        thumbnail_path='tutorials/thumbnails/business_phrases.jpg',
        views=650,
        rating=4.8,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    tut5 = Tutorial(
        public_id='TUT-20250101-0005',
        category_id=cat_vowels.id,
        title='Complex Vowel Combinations',
        description='Master complex vowel combinations and diphthongs. Advanced techniques for experienced lip readers.',
        video_path='/uploads/tutorials/tut_complex_vowels.mp4',
        status='draft',
        difficulty='advanced',
        author='Admin User',
        thumbnail_path='tutorials/thumbnails/complex_vowels.jpg',
        views=0,
        rating=0.0,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    tut6 = Tutorial(
        public_id='TUT-20250101-0006',
        category_id=cat_greetings.id,
        title='Cultural Greetings - International Context',
        description='Learn to recognize greetings from different cultures and languages through lip reading.',
        video_path='/uploads/tutorials/tut_cultural_greetings.mp4',
        status='published',
        difficulty='intermediate',
        author='Admin User',
        thumbnail_path='tutorials/thumbnails/cultural_greetings.jpg',
        views=420,
        rating=4.3,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    tut7 = Tutorial(
        public_id='TUT-20250101-0007',
        category_id=cat_business.id,
        title='Professional Meeting Phrases',
        description='Essential business communication phrases for meetings and presentations.',
        video_path='/uploads/tutorials/tut_business_meetings.mp4',
        status='published',
        difficulty='intermediate',
        author='Admin User',
        thumbnail_path='tutorials/thumbnails/business_meetings.jpg',
        views=680,
        rating=4.6,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    tut8 = Tutorial(
        public_id='TUT-20250101-0008',
        category_id=cat_education.id,
        title='Academic Vocabulary Recognition',
        description='Advanced lip reading for educational and academic contexts.',
        video_path='/uploads/tutorials/tut_academic_vocab.mp4',
        status='published',
        difficulty='advanced',
        author='Admin User',
        thumbnail_path='tutorials/thumbnails/academic_vocab.jpg',
        views=320,
        rating=4.4,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    tut9 = Tutorial(
        public_id='TUT-20250101-0009',
        category_id=cat_medical.id,
        title='Medical Terminology Basics',
        description='Learn to recognize common medical terms through lip reading.',
        video_path='/uploads/tutorials/tut_medical_terms.mp4',
        status='published',
        difficulty='advanced',
        author='Admin User',
        thumbnail_path='tutorials/thumbnails/medical_terms.jpg',
        views=450,
        rating=4.7,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    tut10 = Tutorial(
        public_id='TUT-20250101-0010',
        category_id=cat_technology.id,
        title='Tech Industry Jargon',
        description='Modern technology terms and industry-specific vocabulary.',
        video_path='/uploads/tutorials/tut_tech_jargon.mp4',
        status='published',
        difficulty='intermediate',
        author='Admin User',
        thumbnail_path='tutorials/thumbnails/tech_jargon.jpg',
        views=890,
        rating=4.5,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.session.add_all([tut1, tut2, tut3, tut4, tut5, tut6, tut7, tut8, tut9, tut10])
    print("10 tutorials created with enhanced data")

    # Create quizzes with sequential IDs
    print("Creating quizzes...")
    quiz1 = Quiz(public_id='QZ-20250101-0001', category_id=cat_common.id, title='Common Phrases Quiz')
    quiz2 = Quiz(public_id='QZ-20250101-0002', category_id=cat_vowels.id, title='Vowels Quiz')
    quiz3 = Quiz(public_id='QZ-20250101-0003', category_id=cat_greetings.id, title='Greetings Recognition Quiz')
    quiz4 = Quiz(public_id='QZ-20250101-0004', category_id=cat_business.id, title='Business Communication Quiz')
    quiz5 = Quiz(public_id='QZ-20250101-0005', category_id=cat_education.id, title='Academic Vocabulary Quiz')
    quiz6 = Quiz(public_id='QZ-20250101-0006', category_id=cat_medical.id, title='Medical Terms Quiz')
    quiz7 = Quiz(public_id='QZ-20250101-0007', category_id=cat_technology.id, title='Technology Terms Quiz')
    quiz8 = Quiz(public_id='QZ-20250101-0008', category_id=cat_social.id, title='Social Interactions Quiz')
    db.session.add_all([quiz1, quiz2, quiz3, quiz4, quiz5, quiz6, quiz7, quiz8])
    db.session.flush()
    print("8 quizzes created")

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
    q4 = QuizQuestion(
        quiz_id=quiz2.id,
        video_clip_path='/uploads/quizzes/q4.mp4',
        correct_answer='hello',
        incorrect_options='["hi","hey","goodbye"]',
    )
    q5 = QuizQuestion(
        quiz_id=quiz3.id,
        video_clip_path='/uploads/quizzes/q5.mp4',
        correct_answer='good morning',
        incorrect_options='["good evening","good afternoon","good night"]',
    )
    q6 = QuizQuestion(
        quiz_id=quiz3.id,
        video_clip_path='/uploads/quizzes/q6.mp4',
        correct_answer='thank you',
        incorrect_options='["you are welcome","excuse me","please"]',
    )
    q7 = QuizQuestion(
        quiz_id=quiz4.id,
        video_clip_path='/uploads/quizzes/q7.mp4',
        correct_answer='meeting',
        incorrect_options='["conference","presentation","discussion"]',
    )
    q8 = QuizQuestion(
        quiz_id=quiz4.id,
        video_clip_path='/uploads/quizzes/q8.mp4',
        correct_answer='project',
        incorrect_options='["task","assignment","work"]',
    )
    q9 = QuizQuestion(
        quiz_id=quiz5.id,
        video_clip_path='/uploads/quizzes/q9.mp4',
        correct_answer='research',
        incorrect_options='["study","analysis","investigation"]',
    )
    q10 = QuizQuestion(
        quiz_id=quiz5.id,
        video_clip_path='/uploads/quizzes/q10.mp4',
        correct_answer='education',
        incorrect_options='["learning","training","instruction"]',
    )
    db.session.add_all([q1, q2, q3, q4, q5, q6, q7, q8, q9, q10])
    print("10 quiz questions created")


def main() -> None:
    app: Flask = create_app()
    with app.app_context():
        seed_programmatic()
        db.session.commit()
        print("\nDatabase seeding completed successfully!")
        print("Summary:")
        print("  - All data cleared and IDs reset to sequential order")
        print("  - 2 accounts created (1 admin, 1 user) - password: 1234")
        print("  - 8 categories created")
        print("  - 10 tutorials created with enhanced data")
        print("  - 8 quizzes created")
        print("  - 10 quiz questions created")
        print("\nLogin credentials:")
        print("  - Admin: admin@example.com / 1234")
        print("  - User: user@example.com / 1234")
        print("\nFuture registrations will auto-increment from ID 3 onwards")


if __name__ == '__main__':
    main()


