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
    
    # Delete in reverse dependency order (fix foreign key constraint)
    db.session.query(QuizQuestion).delete()
    db.session.query(Quiz).delete()
    # Delete child tutorials first (videos), then parent tutorials (series)
    db.session.execute(text("DELETE FROM tutorials WHERE parent_series_id IS NOT NULL"))
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

    # Create exactly 10 categories with sequential IDs (consistent with admin manual insertion)
    print("Creating categories...")
    categories = [
        Category(public_id='CAT-20250101-0001', category_name='General', status='active'),
        Category(public_id='CAT-20250101-0002', category_name='Advanced', status='active'),
        Category(public_id='CAT-20250101-0003', category_name='Business', status='active'),
        Category(public_id='CAT-20250101-0004', category_name='Medical', status='active'),
        Category(public_id='CAT-20250101-0005', category_name='Technology', status='active'),
        Category(public_id='CAT-20250101-0006', category_name='Education', status='active'),
        Category(public_id='CAT-20250101-0007', category_name='Entertainment', status='active'),
        Category(public_id='CAT-20250101-0008', category_name='Sports', status='active'),
        Category(public_id='CAT-20250101-0009', category_name='Science', status='active'),
        Category(public_id='CAT-20250101-0010', category_name='Arts', status='active')
    ]
    db.session.add_all(categories)
    db.session.flush()
    print("10 categories created")

    # Create exactly 10 tutorials with all fields filled (consistent with admin manual insertion)
    print("Creating tutorials...")
    from datetime import datetime
    
    tutorials = [
        Tutorial(
            public_id='TUT-20250101-0001',
            category_id=categories[0].id,
            title='Can vs Cannot - Lip Reading Basics',
            description='Learn to distinguish between "can" and "cannot" in lip reading. This fundamental tutorial covers the subtle differences in mouth movements and facial expressions.',
            video_path='/uploads/tutorials/tut_can_vs_cannot.mp4',
            status='published',
            difficulty='beginner',
            author='Admin User',
            thumbnail_path='tutorials/thumbnails/can_vs_cannot.jpg',
            views=1250,
            rating=4.5,
            series_type='single',
            learning_objectives='["Master basic lip reading", "Recognize common words", "Understand facial expressions"]',
            prerequisites='["Basic English knowledge", "Good eyesight"]',
            tags='["lip reading", "basics", "beginner"]',
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        ),
        Tutorial(
            public_id='TUT-20250101-0002',
            category_id=categories[1].id,
            title='Vowel A vs E - Advanced Techniques',
            description='Master mouth shapes for vowels A and E. This intermediate tutorial focuses on precise lip positioning and tongue placement.',
            video_path='/uploads/tutorials/tut_vowel_a_e.mp4',
            status='published',
            difficulty='intermediate',
            author='Admin User',
            thumbnail_path='tutorials/thumbnails/vowel_a_e.jpg',
            views=890,
            rating=4.2,
            series_type='single',
            learning_objectives='["Master vowel recognition", "Understand mouth shapes", "Practice advanced techniques"]',
            prerequisites='["Basic lip reading knowledge", "Intermediate English"]',
            tags='["vowels", "advanced", "techniques"]',
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        ),
        Tutorial(
            public_id='TUT-20250101-0003',
            category_id=categories[0].id,
            title='Hello vs Hi - Greeting Recognition',
            description='Distinguish between different greeting words. Learn to identify common greetings through lip reading patterns.',
            video_path='/uploads/tutorials/tut_hello_hi.mp4',
            status='published',
            difficulty='beginner',
            author='Admin User',
            thumbnail_path='tutorials/thumbnails/hello_hi.jpg',
            views=2100,
            rating=4.7,
            series_type='single',
            learning_objectives='["Recognize greetings", "Understand social cues", "Practice daily interactions"]',
            prerequisites='["Basic English", "Social interaction skills"]',
            tags='["greetings", "social", "beginner"]',
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        ),
        Tutorial(
            public_id='TUT-20250101-0004',
            category_id=categories[2].id,
            title='Business Phrases - Professional Context',
            description='Advanced lip reading for business and professional environments. Covers common workplace phrases and expressions.',
            video_path='/uploads/tutorials/tut_business_phrases.mp4',
            status='published',
            difficulty='advanced',
            author='Admin User',
            thumbnail_path='tutorials/thumbnails/business_phrases.jpg',
            views=650,
            rating=4.8,
            series_type='single',
            learning_objectives='["Master business terminology", "Understand professional contexts", "Handle workplace communication"]',
            prerequisites='["Advanced lip reading", "Business English", "Professional experience"]',
            tags='["business", "professional", "workplace"]',
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        ),
        Tutorial(
            public_id='TUT-20250101-0005',
            category_id=categories[1].id,
            title='Complex Vowel Combinations',
            description='Master complex vowel combinations and diphthongs. Advanced techniques for experienced lip readers.',
            video_path='/uploads/tutorials/tut_complex_vowels.mp4',
            status='draft',
            difficulty='advanced',
            author='Admin User',
            thumbnail_path='tutorials/thumbnails/complex_vowels.jpg',
            views=0,
            rating=0.0,
            series_type='single',
            learning_objectives='["Master complex vowels", "Understand diphthongs", "Practice advanced techniques"]',
            prerequisites='["Advanced lip reading", "Vowel knowledge", "Expert level"]',
            tags='["vowels", "complex", "advanced"]',
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        ),
        Tutorial(
            public_id='TUT-20250101-0006',
            category_id=categories[3].id,
            title='Medical Terminology - Healthcare Context',
            description='Essential lip reading skills for medical professionals. Learn to recognize common medical terms and phrases.',
            video_path='/uploads/tutorials/tut_medical_terms.mp4',
            status='published',
            difficulty='intermediate',
            author='Admin User',
            thumbnail_path='tutorials/thumbnails/medical_terms.jpg',
            views=750,
            rating=4.6,
            series_type='single',
            learning_objectives='["Master medical terminology", "Understand healthcare contexts", "Improve patient communication"]',
            prerequisites='["Medical background", "Intermediate lip reading"]',
            tags='["medical", "healthcare", "terminology"]',
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        ),
        Tutorial(
            public_id='TUT-20250101-0007',
            category_id=categories[4].id,
            title='Technology Terms - Digital Communication',
            description='Modern lip reading for tech professionals. Master digital communication terms and technical vocabulary.',
            video_path='/uploads/tutorials/tut_tech_terms.mp4',
            status='published',
            difficulty='intermediate',
            author='Admin User',
            thumbnail_path='tutorials/thumbnails/tech_terms.jpg',
            views=920,
            rating=4.4,
            series_type='single',
            learning_objectives='["Master tech terminology", "Understand digital contexts", "Improve online communication"]',
            prerequisites='["Tech background", "Basic lip reading"]',
            tags='["technology", "digital", "communication"]',
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        ),
        Tutorial(
            public_id='TUT-20250101-0008',
            category_id=categories[5].id,
            title='Educational Phrases - Learning Context',
            description='Lip reading skills for educational environments. Master academic terms and classroom communication.',
            video_path='/uploads/tutorials/tut_education_phrases.mp4',
            status='published',
            difficulty='beginner',
            author='Admin User',
            thumbnail_path='tutorials/thumbnails/education_phrases.jpg',
            views=1100,
            rating=4.3,
            series_type='single',
            learning_objectives='["Master educational terms", "Understand academic contexts", "Improve classroom communication"]',
            prerequisites='["Educational background", "Basic lip reading"]',
            tags='["education", "academic", "classroom"]',
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        ),
        Tutorial(
            public_id='TUT-20250101-0009',
            category_id=categories[6].id,
            title='Entertainment Industry Terms',
            description='Lip reading for entertainment professionals. Learn industry-specific terminology and communication patterns.',
            video_path='/uploads/tutorials/tut_entertainment_terms.mp4',
            status='draft',
            difficulty='advanced',
            author='Admin User',
            thumbnail_path='tutorials/thumbnails/entertainment_terms.jpg',
            views=0,
            rating=0.0,
            series_type='single',
            learning_objectives='["Master entertainment terms", "Understand industry contexts", "Improve professional communication"]',
            prerequisites='["Entertainment background", "Advanced lip reading"]',
            tags='["entertainment", "industry", "professional"]',
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        ),
        Tutorial(
            public_id='TUT-20250101-0010',
            category_id=categories[7].id,
            title='Sports Commentary - Athletic Context',
            description='Lip reading for sports enthusiasts. Master sports terminology and commentary recognition.',
            video_path='/uploads/tutorials/tut_sports_commentary.mp4',
            status='published',
            difficulty='intermediate',
            author='Admin User',
            thumbnail_path='tutorials/thumbnails/sports_commentary.jpg',
            views=680,
            rating=4.1,
            series_type='single',
            learning_objectives='["Master sports terminology", "Understand athletic contexts", "Improve sports communication"]',
            prerequisites='["Sports background", "Intermediate lip reading"]',
            tags='["sports", "athletic", "commentary"]',
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
    ]
    
    db.session.add_all(tutorials)
    print("10 tutorials created with all fields filled")

    # Create exactly 10 quizzes with sequential IDs (consistent with admin manual insertion)
    print("Creating quizzes...")
    quizzes = [
        Quiz(public_id='QZ-20250101-0001', category_id=categories[0].id, title='General Lip Reading Quiz', status='active'),
        Quiz(public_id='QZ-20250101-0002', category_id=categories[1].id, title='Advanced Techniques Quiz', status='active'),
        Quiz(public_id='QZ-20250101-0003', category_id=categories[2].id, title='Business Communication Quiz', status='active'),
        Quiz(public_id='QZ-20250101-0004', category_id=categories[3].id, title='Medical Terms Quiz', status='active'),
        Quiz(public_id='QZ-20250101-0005', category_id=categories[4].id, title='Technology Terms Quiz', status='active'),
        Quiz(public_id='QZ-20250101-0006', category_id=categories[5].id, title='Educational Phrases Quiz', status='active'),
        Quiz(public_id='QZ-20250101-0007', category_id=categories[6].id, title='Entertainment Industry Quiz', status='active'),
        Quiz(public_id='QZ-20250101-0008', category_id=categories[7].id, title='Sports Commentary Quiz', status='active'),
        Quiz(public_id='QZ-20250101-0009', category_id=categories[8].id, title='Science Terminology Quiz', status='active'),
        Quiz(public_id='QZ-20250101-0010', category_id=categories[9].id, title='Arts and Culture Quiz', status='active')
    ]
    db.session.add_all(quizzes)
    db.session.flush()
    print("10 quizzes created")

    # Create exactly 10 quiz questions with sequential IDs (consistent with admin manual insertion)
    print("Creating quiz questions...")
    quiz_questions = [
        QuizQuestion(
            quiz_id=quizzes[0].id,
            video_clip_path='/uploads/quizzes/q1.mp4',
            correct_answer='see you tomorrow',
            incorrect_options='["see you later","are you tomorrow","see you soon"]',
        ),
        QuizQuestion(
            quiz_id=quizzes[1].id,
            video_clip_path='/uploads/quizzes/q2.mp4',
            correct_answer='i cannot go',
            incorrect_options='["i can go","i gone","i cannot going"]',
        ),
        QuizQuestion(
            quiz_id=quizzes[2].id,
            video_clip_path='/uploads/quizzes/q3.mp4',
            correct_answer='meeting',
            incorrect_options='["conference","presentation","discussion"]',
        ),
        QuizQuestion(
            quiz_id=quizzes[3].id,
            video_clip_path='/uploads/quizzes/q4.mp4',
            correct_answer='thank you',
            incorrect_options='["you are welcome","excuse me","please"]',
        ),
        QuizQuestion(
            quiz_id=quizzes[4].id,
            video_clip_path='/uploads/quizzes/q5.mp4',
            correct_answer='project',
            incorrect_options='["task","assignment","work"]',
        ),
        QuizQuestion(
            quiz_id=quizzes[5].id,
            video_clip_path='/uploads/quizzes/q6.mp4',
            correct_answer='classroom',
            incorrect_options='["lecture hall","study room","library"]',
        ),
        QuizQuestion(
            quiz_id=quizzes[6].id,
            video_clip_path='/uploads/quizzes/q7.mp4',
            correct_answer='performance',
            incorrect_options='["show","concert","play"]',
        ),
        QuizQuestion(
            quiz_id=quizzes[7].id,
            video_clip_path='/uploads/quizzes/q8.mp4',
            correct_answer='championship',
            incorrect_options='["tournament","competition","match"]',
        ),
        QuizQuestion(
            quiz_id=quizzes[8].id,
            video_clip_path='/uploads/quizzes/q9.mp4',
            correct_answer='experiment',
            incorrect_options='["research","study","test"]',
        ),
        QuizQuestion(
            quiz_id=quizzes[9].id,
            video_clip_path='/uploads/quizzes/q10.mp4',
            correct_answer='masterpiece',
            incorrect_options='["artwork","creation","painting"]',
        )
    ]
    db.session.add_all(quiz_questions)
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
        print("  - 10 categories created (consistent with admin manual insertion)")
        print("  - 10 tutorials created with all fields filled")
        print("  - 10 quizzes created")
        print("  - 10 quiz questions created")
        print("\nLogin credentials:")
        print("  - Admin: admin@example.com / 1234")
        print("  - User: user@example.com / 1234")
        print("\nFuture registrations will auto-increment from ID 3 onwards")


if __name__ == '__main__':
    main()