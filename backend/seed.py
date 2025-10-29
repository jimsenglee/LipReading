from flask import Flask
from dotenv import load_dotenv
import os
from werkzeug.security import generate_password_hash
from sqlalchemy import text
import random
from datetime import datetime, timedelta

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
    
    admin = Administrator()
    admin.public_id = 'ACC-A-20250101-0001'
    admin.name = 'Admin User'
    admin.email = 'admin@example.com'
    admin.password_hash = generate_password_hash('1234')
    admin.account_type = 'Administrator'
    admin.profile_image_path = 'profiles/avatar.jpg'  # Default avatar
    
    user = User()
    user.public_id = 'ACC-U-20250101-0001'
    user.name = 'Demo User'
    user.email = 'user@example.com'
    user.password_hash = generate_password_hash('1234')
    user.account_type = 'User'
    user.is_2fa_enabled = False
    user.profile_image_path = 'profiles/avatar.jpg'  # Default avatar
    
    db.session.add_all([admin, user])
    print("2 accounts created (1 admin, 1 user) with password: 1234")

    # Create exactly 10 categories with sequential IDs (consistent with admin manual insertion)
    print("Creating categories...")
    categories = []
    category_names = ['General', 'Advanced', 'Business', 'Medical', 'Technology', 'Education', 'Entertainment', 'Sports', 'Science', 'Arts']
    
    for i, name in enumerate(category_names, 1):
        category = Category()
        category.public_id = f'CAT-20250101-{str(i).zfill(4)}'
        category.category_name = name
        category.status = 'active'
        categories.append(category)
    db.session.add_all(categories)
    db.session.flush()
    print("10 categories created")

    # Create exactly 10 tutorials using existing upload files (1-10)
    print("Creating tutorials with existing upload files...")
    
    # tutorial titles based on YouTube Lip Reading Challenge series
    tutorial_titles = [
        'Lip Reading Challenge DAY 1: PBM substitution practice and invisible sounds',
        'Lip Reading Challenge DAY 2: Lipreading P, B, M sounds in sentences', 
        'Lip Reading Challenge DAY 3: F, V substitution practice',
        'Lip Reading Challenge DAY 4: F and V sounds in sentences',
        'Lip Reading Challenge DAY 5: Introduction to vowels',
        'Lip Reading Challenge DAY 6: Long vowels and diphthongs',
        'Lip Reading Challenge DAY 7: W and Q',
        'Lip Reading Challenge DAY 8: TH Sound',
        'Lip Reading Challenge DAY 9: SH, CH and J',
        'Lip Reading Challenge DAY 10: Homophenous words'
    ]
    
    # tutorial descriptions based on YouTube Lip Reading Challenge series
    tutorial_descriptions = [
        'Day 1 focuses on PBM substitution practice and invisible sounds. Learn the fundamentals of lip reading with P, B, and M sounds.',
        'Day 2 covers lipreading P, B, M sounds in sentences. Practice recognizing these sounds in real-world contexts.',
        'Day 3 introduces F, V substitution practice. Master the subtle differences between F and V sounds.',
        'Day 4 focuses on F and V sounds in sentences. Apply your knowledge in practical sentence recognition.',
        'Day 5 provides an introduction to vowels. Learn the basic vowel sounds and their lip patterns.',
        'Day 6 covers long vowels and diphthongs. Advanced vowel recognition techniques for experienced learners.',
        'Day 7 focuses on W and Q sounds. Master these challenging consonant combinations.',
        'Day 8 covers the TH sound. Learn to distinguish between voiced and voiceless TH.',
        'Day 9 focuses on SH, CH and J sounds. Master these fricative and affricate consonants.',
        'Day 10 covers homophenous words. Learn to distinguish between words that look the same on lips.'
    ]
    
    # difficulty levels
    difficulties = ['beginner', 'intermediate', 'advanced']
    
    # learning objectives templates
    objectives_templates = [
        '["Master basic lip reading", "Recognize common words", "Understand facial expressions"]',
        '["Master vowel recognition", "Understand mouth shapes", "Practice advanced techniques"]',
        '["Recognize greetings", "Understand social cues", "Practice daily interactions"]',
        '["Master business terminology", "Understand professional contexts", "Handle workplace communication"]',
        '["Master complex vowels", "Understand diphthongs", "Practice advanced techniques"]',
        '["Master medical terminology", "Understand healthcare contexts", "Improve patient communication"]',
        '["Master tech terminology", "Understand digital contexts", "Improve online communication"]',
        '["Master educational terms", "Understand academic contexts", "Improve classroom communication"]',
        '["Master entertainment terms", "Understand industry contexts", "Improve professional communication"]',
        '["Master sports terminology", "Understand athletic contexts", "Improve sports communication"]'
    ]
    
    # prerequisites templates
    prerequisites_templates = [
        '["Basic English knowledge", "Good eyesight"]',
        '["Basic lip reading knowledge", "Intermediate English"]',
        '["Basic English", "Social interaction skills"]',
        '["Advanced lip reading", "Business English", "Professional experience"]',
        '["Advanced lip reading", "Vowel knowledge", "Expert level"]',
        '["Medical background", "Intermediate lip reading"]',
        '["Tech background", "Basic lip reading"]',
        '["Educational background", "Basic lip reading"]',
        '["Entertainment background", "Advanced lip reading"]',
        '["Sports background", "Intermediate lip reading"]'
    ]
    
    # tags templates
    tags_templates = [
        '["lip reading", "basics", "beginner"]',
        '["vowels", "advanced", "techniques"]',
        '["greetings", "social", "beginner"]',
        '["business", "professional", "workplace"]',
        '["vowels", "complex", "advanced"]',
        '["medical", "healthcare", "terminology"]',
        '["technology", "digital", "communication"]',
        '["education", "academic", "classroom"]',
        '["entertainment", "industry", "professional"]',
        '["sports", "athletic", "commentary"]'
    ]
    
    tutorials = []
    for i in range(10):
        # use existing upload files with numbers 1-10
        video_num = i + 1
        video_path = f'/uploads/series/videos/{video_num}.mp4'
        thumbnail_path = f'/uploads/series/thumbnails/{video_num}.jpg'
        subtitle_path = f'/uploads/series/subtitles/{video_num}.vtt'
        
        # logical video duration based on difficulty and day
        if i < 2:  # Day 1-2: Beginner (shorter videos)
            video_duration = random.randint(300, 600)  # 5-10 minutes
        elif i < 5:  # Day 3-5: Intermediate (medium videos)
            video_duration = random.randint(600, 900)  # 10-15 minutes
        else:  # Day 6-10: Advanced (longer videos)
            video_duration = random.randint(900, 1200)  # 15-20 minutes
        # logical difficulty progression based on day number
        if i < 2:  # Day 1-2: Beginner
            difficulty = 'beginner'
        elif i < 5:  # Day 3-5: Intermediate  
            difficulty = 'intermediate'
        else:  # Day 6-10: Advanced
            difficulty = 'advanced'
        
        # logical status progression - earlier days more likely to be published
        if i < 3:  # Day 1-3: Always published (core content)
            status = 'published'
        elif i < 7:  # Day 4-7: Mostly published (80% chance)
            status = 'published' if random.random() > 0.2 else 'draft'
        else:  # Day 8-10: Mixed (60% published, 40% draft)
            status = 'published' if random.random() > 0.4 else 'draft'
        
        # logical views and rating progression - earlier days get more engagement
        if status == 'published':
            if i < 3:  # Day 1-3: High engagement (core content)
                views = random.randint(1500, 2500)
                rating = round(random.uniform(4.2, 5.0), 1)
            elif i < 7:  # Day 4-7: Medium engagement
                views = random.randint(800, 1800)
                rating = round(random.uniform(3.8, 4.8), 1)
            else:  # Day 8-10: Lower engagement (advanced content)
                views = random.randint(200, 1200)
                rating = round(random.uniform(3.5, 4.5), 1)
        else:
            views = 0
            rating = 0.0
        
        # random creation date within last 30 days
        created_date = datetime.utcnow() - timedelta(days=random.randint(1, 30))
        
        tutorial = Tutorial()
        tutorial.public_id = f'TUT-20250101-{str(i+1).zfill(4)}'
        tutorial.category_id = categories[i].id
        tutorial.title = tutorial_titles[i]
        tutorial.description = tutorial_descriptions[i]
        tutorial.video_path = video_path
        tutorial.subtitle_path = subtitle_path  # subtitle support for educational video player
        tutorial.video_duration = video_duration  # add video duration for filtering
        tutorial.status = status
        tutorial.difficulty = difficulty
        tutorial.author = 'Admin User'
        tutorial.thumbnail_path = thumbnail_path
        tutorial.views = views
        tutorial.rating = rating
        tutorial.series_type = 'series'  # set as series for tutorial series functionality
        tutorial.learning_objectives = objectives_templates[i]
        tutorial.prerequisites = prerequisites_templates[i]
        tutorial.tags = tags_templates[i]
        tutorial.created_at = created_date
        tutorial.updated_at = created_date
        tutorials.append(tutorial)
    
    db.session.add_all(tutorials)
    print("10 tutorials created with existing upload files (videos, thumbnails, subtitles)")

    # Create exactly 10 quizzes with sequential IDs (consistent with admin manual insertion)
    print("Creating quizzes...")
    quiz_titles = [
        'General Lip Reading Quiz',
        'Advanced Techniques Quiz', 
        'Business Communication Quiz',
        'Medical Terms Quiz',
        'Technology Terms Quiz',
        'Educational Phrases Quiz',
        'Entertainment Industry Quiz',
        'Sports Commentary Quiz',
        'Science Terminology Quiz',
        'Arts and Culture Quiz'
    ]
    
    quizzes = []
    for i in range(10):
        quiz = Quiz()
        quiz.public_id = f'QZ-20250101-{str(i+1).zfill(4)}'
        quiz.category_id = categories[i].id
        quiz.title = quiz_titles[i]
        quiz.status = 'active'
        quiz.description = f'Test your knowledge of {categories[i].category_name.lower()} lip reading with this comprehensive quiz.'
        quiz.difficulty = random.choice(['beginner', 'intermediate', 'advanced'])
        quiz.author = 'Admin User'
        quiz.thumbnail_path = f'/uploads/series/thumbnails/{random.randint(1, 10)}.jpg'  # random thumbnail
        quiz.views = random.randint(50, 1500)
        quiz.rating = round(random.uniform(3.0, 5.0), 1)
        quiz.total_questions = random.randint(5, 15)
        quiz.estimated_duration = random.randint(300, 1800)  # 5-30 minutes in seconds
        quiz.tags = f'["quiz", "{categories[i].category_name.lower()}", "test"]'
        quiz.created_at = datetime.utcnow() - timedelta(days=random.randint(1, 30))
        quiz.updated_at = datetime.utcnow() - timedelta(days=random.randint(1, 30))
        quizzes.append(quiz)
    
    db.session.add_all(quizzes)
    db.session.flush()
    print("10 quizzes created")

    # Create exactly 10 quiz questions with sequential IDs (consistent with admin manual insertion)
    print("Creating quiz questions...")
    
    # quiz question data
    question_data = [
        ('see you tomorrow', '["see you later","are you tomorrow","see you soon"]'),
        ('i cannot go', '["i can go","i gone","i cannot going"]'),
        ('meeting', '["conference","presentation","discussion"]'),
        ('thank you', '["you are welcome","excuse me","please"]'),
        ('project', '["task","assignment","work"]'),
        ('classroom', '["lecture hall","study room","library"]'),
        ('performance', '["show","concert","play"]'),
        ('championship', '["tournament","competition","match"]'),
        ('experiment', '["research","study","test"]'),
        ('masterpiece', '["artwork","creation","painting"]')
    ]
    
    quiz_questions = []
    for i in range(10):
        correct_answer, incorrect_options = question_data[i]
        quiz_question = QuizQuestion()
        quiz_question.quiz_id = quizzes[i].id
        quiz_question.video_clip_path = f'/uploads/series/videos/{random.randint(1, 10)}.mp4'  # random video
        quiz_question.correct_answer = correct_answer
        quiz_question.incorrect_options = incorrect_options
        quiz_questions.append(quiz_question)
    
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
        print("  - 10 tutorials created with existing upload files:")
        print("    * Videos: /uploads/series/videos/1.mp4 to 10.mp4")
        print("    * Thumbnails: /uploads/series/thumbnails/1.jpg to 10.jpg")
        print("    * Subtitles: /uploads/series/subtitles/1.vtt to 10.vtt")
        print("  - 10 quizzes created with random thumbnails")
        print("  - 10 quiz questions created")
        print("\nLogin credentials:")
        print("  - Admin: admin@example.com / 1234")
        print("  - User: user@example.com / 1234")
        print("\nFuture registrations will auto-increment from ID 3 onwards")


if __name__ == '__main__':
    main()