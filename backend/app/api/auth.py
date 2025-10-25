from flask import Blueprint, request, jsonify, current_app
from sqlalchemy import select
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import functools
import re
import os
import uuid

from email_validator import validate_email as validate_email_address, EmailNotValidError  # pyright: ignore[reportMissingImports]


from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

from ..extensions import db
from ..models.user import User

auth_bp = Blueprint("auth", __name__)


def validate_email(email: str) -> bool:
    """Validate email format using the email-validator library."""
    try:
        # The library does all the heavy lifting.
        validate_email_address(email, check_deliverability=False)  # check_deliverability=False is faster for just validation
        return True
    except EmailNotValidError:
        # We only catch the specific error from the library.
        return False


def validate_password(password):
    """validate password strength"""
    if len(password) < 6:
        return False, "Password must be at least 6 characters long"
    return True, ""


def validate_name(name):
    """validate name format"""
    if len(name) < 2:
        return False, "Name must be at least 2 characters long"
    if not re.match(r"^[a-zA-Z\s]+$", name):
        return False, "Name can only contain letters and spaces"
    return True, ""


def save_profile_image(file):
    """save uploaded profile image and return the file path"""
    if not file:
        return None

    # create uploads directory if it doesn't exist
    upload_dir = os.path.join(current_app.root_path, "..", "uploads", "profiles")
    os.makedirs(upload_dir, exist_ok=True)

    # generate unique filename
    filename = secure_filename(file.filename)
    file_extension = os.path.splitext(filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"

    # save file
    file_path = os.path.join(upload_dir, unique_filename)
    file.save(file_path)

    # return relative path for database storage
    return f"/uploads/profiles/{unique_filename}"


def token_required(f):
    """decorator to require jwt token for protected routes using Flask-JWT-Extended"""

    @functools.wraps(f)
    @jwt_required()
    def decorated(*args, **kwargs):
        # get user id from JWT token
        user_id = get_jwt_identity()
        
        # find the user from the token's data
        from ..models.account import Account
        current_user = db.session.scalar(
            select(Account).where(Account.id == user_id)
        )
        if not current_user:
            return jsonify({"error": "User not found"}), 404

        # pass the user object to the route
        return f(current_user, *args, **kwargs)

    return decorated


@auth_bp.route("/login", methods=["POST"])
def login():
    """login endpoint for user authentication with enhanced validation"""
    try:
        data = request.get_json()

        # validate request data
        if not data:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "Request data is required",
                        "field": "general",
                    }
                ),
                400,
            )

        email = data.get("email", "").strip()
        password = data.get("password", "")

        # validate email
        if not email:
            return (
                jsonify(
                    {"success": False, "error": "Email is required", "field": "email"}
                ),
                400,
            )

        if not validate_email(email):
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "Please enter a valid email address",
                        "field": "email",
                    }
                ),
                400,
            )

        # validate password
        if not password:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "Password is required",
                        "field": "password",
                    }
                ),
                400,
            )

        # find user by email (check both User and Administrator tables via Account)
        from ..models.account import Account
        user = db.session.scalar(select(Account).where(Account.email == email))

        if not user:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "Invalid email or password",
                        "field": "general",
                    }
                ),
                401,
            )

        # check password using werkzeug's built-in function
        password_valid = check_password_hash(user.password_hash, password)
        
        if not password_valid:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "Invalid email or password",
                        "field": "general",
                    }
                ),
                401,
            )

        # generate jwt token for frontend using Flask-JWT-Extended
        token = create_access_token(
            identity=user.id,
            additional_claims={
                "email": user.email,
                "role": "admin" if user.account_type == "Administrator" else "user"
            },
            expires_delta=timedelta(days=7)
        )

        # determine role based on account type
        role = "admin" if user.account_type == "Administrator" else "user"
        
        return (
            jsonify(
                {
                    "success": True,
                    "message": "Login successful!",
                    "token": token,
                    "user": {
                        "id": user.id,
                        "email": user.email,
                        "name": user.name,
                        "role": role,
                        "profile_picture": user.profile_image_path,
                    },
                }
            ),
            200,
        )

    except Exception as e:
        current_app.logger.error(f"login error: {str(e)}")
        return (
            jsonify(
                {
                    "success": False,
                    "error": "An unexpected error occurred. Please try again.",
                    "field": "general",
                }
            ),
            500,
        )


@auth_bp.route("/register", methods=["POST"])
def register():
    """register endpoint for new user creation with enhanced validation and image upload"""
    
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

        # validate email
        if not email:
            return (
                jsonify(
                    {"success": False, "error": "Email is required", "field": "email"}
                ),
                400,
            )

        is_valid = validate_email(email)
        
        if not is_valid:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "Please enter a valid email address",
                        "field": "email",
                    }
                ),
                400,
            )

        # validate password
        if not password:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "Password is required",
                        "field": "password",
                    }
                ),
                400,
            )

        is_valid_password, password_error = validate_password(password)
        if not is_valid_password:
            return (
                jsonify(
                    {"success": False, "error": password_error, "field": "password"}
                ),
                400,
            )

        # validate name
        if not name:
            return (
                jsonify(
                    {"success": False, "error": "Name is required", "field": "name"}
                ),
                400,
            )

        is_valid_name, name_error = validate_name(name)
        if not is_valid_name:
            return (
                jsonify({"success": False, "error": name_error, "field": "name"}),
                400,
            )

        # check if user already exists
        existing_user = db.session.scalar(select(User).where(User.email == email))
        if existing_user:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "An account with this email already exists",
                        "field": "email",
                    }
                ),
                409,
            )

        # handle profile image upload
        profile_image_path = None
        if profile_image and profile_image.filename:
            # validate file type more strictly
            allowed_extensions = {"png", "jpg", "jpeg", "gif", "webp"}
            file_extension = (
                os.path.splitext(profile_image.filename)[1].lower().lstrip(".")
            )

            # also check MIME type
            allowed_mime_types = {
                "image/png",
                "image/jpeg",
                "image/jpg",
                "image/gif",
                "image/webp",
            }
            if (
                file_extension not in allowed_extensions
                or profile_image.content_type not in allowed_mime_types
            ):
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": "Invalid file type. Please upload a PNG, JPG, JPEG, GIF, or WEBP image.",
                            "field": "profile_image",
                        }
                    ),
                    400,
                )

            # validate file size (5MB max)
            profile_image.seek(0, 2)  # seek to end
            file_size = profile_image.tell()
            profile_image.seek(0)  # reset to beginning
            if file_size > 5 * 1024 * 1024:  # 5MB
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": "File size too large. Please upload an image smaller than 5MB.",
                            "field": "profile_image",
                        }
                    ),
                    400,
                )

            profile_image_path = save_profile_image(profile_image)

        # create new user
        user = User(
            email=email,
            password_hash=generate_password_hash(password),
            public_id=f"USR-{datetime.now().strftime('%Y%m%d')}-{hash(email) % 10000:04d}",
            name=name,  # Add the name field
            account_type="User",
            is_2fa_enabled=False,
        )

        # add profile image path (default avatar if no image uploaded)
        if profile_image_path:
            user.profile_image_path = profile_image_path
        else:
            # use default avatar if no image uploaded
            user.profile_image_path = current_app.config['DEFAULT_PROFILE_IMAGE_PATH']

        db.session.add(user)
        db.session.commit()

        # generate jwt token using Flask-JWT-Extended
        token = create_access_token(
            identity=user.id,
            additional_claims={
                "email": user.email,
                "role": "user"
            },
            expires_delta=timedelta(days=7)
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Registration successful! Welcome!",
                    "token": token,
                    "user": {
                        "id": user.id,
                        "email": user.email,
                        "name": name,
                        "role": "user",
                        "profile_picture": user.profile_image_path,
                    },
                }
            ),
            201,
        )

    except Exception as e:
        current_app.logger.error(f"registration error: {str(e)}")
        return (
            jsonify(
                {
                    "success": False,
                    "error": "An unexpected error occurred. Please try again.",
                    "field": "general",
                }
            ),
            500,
        )


@auth_bp.route("/me", methods=["GET"])
@token_required
def get_current_user(current_user):
    """get current user information"""
    try:
        return (
            jsonify(
                {
                    "id": current_user.id,
                    "email": current_user.email,
                    "name": current_user.email.split("@")[0],
                    "role": "user",
                }
            ),
            200,
        )
    except Exception as e:
        current_app.logger.error(f"get current user error: {str(e)}")
        return jsonify({"error": "internal server error"}), 500
