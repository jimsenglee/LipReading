from app import create_app
from app.extensions import db

app = create_app()
with app.app_context():
    try:
        # Add created_at and updated_at columns if they don't exist
        db.session.execute(db.text("""
            ALTER TABLE tutorials 
            ADD COLUMN created_at DATETIME NOT NULL DEFAULT NOW()
        """))
        print("Added created_at column")
    except Exception as e:
        if "Duplicate column name" in str(e):
            print("created_at column already exists")
        else:
            print(f"Error adding created_at: {e}")
    
    try:
        db.session.execute(db.text("""
            ALTER TABLE tutorials 
            ADD COLUMN updated_at DATETIME NOT NULL DEFAULT NOW()
        """))
        print("Added updated_at column")
    except Exception as e:
        if "Duplicate column name" in str(e):
            print("updated_at column already exists")
        else:
            print(f"Error adding updated_at: {e}")
    
    # Update existing records with proper timestamps
    db.session.execute(db.text("""
        UPDATE tutorials 
        SET created_at = NOW(), updated_at = NOW() 
        WHERE created_at IS NULL OR updated_at IS NULL
    """))
    
    db.session.commit()
    print("Successfully added missing columns and updated existing records")

