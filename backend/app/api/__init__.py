from flask import Blueprint


bp = Blueprint('api', __name__)

# import routes to register handlers
from . import categories, tutorials, quizzes  # noqa: E402,F401


