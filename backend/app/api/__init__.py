from flask import Blueprint


bp = Blueprint('api', __name__)

# import routes to register handlers
from . import categories, tutorials, quizzes, auth, progress, users, bookmarks, reviews, transcription, feedback  # noqa: E402,F401

# register blueprints
from .auth import auth_bp
from .users import users_bp
from .bookmarks import bookmark_bp
from .transcription import transcription_bp
from .feedback import feedback_bp
bp.register_blueprint(auth_bp, url_prefix='/auth')
bp.register_blueprint(users_bp)
bp.register_blueprint(bookmark_bp)
bp.register_blueprint(transcription_bp)
bp.register_blueprint(feedback_bp)


