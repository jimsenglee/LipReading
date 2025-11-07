# backend/reset_db.py
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.flaskenv'))

from app import create_app, db
from sqlalchemy import text

def reset_database():
    """Completely reset database: drop all tables, recreate, and reset auto-increment"""
    app = create_app()
    with app.app_context():
        print("=" * 60)
        print("DATABASE RESET - Starting complete wipe and recreation")
        print("=" * 60)
        
        # Get database connection
        connection = db.engine.connect()
        
        try:
            # 1. Disable foreign key checks (MySQL specific)
            print("\n[STEP 1] Disabling foreign key checks...")
            try:
                connection.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
            except Exception as e:
                print(f"Note: FOREIGN_KEY_CHECKS not supported (might be SQLite): {e}")
            
            # 2. Drop all tables
            print("\n[STEP 2] Dropping all existing tables...")
            db.drop_all()
            print("✓ All tables dropped")
            
            # 3. Recreate all tables
            print("\n[STEP 3] Recreating all tables from models...")
            db.create_all()
            print("✓ All tables recreated")
            
            # 4. Re-enable foreign key checks
            print("\n[STEP 4] Re-enabling foreign key checks...")
            try:
                connection.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
            except Exception as e:
                print(f"Note: FOREIGN_KEY_CHECKS not supported: {e}")
            
            # 5. Reset auto-increment counters for MySQL
            print("\n[STEP 5] Resetting auto-increment counters...")
            tables_to_reset = [
                'accounts', 'users', 'administrators', 'categories', 
                'tutorials', 'quizzes', 'quiz_questions', 'quiz_attempts',
                'reviews', 'user_bookmarks', 'user_progress', 'feedback',
                'practice_words'
            ]
            
            for table in tables_to_reset:
                try:
                    connection.execute(text(f"ALTER TABLE {table} AUTO_INCREMENT = 1"))
                    print(f"  ✓ Reset {table} AUTO_INCREMENT to 1")
                except Exception as e:
                    # Table might not exist or might be SQLite (no AUTO_INCREMENT)
                    print(f"  Note: Could not reset {table}: {e}")
            
            db.session.commit()
            connection.close()
            
            print("\n" + "=" * 60)
            print("DATABASE RESET COMPLETE")
            print("=" * 60)
            print("All tables dropped, recreated, and auto-increment reset to 1")
            print("You can now run seed.py to populate with fresh data")
            print("=" * 60)
            
        except Exception as e:
            print(f"\n❌ ERROR during database reset: {e}")
            import traceback
            traceback.print_exc()
            db.session.rollback()
            connection.close()
            raise

if __name__ == '__main__':
    reset_database()
