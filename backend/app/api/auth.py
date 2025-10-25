"""
Auth API endpoints - Thin layer delegating to services
Following README.txt separation of concerns
"""
from flask import request
from flask_jwt_extended import jwt_required
import functools

from ..services.auth_service import AuthService
from ..services.response_service import ResponseService
from ..services.error_service import APIError, handle_api_error
from flask import Blueprint

auth_bp = Blueprint('auth', __name__)


def token_required(f):
    """decorator to require jwt token for protected routes using Flask-JWT-Extended"""
    @functools.wraps(f)
    @jwt_required()
    def decorated(*args, **kwargs):
        # get user id from JWT token
        from flask_jwt_extended import get_jwt_identity
        from ..extensions import db
        from sqlalchemy import select
        from ..models.account import Account
        
        user_id = get_jwt_identity()
        
        # find the user from the token's data
        current_user = db.session.scalar(
            select(Account).where(Account.id == user_id)
        )
        if not current_user:
            from flask import jsonify
            return jsonify({"error": "User not found"}), 404

        # pass the user object to the route
        return f(current_user, *args, **kwargs)

    return decorated


@auth_bp.route("/login", methods=["POST"])
def login():
    """login endpoint for user authentication"""
    try:
        data = request.get_json()

        # validate request data
        if not data:
            return ResponseService.error_response("Request data is required", 400, "general")

        email = data.get("email", "").strip()
        password = data.get("password", "")

        return AuthService.login_user(email, password)

    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to login: {str(e)}", 500)


@auth_bp.route("/register", methods=["POST"])
def register():
    """register endpoint for new user creation"""
    
    try:
        # handle both JSON and form data
        if request.is_json:
            data = request.get_json()
            email = data.get("email", "").strip()
            password = data.get("password", "")
            name = data.get("name", "").strip()
            profile_image = None
        else:
            # handle form data with file upload
            email = request.form.get("email", "").strip()
            password = request.form.get("password", "")
            name = request.form.get("name", "").strip()
            profile_image = request.files.get("profile_image")

        return AuthService.register_user(email, password, name, profile_image)

    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to register: {str(e)}", 500)


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    """get current user information"""
    try:
        user = AuthService.get_current_user()
        if not user:
            return ResponseService.error_response("User not found", 404)
        
        return AuthService.get_user_info(user)

    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to get user info: {str(e)}", 500)