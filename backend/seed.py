from flask import Flask
from dotenv import load_dotenv
import os
from werkzeug.security import generate_password_hash
from sqlalchemy import text
import random
import json
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
from app.models.feedback import Feedback
from app.models.practice_word import PracticeWord
from app.models.user_bookmark import user_bookmarks
from app.models.user_progress import UserProgress
from app.models.quiz_attempt import QuizAttempt
from app.utils.id_generator import generate_public_id

# Add helper logging function near top (after imports)
print_marker = lambda msg: print(f"[SEED] {msg}")


def seed_programmatic() -> int:
    # clear existing data completely (in correct order due to foreign keys)
    print_marker("Clearing existing database data...")
    
    # Delete in reverse dependency order (fix foreign key constraint)
    db.session.execute(text("DELETE FROM user_bookmarks"))
    db.session.execute(text("DELETE FROM user_progress"))
    db.session.execute(text("DELETE FROM quiz_attempts"))
    db.session.query(Feedback).delete()
    db.session.query(Review).delete()
    db.session.query(PracticeWord).delete()
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
    
    # create additional users for diverse reviews
    additional_users = []
    user_names = ['Alice Johnson', 'Bob Smith', 'Charlie Brown', 'Diana Prince', 'Eve Wilson', 'Frank Miller', 'Grace Lee']
    for i, name in enumerate(user_names, 4):
    user = User()
        user.public_id = f'ACC-U-20250101-{str(i).zfill(4)}'
        user.name = name
        user.email = f'user{i}@example.com'
    user.password_hash = generate_password_hash('1234')
    user.account_type = 'User'
    user.is_2fa_enabled = False
        user.profile_image_path = 'profiles/avatar.jpg'
        additional_users.append(user)
    
    all_users = [admin, user1, user2, user3] + additional_users
    db.session.add_all(all_users)
    db.session.flush()
    print_marker(f"{len(all_users) - 1} users + 1 admin created (password: 1234)")

    # Create domain categories + quiz taxonomy (Words, Phrases, Consonants, Vowels, Numbers, Verbs)
    print_marker("Creating categories...")
    categories = []
    category_names = [
        'General', 'Advanced', 'Business', 'Medical', 'Technology', 'Education', 'Entertainment', 'Sports', 'Science', 'Arts',
        'Words', 'Phrases', 'Consonants', 'Vowels', 'Numbers', 'Verbs'
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
        
        # account-based views - max 1 view per unique user account per tutorial
        # we have 3 users, so views should be 1-3 range (each user watches once)
        if status == 'published':
            if i < 3:  # Day 1-3: High engagement (core content) - all 3 users watch
                views = 3
            elif i < 7:  # Day 4-7: Medium engagement - 2 users watch
                views = random.randint(1, 3)
            else:  # Day 8-10: Lower engagement (advanced content) - 1-2 users watch
                views = random.randint(1, 2)
        else:
            views = 0
        
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

    # create quiz SERIES (like tutorial series structure)
    # parent quiz series with child quiz items
    QUIZ_CHUNK_WORDS = 10
    QUIZ_CHUNK_PHRASES = 10
    quiz_series_list = []  # parent series only
    quiz_items_list = []  # child quizzes within series
    
    # create word quiz series
    num_word_series = max(1, len(word_files) // QUIZ_CHUNK_WORDS)
    for series_idx in range(min(10, num_word_series)):  # create max 10 word quiz series
        series_quiz = Quiz()
        series_quiz.public_id = f'QZ-W-S-{str(series_idx+1).zfill(3)}'
        series_quiz.category_id = get_cat_id('Words')
        series_quiz.title = f'Words Quiz Series {series_idx+1}'
        series_quiz.status = 'active'
        series_quiz.description = f'Practice recognizing isolated words from lip movements - Series {series_idx+1}.'
        series_quiz.difficulty = 'beginner' if series_idx < 3 else ('intermediate' if series_idx < 7 else 'advanced')
        series_quiz.author = 'Admin User'
        series_quiz.thumbnail_path = None
        series_quiz.views = 0
        series_quiz.series_type = 'series'  # parent series
        series_quiz.parent_series_id = None  # no parent
        series_quiz.total_questions = QUIZ_CHUNK_WORDS  # will be updated later
        series_quiz.estimated_duration = QUIZ_CHUNK_WORDS * 30  # 30 seconds per question
        series_quiz.tags = json.dumps(["quiz", "words", "lip reading", "series"])
        series_quiz.passing_score = 70
        series_quiz.max_attempts = 3
        series_quiz.shuffle_questions = False
        series_quiz.shuffle_answers = True
        series_quiz.show_results_immediately = True
        series_quiz.created_at = datetime.utcnow()
        series_quiz.updated_at = datetime.utcnow()
        quiz_series_list.append(series_quiz)
    
    # create phrase quiz series
    num_phrase_series = max(1, len(phrase_files) // QUIZ_CHUNK_PHRASES)
    for series_idx in range(min(10, num_phrase_series)):  # create max 10 phrase quiz series
        series_quiz = Quiz()
        series_quiz.public_id = f'QZ-P-S-{str(series_idx+1).zfill(3)}'
        series_quiz.category_id = get_cat_id('Phrases')
        series_quiz.title = f'Phrases Quiz Series {series_idx+1}'
        series_quiz.status = 'active'
        series_quiz.description = f'Practice recognizing phrases and sentences from lip movements - Series {series_idx+1}.'
        series_quiz.difficulty = 'beginner' if series_idx < 3 else ('intermediate' if series_idx < 7 else 'advanced')
        series_quiz.author = 'Admin User'
        series_quiz.thumbnail_path = None
        series_quiz.views = 0
        series_quiz.series_type = 'series'  # parent series
        series_quiz.parent_series_id = None  # no parent
        series_quiz.total_questions = QUIZ_CHUNK_PHRASES  # will be updated later
        series_quiz.estimated_duration = QUIZ_CHUNK_PHRASES * 35  # 35 seconds per question
        series_quiz.tags = json.dumps(["quiz", "phrases", "lip reading", "series"])
        series_quiz.passing_score = 70
        series_quiz.max_attempts = 3
        series_quiz.shuffle_questions = False
        series_quiz.shuffle_answers = True
        series_quiz.show_results_immediately = True
        series_quiz.created_at = datetime.utcnow()
        series_quiz.updated_at = datetime.utcnow()
        quiz_series_list.append(series_quiz)
    
    # create quiz series for other categories (Vowels, Consonants, Numbers, Verbs) - text-based questions
    other_categories = ['Vowels', 'Consonants', 'Numbers', 'Verbs']
    QUIZ_CHUNK_OTHER = 8  # 8 questions per series for categories without video files
    
    for cat_name in other_categories:
        cat_id = get_cat_id(cat_name)
        # create 5-8 quiz series per category
        num_series = random.randint(5, 8)
        for series_idx in range(num_series):
            series_quiz = Quiz()
            series_quiz.public_id = f'QZ-{cat_name[:3].upper()}-S-{str(series_idx+1).zfill(3)}'
            series_quiz.category_id = cat_id
            series_quiz.title = f'{cat_name} Quiz Series {series_idx+1}'
            series_quiz.status = 'active'
            series_quiz.description = f'Practice recognizing {cat_name.lower()} from lip movements - Series {series_idx+1}.'
            series_quiz.difficulty = 'beginner' if series_idx < 2 else ('intermediate' if series_idx < 5 else 'advanced')
            series_quiz.author = 'Admin User'
            series_quiz.thumbnail_path = None
            series_quiz.views = random.randint(3, 20)  # add views for analytics
            series_quiz.series_type = 'series'  # parent series
            series_quiz.parent_series_id = None  # no parent
            series_quiz.total_questions = QUIZ_CHUNK_OTHER  # will be updated later
            series_quiz.estimated_duration = QUIZ_CHUNK_OTHER * 25  # 25 seconds per question
            series_quiz.tags = json.dumps(["quiz", cat_name.lower(), "lip reading", "series"])
            series_quiz.passing_score = 70
            series_quiz.max_attempts = 3
            series_quiz.shuffle_questions = False
            series_quiz.shuffle_answers = True
            series_quiz.show_results_immediately = True
            series_quiz.created_at = datetime.utcnow() - timedelta(days=random.randint(1, 60))
            series_quiz.updated_at = datetime.utcnow()
            quiz_series_list.append(series_quiz)
    
    # add all parent series to database and flush to get IDs
    db.session.add_all(quiz_series_list)
    db.session.flush()
    print_marker(f"{len(quiz_series_list)} quiz SERIES created (parent quizzes)")

    # create quiz questions with actual video files (for parent series)
    print_marker("Creating quiz questions with video files...")
    
    quiz_questions = []
    question_id = 0
    
    # create questions for word quiz series
    word_quiz_series = [q for q in quiz_series_list if q.tags and 'words' in json.loads(q.tags)]
    for qi, series_quiz in enumerate(word_quiz_series):
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
            quiz_question.quiz_id = series_quiz.id  # use parent series ID
            quiz_question.question_type = 'video_mcq'
            quiz_question.video_clip_path = f'/uploads/quiz/Words/{word_file}'
            quiz_question.correct_answer = word_name
            quiz_question.incorrect_options = json.dumps(incorrect_options)
            quiz_question.points = 1
            quiz_question.explanation = f'The correct answer is "{word_name}". Watch the video carefully to observe the lip movements.'
            quiz_questions.append(quiz_question)
            question_id += 1
    
    # create questions for phrase quiz series
    phrase_quiz_series = [q for q in quiz_series_list if q.tags and 'phrases' in json.loads(q.tags)]
    for qi, series_quiz in enumerate(phrase_quiz_series):
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
            quiz_question.quiz_id = series_quiz.id  # use parent series ID
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
                true_false_question.quiz_id = series_quiz.id  # use parent series ID
                true_false_question.question_type = 'true_false'
                true_false_question.question_text = f'The phrase "{phrase_name}" contains a question word.'
                true_false_question.correct_answer = 'True' if '?' in phrase_name or any(q in phrase_name.lower() for q in ['what', 'when', 'where', 'who', 'why', 'how']) else 'False'
                true_false_question.points = 1
                true_false_question.explanation = f'The statement is {true_false_question.correct_answer}. Question words include: what, when, where, who, why, how.'
                quiz_questions.append(true_false_question)
                question_id += 1
    
    # create text-based questions for Vowels, Consonants, Numbers, Verbs categories
    vowels_list = ['A', 'E', 'I', 'O', 'U', 'AE', 'AI', 'AU', 'EA', 'EI', 'EU', 'IA', 'IE', 'IO', 'OA', 'OE', 'OI', 'OU', 'UA', 'UE', 'UI', 'UO']
    consonants_list = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z', 'CH', 'SH', 'TH', 'PH', 'GH']
    numbers_list = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty']
    verbs_list = ['Say', 'Speak', 'Talk', 'Tell', 'Ask', 'Answer', 'Listen', 'Hear', 'See', 'Watch', 'Look', 'Read', 'Write', 'Think', 'Know', 'Understand', 'Learn', 'Teach', 'Show', 'Explain', 'Describe', 'Express']
    
    category_data_map = {
        'Vowels': vowels_list,
        'Consonants': consonants_list,
        'Numbers': numbers_list,
        'Verbs': verbs_list
    }
    
    for cat_name, data_list in category_data_map.items():
        cat_quiz_series = [q for q in quiz_series_list if q.tags and cat_name.lower() in json.loads(q.tags)]
        for series_quiz in cat_quiz_series:
            # create questions for this series
            for q_idx in range(QUIZ_CHUNK_OTHER):
                if q_idx >= len(data_list):
                    break
                
                correct_item = data_list[q_idx]
                incorrect_items = [item for item in data_list if item != correct_item]
                incorrect_options = random.sample(incorrect_items, min(3, len(incorrect_items)))
                
                quiz_question = QuizQuestion()
                quiz_question.quiz_id = series_quiz.id
                quiz_question.question_type = 'text_mcq'
                quiz_question.question_text = f'Which {cat_name.lower()} is being demonstrated in the lip movement?'
                quiz_question.correct_answer = correct_item
                quiz_question.incorrect_options = json.dumps(incorrect_options)
                quiz_question.points = 1
                quiz_question.explanation = f'The correct answer is "{correct_item}". Practice recognizing {cat_name.lower()} from lip movements.'
                quiz_questions.append(quiz_question)
                question_id += 1
    
    db.session.add_all(quiz_questions)
    db.session.flush()
    
    # update quiz series total_questions count
    for series_quiz in quiz_series_list:
        question_count = db.session.query(QuizQuestion).filter(QuizQuestion.quiz_id == series_quiz.id).count()
        series_quiz.total_questions = question_count
    
    db.session.commit()
    question_count = len(quiz_questions)
    print_marker(f"{question_count} quiz questions created with actual video files")

    # create diverse reviews for tutorials and quizzes
    print_marker("Creating diverse reviews for tutorials and quizzes...")
    reviews = []
    review_texts = [
        "Excellent tutorial! Very clear explanations and helpful examples.",
        "Great content, but could use more practice exercises.",
        "This helped me understand the basics. Highly recommend!",
        "Good tutorial, though some parts were a bit challenging.",
        "Amazing! I've learned so much from this series.",
        "Decent tutorial, but could be more engaging.",
        "Perfect for beginners. The step-by-step approach is excellent.",
        "Really enjoyed this! The instructor explains everything clearly.",
        "Helpful tutorial. I appreciate the detailed explanations.",
        "Good content overall, but some sections need more detail.",
        "Fantastic tutorial! I've improved my skills significantly.",
        "Nice tutorial, but the pace was a bit fast for me.",
        "Very informative and well-structured. Great job!",
        "I found this tutorial very helpful for my learning journey.",
        "Good quality content, would recommend to others.",
        "Excellent breakdown of complex concepts. Love it!",
        "This tutorial exceeded my expectations. Thank you!",
        "Solid tutorial with good examples and clear explanations.",
        "Great resource for learning. Highly satisfied!",
        "Good tutorial, though I wish there were more examples."
    ]
    
    # create reviews for tutorials (users enrolled in tutorials can review)
    # NO ADMIN RESPONSES - all reviews should be without admin responses
    review_counter = 1  # manual counter for unique public_ids
    date_str = datetime.now().strftime('%Y%m%d')
    
    if tutorials and len(all_users) > 1:
        user_list = [u for u in all_users if u.account_type == 'User']
        # create reviews for ALL tutorials - GUARANTEE at least 1 review per tutorial
        for tutorial_idx, tutorial in enumerate(tutorials):
            # each tutorial gets 3-8 reviews from different users, but at least 1
            num_reviews = max(1, random.randint(3, min(8, len(user_list))))
            # ensure we don't try to sample more users than available
            num_reviews = min(num_reviews, len(user_list))
            selected_users = random.sample(user_list, num_reviews) if len(user_list) > 0 else []
            
            # GUARANTEE at least 1 review - if no users, skip this tutorial
            if len(selected_users) == 0:
                print_marker(f"WARNING: No users available to create reviews for tutorial {tutorial.id}")
                continue
            
            for user_idx, user in enumerate(selected_users):
                review = Review()
                review.public_id = f'REV-{date_str}-{review_counter:04d}'
                review_counter += 1
                review.user_id = user.id
                review.target_type = 'tutorial'
                review.target_id = tutorial.id
                # diverse ratings: mostly positive (3-5), some mixed (2-4)
                if tutorial_idx < 3:  # first 3 tutorials get better ratings
                    review.rating = random.choices([4, 5], weights=[30, 70])[0]
                elif tutorial_idx < 6:
                    review.rating = random.choices([3, 4, 5], weights=[20, 50, 30])[0]
                else:
                    review.rating = random.choices([2, 3, 4, 5], weights=[10, 30, 40, 20])[0]
                
                review.review_text = random.choice(review_texts)
                review.created_at = datetime.utcnow() - timedelta(days=random.randint(0, 30))
                
                # NO ADMIN RESPONSES - leave admin_response, admin_responded_at, and reviewed_by_admin_id as None
                
                reviews.append(review)
    
    # create reviews for quizzes (users who attempted quizzes can review)
    # NO ADMIN RESPONSES - all reviews should be without admin responses
    # GUARANTEE at least 1 review per quiz series
    if quiz_series_list and len(all_users) > 1:
        user_list = [u for u in all_users if u.account_type == 'User']
        # create reviews for ALL quiz series - GUARANTEE at least 1 review per quiz
        for quiz_idx, quiz in enumerate(quiz_series_list):
            num_reviews = max(1, random.randint(2, min(5, len(user_list))))
            # ensure we don't try to sample more users than available
            num_reviews = min(num_reviews, len(user_list))
            selected_users = random.sample(user_list, num_reviews) if len(user_list) > 0 else []
            
            # GUARANTEE at least 1 review - if no users, skip this quiz
            if len(selected_users) == 0:
                print_marker(f"WARNING: No users available to create reviews for quiz {quiz.id}")
                continue
            
            for user in selected_users:
                review = Review()
                review.public_id = f'REV-{date_str}-{review_counter:04d}'
                review_counter += 1
                review.user_id = user.id
                review.target_type = 'quiz'
                review.target_id = quiz.id
                review.rating = random.choices([3, 4, 5], weights=[20, 40, 40])[0]
                review.review_text = random.choice([
                    "Great quiz! Challenging but fair.",
                    "Good questions, helped me practice.",
                    "Enjoyed taking this quiz. Well designed!",
                    "Nice variety of questions.",
                    "This quiz really tests your understanding."
                ])
                review.created_at = datetime.utcnow() - timedelta(days=random.randint(0, 20))
                
                # NO ADMIN RESPONSES - leave admin_response, admin_responded_at, and reviewed_by_admin_id as None
                
                reviews.append(review)
    
    if reviews:
        db.session.add_all(reviews)
        db.session.commit()
        print_marker(f"Inserted {len(reviews)} diverse reviews with ratings and comments")
    
    # create enrollments (bookmarks) for tutorials - users must be enrolled to review
    print_marker("Creating enrollments (bookmarks) for tutorials...")
    from app.models.user_bookmark import user_bookmarks
    bookmark_records = []
    user_list = [u for u in all_users if u.account_type == 'User']
    
    # ensure all users who wrote reviews are enrolled in those tutorials
    if tutorials and reviews:
        # create enrollment set from reviews (users enrolled in tutorials they reviewed)
        enrolled_pairs = set()
        for review in reviews:
            if review.target_type == 'tutorial':
                enrolled_pairs.add((review.user_id, review.target_id))
        
        # add additional enrollments for better data diversity
        for tutorial in tutorials:  # enrollments for all tutorials
            # each tutorial gets enrollments from 60-100% of users
            enrollment_rate = random.uniform(0.6, 1.0)
            num_enrollments = max(1, int(len(user_list) * enrollment_rate))
            selected_users = random.sample(user_list, min(num_enrollments, len(user_list)))
            
            for user in selected_users:
                if (user.id, tutorial.id) not in enrolled_pairs:
                    enrolled_pairs.add((user.id, tutorial.id))
        
        # convert set to list of dicts for insert
        for user_id, tutorial_id in enrolled_pairs:
            bookmark_records.append({
                'user_id': user_id,
                'tutorial_id': tutorial_id
            })
    
    if bookmark_records:
        db.session.execute(user_bookmarks.insert(), bookmark_records)
        db.session.commit()
        print_marker(f"Created {len(bookmark_records)} enrollments (bookmarks) for tutorials")
    
    # create comprehensive quiz attempts for ALL categories for analytics display
    print_marker("Creating comprehensive quiz attempts across all categories...")
    quiz_attempts = []
    user_list = [u for u in all_users if u.account_type == 'User']
    
    if quiz_series_list and user_list:
        # create attempts for quizzes from all categories
        for quiz_idx, quiz in enumerate(quiz_series_list):
            # determine how many users attempt this quiz based on category
            quiz_category = None
            for cat in categories:
                if cat.id == quiz.category_id:
                    quiz_category = cat.category_name
                    break
            
            # more attempts for Words and Phrases (they have video files)
            if quiz_category in ['Words', 'Phrases']:
                num_attempts = random.randint(3, 8)
            else:
                num_attempts = random.randint(2, 5)
            
            # select random users to attempt this quiz
            selected_users = random.sample(user_list, min(num_attempts, len(user_list)))
            
            for user_idx, user in enumerate(selected_users):
                attempt = QuizAttempt()
                attempt.public_id = f'QA-{datetime.now().strftime("%Y%m%d")}-{str(quiz_idx * 10 + user_idx + 1).zfill(4)}'
                attempt.user_id = user.id
                attempt.quiz_id = quiz.id
                attempt.attempt_number = 1
                
                # vary scores based on difficulty and category
                if quiz.difficulty == 'beginner':
                    attempt.score = round(random.uniform(70, 100), 1)
                elif quiz.difficulty == 'intermediate':
                    attempt.score = round(random.uniform(60, 90), 1)
                else:  # advanced
                    attempt.score = round(random.uniform(50, 85), 1)
                
                attempt.passed = attempt.score >= quiz.passing_score
                attempt.completion_date = datetime.utcnow() - timedelta(days=random.randint(0, 30))
                attempt.answers_json = None
                quiz_attempts.append(attempt)
    
    if quiz_attempts:
        db.session.add_all(quiz_attempts)
        db.session.commit()
    print_marker(f"Created {len(quiz_attempts)} quiz attempts across all categories")
    
    # create user progress for tutorial series completion tracking
    print_marker("Creating user progress for tutorial series completion...")
    user_progress_records = []
    if tutorials and user_list:
        # get tutorial series (parent tutorials)
        tutorial_series = [t for t in tutorials if t.series_type == 'series' and t.parent_series_id == None]
        
        for series in tutorial_series:
            # get all videos in this series (for now, tutorials are parent series themselves)
            # in a real scenario, we'd have child videos, but for now we'll create progress for the series itself
            # get users enrolled in this series (bookmarked)
            enrolled_users = []
            for bookmark in bookmark_records:
                if bookmark['tutorial_id'] == series.id:
                    user = next((u for u in user_list if u.id == bookmark['user_id']), None)
                    if user:
                        enrolled_users.append(user)
            
            # for each enrolled user, create progress record
            # since we don't have child videos, we'll mark the series as completed if user watched it
            for user in enrolled_users:
                # randomly decide if user completed (60-80% completion rate)
                completed = random.random() < random.uniform(0.6, 0.8)
                
                progress = UserProgress()
                progress.public_id = f'UP-{datetime.now().strftime("%Y%m%d")}-{random.randint(1000, 9999)}'
                progress.user_id = user.id
                progress.tutorial_id = series.id  # use series id as tutorial_id
                progress.series_id = series.id
                progress.is_completed = completed
                progress.created_at = datetime.utcnow() - timedelta(days=random.randint(1, 30))
                progress.updated_at = datetime.utcnow() - timedelta(days=random.randint(0, 10))
                user_progress_records.append(progress)
    
    if user_progress_records:
        db.session.add_all(user_progress_records)
        db.session.commit()
        print_marker(f"Created {len(user_progress_records)} user progress records for series completion tracking")
    
    # create practice words with actual video files
    print_marker("Creating practice words...")
    word_videos_dir = os.path.join(os.path.dirname(__file__), 'uploads', 'quiz', 'Words')
    word_video_files = []
    if os.path.exists(word_videos_dir):
        word_video_files = [f for f in os.listdir(word_videos_dir) if f.endswith('.mp4')]
        # sort to prioritize proper words over numeric filenames
        word_video_files = sorted(word_video_files, key=lambda x: (x[0].isdigit(), x.lower()))
    
    practice_words = []
    phonetics_map = {
        'Hello': '/həˈloʊ/',
        'Thank You': '/θæŋk juː/',
        'Beautiful': '/ˈbjuːtɪfəl/',
        'Computer': '/kəmˈpjuːtər/',
        'Excellent': '/ˈɛksələnt/',
        'Good': '/ɡʊd/',
        'Morning': '/ˈmɔːrnɪŋ/',
        'Night': '/naɪt/',
        'Please': '/pliːz/',
        'Welcome': '/ˈwelkəm/',
    }
    difficulty_map = {
        'Hello': 'beginner',
        'Thank You': 'beginner',
        'Good': 'beginner',
        'Morning': 'beginner',
        'Night': 'beginner',
        'Please': 'beginner',
        'Welcome': 'beginner',
        'Beautiful': 'intermediate',
        'Computer': 'advanced',
        'Excellent': 'advanced',
    }
    
    for i, filename in enumerate(word_video_files[:50]):  # seed first 50 practice words
        word_name = os.path.splitext(filename)[0]
        # skip numeric-only filenames for better demo
        if word_name.isdigit():
            continue
        # use basic categories cycling through first 5
        category = categories[i % 5] if categories else None
        if not category:
            break
            
        pw = PracticeWord()
        pw.public_id = f'PW-20250101-{str(i+1).zfill(4)}'
        pw.category_id = category.id
        pw.word = word_name.replace('_', ' ').title()
        pw.phonetics = phonetics_map.get(pw.word, f'/phonetic/{pw.word.lower()}/')
        pw.description = f'Practice the lip reading for "{pw.word}"'
        pw.video_path = f'/uploads/quiz/Words/{filename}'
        pw.difficulty = difficulty_map.get(pw.word, 'intermediate')
        pw.status = 'active'
        pw.sort_order = i + 1
        practice_words.append(pw)
    
    db.session.add_all(practice_words)
    db.session.commit()
    print_marker(f"Created {len(practice_words)} practice words")
    
    # create sample feedback items for analytics display
    print_marker("Creating sample feedback items...")
    feedback_items = []
    feedback_types = ['bug', 'feature', 'general']
    feedback_statuses = ['New', 'In Progress', 'Resolved', 'New', 'New']  # more new items
    
    for i in range(8):  # create 8 feedback items
        fb = Feedback()
        # use manual sequential ID since generate_public_id doesn't work in loop
        fb.public_id = f'FB-{datetime.now().strftime("%Y%m%d")}-{str(i+1).zfill(4)}'
        fb.submitted_by_user_id = user1.id if i % 3 == 0 else (user2.id if i % 3 == 1 else user3.id)
        fb.feedback_type = feedback_types[i % len(feedback_types)]
        fb.description = f'Sample feedback item {i+1}: Please improve the {feedback_types[i % len(feedback_types)]} functionality.'
        fb.status = feedback_statuses[i % len(feedback_statuses)]
        fb.submission_date = datetime.utcnow() - timedelta(days=random.randint(0, 14))
        if fb.status == 'Resolved':
            fb.reviewed_by_admin_id = admin.id
        feedback_items.append(fb)
    
    db.session.add_all(feedback_items)
    db.session.commit()
    print_marker(f"Created {len(feedback_items)} feedback items")
    
    # note: user_progress not needed since we track completion at series level
    # which requires video structure that doesn't exist in current seed data
    
    total_items = len(categories) + len(tutorials) + len(quiz_series_list) + question_count + len(practice_words) + len(feedback_items)
    return total_items


def main() -> None:
    app: Flask = create_app()
    with app.app_context():
        total_items = seed_programmatic()
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
        print_marker("  - Practice words created from /uploads/quiz/Words/")
        print_marker(f"  - {total_items} total items created")
        print_marker("\nLogin credentials:")
        print_marker("  - Admin: admin@example.com / 1234")
        print_marker("  - User: user@example.com / 1234")
        print_marker("\nFuture registrations will auto-increment from ID 3 onwards")


if __name__ == '__main__':
    main()