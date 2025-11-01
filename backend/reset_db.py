"""
Script to drop and recreate database from models
"""
import os
os.environ['FLASK_APP'] = 'app'

from app import create_app
from app.extensions import db

def reset_database():
    """Drop all tables and recreate them"""
    app = create_app()
    
    with app.app_context():
        print("Dropping all tables...")
        db.drop_all()
        print("All tables dropped successfully")
        
        print("Creating all tables...")
        db.create_all()
        print("All tables created successfully")
        
        print("Database reset complete!")

if __name__ == '__main__':
    reset_database()

