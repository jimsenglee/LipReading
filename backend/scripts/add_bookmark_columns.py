"""
script to add progress tracking columns to user_bookmarks table
run this if migration state is out of sync
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from app.extensions import db
from sqlalchemy import text

app = create_app()

with app.app_context():
    try:
        # check and add columns if they don't exist
        with db.engine.connect() as conn:
            # get existing columns
            result = conn.execute(text("""
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'user_bookmarks'
            """))
            existing_columns = [row[0] for row in result]
            
            print(f"[DEBUG] Existing columns: {existing_columns}")
            
            # add columns if they don't exist
            columns_to_add = [
                ('progress_percentage', 'INTEGER NOT NULL DEFAULT 0'),
                ('last_watched_position', 'INTEGER NOT NULL DEFAULT 0'),
                ('total_watch_time', 'INTEGER NOT NULL DEFAULT 0'),
                ('is_completed', 'BOOLEAN NOT NULL DEFAULT 0'),
                ('completed_at', 'DATETIME NULL'),
                ('enrolled_at', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP'),
                ('last_accessed_at', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP'),
            ]
            
            for col_name, col_def in columns_to_add:
                if col_name not in existing_columns:
                    print(f"[DEBUG] Adding column: {col_name}")
                    conn.execute(text(f"ALTER TABLE user_bookmarks ADD COLUMN {col_name} {col_def}"))
                    conn.commit()
                    print(f"[DEBUG] Added column: {col_name}")
                else:
                    print(f"[DEBUG] Column {col_name} already exists, skipping")
            
            print("[DEBUG] All columns added successfully!")
            
    except Exception as e:
        print(f"[ERROR] Failed to add columns: {str(e)}")
        raise

