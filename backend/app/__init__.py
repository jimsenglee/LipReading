from flask import Flask
from .extensions import db, migrate, jwt
from .config import Config
from flask_cors import CORS
import os


def create_app() -> Flask:
    # create and configure the flask app
    app = Flask(__name__)
    app.config.from_object(Config)

    # init extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app, resources={
        r"/api/*": {"origins": "*"},
        r"/uploads/*": {"origins": "*"}
    })

    # serve static files from uploads directory
    from flask import send_from_directory
    uploads_dir = os.path.join(os.path.dirname(__file__), '..', 'uploads')
    
    @app.route('/uploads/<path:filename>')
    def uploaded_file(filename):
        return send_from_directory(uploads_dir, filename)

    # import models so migrations can detect them
    # note: keep local import to avoid circulars during app creation
    from . import models  # noqa: F401

    # register api blueprint
    from .api import bp as api_bp
    app.register_blueprint(api_bp, url_prefix='/api')

    return app


 