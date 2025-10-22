from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager


# init extensions without app, then bind in factory
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()


