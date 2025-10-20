from flask import Flask
from .extensions import db, migrate
from .config import Config
from flask_cors import CORS


def create_app() -> Flask:
    # create and configure the flask app
    app = Flask(__name__)
    app.config.from_object(Config)

    # init extensions
    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # import models so migrations can detect them
    # note: keep local import to avoid circulars during app creation
    from . import models  # noqa: F401

    # register api blueprint
    from .api import bp as api_bp
    app.register_blueprint(api_bp, url_prefix='/api')

    return app


 