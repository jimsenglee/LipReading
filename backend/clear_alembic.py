from app import create_app
from app.extensions import db
from sqlalchemy import text
app = create_app()
with app.app_context():
    try:
        db.session.execute(text('DELETE FROM alembic_version'))
        db.session.commit()
        print('Cleared alembic_version')
    except Exception as e:
        print('Error:', e)
