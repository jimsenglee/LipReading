from flask import Blueprint


bp = Blueprint('api', __name__)

# import routes to register handlers
from . import categories, tutorials, quizzes, auth, progress, users  # noqa: E402,F401

# register blueprints
from .auth import auth_bp
from .progress import progress_bp
from .users import users_bp
bp.register_blueprint(auth_bp, url_prefix='/auth')
bp.register_blueprint(progress_bp, url_prefix='/progress')
bp.register_blueprint(users_bp)


