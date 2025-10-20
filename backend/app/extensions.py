from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate


# init extensions without app, then bind in factory
db = SQLAlchemy()
migrate = Migrate()


