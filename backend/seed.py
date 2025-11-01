from flask import Flask
from dotenv import load_dotenv
import os
from werkzeug.security import generate_password_hash
from sqlalchemy import text
import random
import json
import os
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
    Review,
)

# Add helper logging function near top (after imports)
print_marker = lambda msg: print(f"[SEED] {msg}")


def seed_programmatic() -> int:
    # clear existing data completely (in correct order due to foreign keys)
    print_marker("Clearing existing database data...")
    
    # Delete in reverse dependency order (fix foreign key constraint)
    from app.models.review import Review
    db.session.query(Review).delete()
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
    try:
        db.session.execute(text("ALTER TABLE reviews AUTO_INCREMENT = 1"))
    except Exception:
        pass
    
    db.session.commit()
    print_marker("Database cleared and reset to sequential IDs")
    
    # Create fresh accounts with proper password hashing (password: 1234)
    print_marker("Creating fresh accounts...")
    
    admin = Administrator()
    admin.public_id = 'ACC-A-20250101-0001'
    admin.name = 'Admin User'
    admin.email = 'admin@example.com'
    admin.password_hash = generate_password_hash('1234')
    admin.account_type = 'Administrator'
    admin.profile_image_path = 'profiles/avatar.jpg'  # Default avatar
    
    user1 = User()
    user1.public_id = 'ACC-U-20250101-0001'
    user1.name = 'Demo User'
    user1.email = 'user@example.com'
    user1.password_hash = generate_password_hash('1234')
    user1.account_type = 'User'
    user1.is_2fa_enabled = False
    user1.profile_image_path = 'profiles/avatar.jpg'

    user2 = User()
    user2.public_id = 'ACC-U-20250101-0002'
    user2.name = 'Second User'
    user2.email = 'user2@example.com'
    user2.password_hash = generate_password_hash('1234')
    user2.account_type = 'User'
    user2.is_2fa_enabled = False
    user2.profile_image_path = 'profiles/avatar.jpg'

    user3 = User()
    user3.public_id = 'ACC-U-20250101-0003'
    user3.name = 'Third User'
    user3.email = 'user3@example.com'
    user3.password_hash = generate_password_hash('1234')
    user3.account_type = 'User'
    user3.is_2fa_enabled = False
    user3.profile_image_path = 'profiles/avatar.jpg'
    
    db.session.add_all([admin, user1, user2, user3])
    print_marker("3 users + 1 admin created (password: 1234)")

    # Create domain categories + quiz taxonomy (Words, Phrases, Consonants, Vowels, Numbers)
    print_marker("Creating categories...")
    categories = []
    category_names = [
        'General', 'Advanced', 'Business', 'Medical', 'Technology', 'Education', 'Entertainment', 'Sports', 'Science', 'Arts',
        'Words', 'Phrases', 'Consonants', 'Vowels', 'Numbers'
    ]
    for i, name in enumerate(category_names, 1):
        category = Category()
        category.public_id = f'CAT-20250101-{str(i).zfill(4)}'
        category.category_name = name
        category.status = 'active'
        categories.append(category)
    db.session.add_all(categories)
    db.session.flush()
    print_marker(f"{len(category_names)} categories created")

    # Create exactly 10 tutorials using existing upload files (1-10)
    print_marker("Creating tutorials with existing upload files...")
    
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
        # rating removed; reviews drive ratings
        tutorial.series_type = 'series'  # set as series for tutorial series functionality
        tutorial.learning_objectives = objectives_templates[i]
        tutorial.prerequisites = prerequisites_templates[i]
        tutorial.tags = tags_templates[i]
        tutorial.created_at = created_date
        tutorial.updated_at = created_date
        tutorials.append(tutorial)
    
    db.session.add_all(tutorials)
    print_marker("10 tutorials created with existing upload files (videos, thumbnails, subtitles)")

    # create quizzes with actual video files from uploads/quiz folder
    print_marker("Creating quizzes with video files from uploads/quiz...")
    
    # get actual video files from uploads/quiz folders
    quiz_base_path = os.path.join(os.path.dirname(__file__), 'uploads', 'quiz')
    words_path = os.path.join(quiz_base_path, 'Words')
    phrases_path = os.path.join(quiz_base_path, 'Phrases')
    
    word_files = []
    phrase_files = []
    
    if os.path.exists(words_path):
        word_files = [f for f in os.listdir(words_path) if f.endswith('.mp4')]
    if os.path.exists(phrases_path):
        phrase_files = [f for f in os.listdir(phrases_path) if f.endswith('.mp4')]
    
    print_marker(f"Found {len(word_files)} word videos and {len(phrase_files)} phrase videos")
    
    # Build quizzes dynamically from files; chunk into fixed-size quizzes
    def get_cat_id(name: str) -> int:
        for c in categories:
            if c.category_name.lower() == name.lower():
                return c.id
        return categories[0].id

    QUIZ_CHUNK_WORDS = 10
    QUIZ_CHUNK_PHRASES = 10
    quizzes = []

    # words
    for start in range(0, len(word_files), QUIZ_CHUNK_WORDS):
        chunk = word_files[start:start + QUIZ_CHUNK_WORDS]
        if not chunk:
            continue
        quiz = Quiz()
        quiz.public_id = f'QZ-W-{str(len(quizzes)+1).zfill(4)}'
        quiz.category_id = get_cat_id('Words')
        quiz.title = f'Words Quiz {len(quizzes)+1}'
        quiz.status = 'active'
        quiz.description = 'Practice recognizing isolated words from lip movements.'
        quiz.difficulty = 'beginner' if len(quizzes) < 5 else ('intermediate' if len(quizzes) < 15 else 'advanced')
        quiz.author = 'Admin User'
        quiz.thumbnail_path = None
        quiz.views = 0
        # rating removed; reviews drive ratings
        quiz.total_questions = 0
        quiz.estimated_duration = len(chunk) * 30
        quiz.tags = json.dumps(["quiz", "words", "lip reading"])
        quiz.passing_score = 70
        quiz.max_attempts = 3
        quiz.shuffle_questions = False
        quiz.shuffle_answers = True
        quiz.show_results_immediately = True
        quiz.created_at = datetime.utcnow()
        quiz.updated_at = datetime.utcnow()
        quizzes.append(quiz)

    # phrases
    for start in range(0, len(phrase_files), QUIZ_CHUNK_PHRASES):
        chunk = phrase_files[start:start + QUIZ_CHUNK_PHRASES]
        if not chunk:
            continue
        quiz = Quiz()
        quiz.public_id = f'QZ-P-{str(len(quizzes)+1).zfill(4)}'
        quiz.category_id = get_cat_id('Phrases')
        quiz.title = f'Phrases Quiz {len(quizzes)+1}'
        quiz.status = 'active'
        quiz.description = 'Practice recognizing phrases and sentences from lip movements.'
        quiz.difficulty = 'beginner' if len(quizzes) < 5 else ('intermediate' if len(quizzes) < 15 else 'advanced')
        quiz.author = 'Admin User'
        quiz.thumbnail_path = None
        quiz.views = 0
        # rating removed; reviews drive ratings
        quiz.total_questions = 0
        quiz.estimated_duration = len(chunk) * 35
        quiz.tags = json.dumps(["quiz", "phrases", "lip reading"])
        quiz.passing_score = 70
        quiz.max_attempts = 3
        quiz.shuffle_questions = False
        quiz.shuffle_answers = True
        quiz.show_results_immediately = True
        quiz.created_at = datetime.utcnow()
        quiz.updated_at = datetime.utcnow()
        quizzes.append(quiz)
    
    db.session.add_all(quizzes)
    db.session.flush()
    print_marker(f"{len(quizzes)} quizzes created from video files")

    # create quiz questions with actual video files
    print_marker("Creating quiz questions with video files...")
    
    quiz_questions = []
    question_id = 0
    
    # create questions for words (chunk-aligned)
    word_quizzes = [q for q in quizzes if q.tags and 'words' in json.loads(q.tags)]
    for qi, _ in enumerate(word_quizzes):
        start = qi * QUIZ_CHUNK_WORDS
        chunk = word_files[start:start + QUIZ_CHUNK_WORDS]
        for word_file in chunk:
            # extract the word from filename (remove .mp4 extension)
            word_name = word_file.replace('.mp4', '').replace('_', ' ').title()
            
            # create incorrect options based on similar words
            incorrect_options = []
            other_words = [w for w in word_files if w != word_file]
            similar_words = random.sample(other_words, min(3, len(other_words)))
            for similar_word in similar_words:
                similar_word_name = similar_word.replace('.mp4', '').replace('_', ' ').title()
                incorrect_options.append(similar_word_name)
            
            quiz_question = QuizQuestion()
            quiz_question.quiz_id = word_quizzes[qi].id
            quiz_question.question_type = 'video_mcq'
            quiz_question.video_clip_path = f'/uploads/quiz/Words/{word_file}'
            quiz_question.correct_answer = word_name
            quiz_question.incorrect_options = json.dumps(incorrect_options)
            quiz_question.points = 1
            quiz_question.explanation = f'The correct answer is "{word_name}". Watch the video carefully to observe the lip movements.'
            quiz_questions.append(quiz_question)
            question_id += 1
    
    # create questions for phrases (chunk-aligned)
    phrase_quizzes = [q for q in quizzes if q.tags and 'phrases' in json.loads(q.tags)]
    for qi, _ in enumerate(phrase_quizzes):
        start = qi * QUIZ_CHUNK_PHRASES
        chunk = phrase_files[start:start + QUIZ_CHUNK_PHRASES]
        for phrase_file in chunk:
            # extract the phrase from filename (remove .mp4 extension and clean up)
            phrase_name = phrase_file.replace('.mp4', '').replace('_', ' ').replace('$', '?').replace('..', '.').strip()
            
            # create incorrect options based on similar phrases
            incorrect_options = []
            other_phrases = [p for p in phrase_files if p != phrase_file]
            similar_phrases = random.sample(other_phrases, min(3, len(other_phrases)))
            for similar_phrase in similar_phrases:
                similar_phrase_name = similar_phrase.replace('.mp4', '').replace('_', ' ').replace('$', '?').replace('..', '.').strip()
                incorrect_options.append(similar_phrase_name)
            
            quiz_question = QuizQuestion()
            quiz_question.quiz_id = phrase_quizzes[qi].id
            quiz_question.question_type = 'video_mcq'
            quiz_question.video_clip_path = f'/uploads/quiz/Phrases/{phrase_file}'
            quiz_question.correct_answer = phrase_name
            quiz_question.incorrect_options = json.dumps(incorrect_options)
            quiz_question.points = 1
            quiz_question.explanation = f'The correct answer is "{phrase_name}". Pay attention to the sequence of lip movements.'
            quiz_questions.append(quiz_question)
            question_id += 1
            
            # add some true/false questions randomly (about 20% of questions)
            if random.random() < 0.2 and question_id < len(phrase_files):
                true_false_question = QuizQuestion()
                true_false_question.quiz_id = phrase_quizzes[qi].id
                true_false_question.question_type = 'true_false'
                true_false_question.question_text = f'The phrase "{phrase_name}" contains a question word.'
                true_false_question.correct_answer = 'True' if '?' in phrase_name or any(q in phrase_name.lower() for q in ['what', 'when', 'where', 'who', 'why', 'how']) else 'False'
                true_false_question.points = 1
                true_false_question.explanation = f'The statement is {true_false_question.correct_answer}. Question words include: what, when, where, who, why, how.'
                quiz_questions.append(true_false_question)
                question_id += 1
    
    db.session.add_all(quiz_questions)
    db.session.flush()
    
    # update quiz total_questions count
    for quiz in quizzes:
        question_count = db.session.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz.id).count()
        quiz.total_questions = question_count
    
    db.session.commit()
    question_count = len(quiz_questions)
    print_marker(f"{question_count} quiz questions created with actual video files")

    # create sample reviews for first tutorial and first quiz
    print_marker("Creating sample reviews for tutorials and quizzes...")
    if tutorials:
        first_tutorial_id = tutorials[0].id
        r1 = Review(); r1.public_id = 'REV-T-0001'; r1.user_id = user1.id; r1.target_type = 'tutorial'; r1.target_id = first_tutorial_id; r1.rating = 5; r1.review_text = 'Great tutorial!'
        r2 = Review(); r2.public_id = 'REV-T-0002'; r2.user_id = user2.id; r2.target_type = 'tutorial'; r2.target_id = first_tutorial_id; r2.rating = 4; r2.review_text = 'Helpful and clear.'
        db.session.add_all([r1, r2])
    if quizzes:
        first_quiz_id = quizzes[0].id
        r3 = Review(); r3.public_id = 'REV-Q-0001'; r3.user_id = user1.id; r3.target_type = 'quiz'; r3.target_id = first_quiz_id; r3.rating = 4; r3.review_text = 'Good challenge.'
        r4 = Review(); r4.public_id = 'REV-Q-0002'; r4.user_id = user3.id; r4.target_type = 'quiz'; r4.target_id = first_quiz_id; r4.rating = 5; r4.review_text = 'Loved the questions!'
        db.session.add_all([r3, r4])
    db.session.commit()
    print_marker("Inserted sample reviews")
    return question_count


def main() -> None:
    app: Flask = create_app()
    with app.app_context():
        question_count = seed_programmatic()
        db.session.commit()
        print_marker("\nDatabase seeding completed successfully!")
        print_marker("Summary:")
        print_marker("  - All data cleared and IDs reset to sequential order")
        print_marker("  - 2 accounts created (1 admin, 1 user) - password: 1234")
        print_marker("  - 10 categories created (consistent with admin manual insertion)")
        print_marker("  - 10 tutorials created with existing upload files:")
        print_marker("    * Videos: /uploads/series/videos/1.mp4 to 10.mp4")
        print_marker("    * Thumbnails: /uploads/series/thumbnails/1.jpg to 10.jpg")
        print_marker("    * Subtitles: /uploads/series/subtitles/1.vtt to 10.vtt")
        print_marker("  - 20 quizzes created with video files:")
        print_marker("    * Word quizzes: /uploads/quiz/Words/")
        print_marker("    * Phrase quizzes: /uploads/quiz/Phrases/")
        print_marker(f"  - {question_count} quiz questions created with actual video files")
        print_marker("\nLogin credentials:")
        print_marker("  - Admin: admin@example.com / 1234")
        print_marker("  - User: user@example.com / 1234")
        print_marker("\nFuture registrations will auto-increment from ID 3 onwards")


if __name__ == '__main__':
    main()