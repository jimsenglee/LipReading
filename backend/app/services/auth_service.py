"""
Authentication service - Business logic for auth operations
Following README.txt separation of concerns
"""
from functools import wraps
from flask import jsonify, current_app
from flask_jwt_extended import get_jwt_identity, create_access_token
from datetime import datetime, timedelta
import sqlalchemy as sa
import re
import os
import uuid
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from email_validator import validate_email as validate_email_address, EmailNotValidError

from ..extensions import db
from ..models import Account, User
from .response_service import ResponseService
from .error_service import APIError
from ..utils.file_handler import FileHandler
from ..utils.id_generator import generate_public_id


class AuthService:
    """Authentication business logic service"""
    
    @staticmethod
    def get_current_user():
        """Get current authenticated user"""
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return None
            
        return db.session.scalar(
            sa.select(Account).where(Account.id == current_user_id)
        )
    
    @staticmethod
    def require_admin():
        """Decorator for admin-only endpoints"""
        def decorator(f):
            @wraps(f)
            def decorated_function(*args, **kwargs):
                user = AuthService.get_current_user()
                if not user or user.account_type != 'Administrator':
                    return jsonify({'error': 'Admin access required'}), 403
                return f(*args, **kwargs)
            return decorated_function
        return decorator
    
    @staticmethod
    def require_auth():
        """Decorator for authenticated endpoints"""
        def decorator(f):
            @wraps(f)
            def decorated_function(*args, **kwargs):
                user = AuthService.get_current_user()
                if not user:
                    return jsonify({'error': 'Authentication required'}), 401
                return f(*args, **kwargs)
            return decorated_function
        return decorator
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """validate email format using the email-validator library"""
        try:
            validate_email_address(email, check_deliverability=False)
            return True
        except EmailNotValidError:
            return False
    
    @staticmethod
    def validate_password(password):
        """validate password strength"""
        if len(password) < 6:
            return False, "Password must be at least 6 characters long"
        return True, ""
    
    @staticmethod
    def validate_name(name):
        """validate name format"""
        if len(name) < 2:
            return False, "Name must be at least 2 characters long"
        if not re.match(r"^[a-zA-Z\s]+$", name):
            return False, "Name can only contain letters and spaces"
        return True, ""
    
    @staticmethod
    def save_profile_image(file):
        """save uploaded profile image and return the file path"""
        if not file:
            return None

        # use utility function to create upload directory
        upload_dir = FileHandler.create_upload_directory("uploads/profiles")
        
        # use utility function to generate unique filename
        unique_filename = FileHandler.generate_unique_filename(file.filename)
        
        # save file using utility function
        file_path = FileHandler.save_uploaded_file(file, upload_dir, unique_filename)
        
        # return relative path for database storage
        return f"/uploads/profiles/{unique_filename}"
    
    @staticmethod
    def login_user(email, password):
        """login user with email and password"""
        try:
            # validate email
            if not email:
                raise APIError("Email is required", 400, "email")
            
            if not AuthService.validate_email(email):
                raise APIError("Please enter a valid email address", 400, "email")
            
            # validate password
            if not password:
                raise APIError("Password is required", 400, "password")
            
            # find user by email
            user = db.session.scalar(sa.select(Account).where(Account.email == email))
            
            if not user:
                raise APIError("Invalid email or password", 401, "general")
            
            # check password
            password_valid = check_password_hash(user.password_hash, password)
            if not password_valid:
                raise APIError("Invalid email or password", 401, "general")
            
            # generate jwt token
            token = create_access_token(
                identity=user.id,
                additional_claims={
                    "email": user.email,
                    "role": "admin" if user.account_type == "Administrator" else "user"
                },
                expires_delta=timedelta(days=7)
            )
            
            # determine role
            role = "admin" if user.account_type == "Administrator" else "user"
            
            return ResponseService.success_response({
                "message": "Login successful!",
                "token": token,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "name": user.name,
                    "role": role,
                    "profile_picture": user.profile_image_path,
                }
            })
            
        except APIError:
            raise
        except Exception as e:
            current_app.logger.error(f"login error: {str(e)}")
            raise APIError("An unexpected error occurred. Please try again.", 500)
    
    @staticmethod
    def register_user(email, password, name, profile_image=None):
        """register new user with email, password, name and optional profile image"""
        try:
            # validate email
            if not email:
                raise APIError("Email is required", 400, "email")
            
            if not AuthService.validate_email(email):
                raise APIError("Please enter a valid email address", 400, "email")
            
            # validate password
            if not password:
                raise APIError("Password is required", 400, "password")
            
            is_valid_password, password_error = AuthService.validate_password(password)
            if not is_valid_password:
                raise APIError(password_error, 400, "password")
            
            # validate name
            if not name:
                raise APIError("Name is required", 400, "name")
            
            is_valid_name, name_error = AuthService.validate_name(name)
            if not is_valid_name:
                raise APIError(name_error, 400, "name")
            
            # check if user already exists
            existing_user = db.session.scalar(sa.select(Account).where(Account.email == email))
            if existing_user:
                raise APIError("An account with this email already exists", 409, "email")
            
            # handle profile image upload
            profile_image_path = None
            if profile_image and profile_image.filename:
                # validate file type
                allowed_extensions = {"png", "jpg", "jpeg", "gif", "webp"}
                file_extension = os.path.splitext(profile_image.filename)[1].lower().lstrip(".")
                
                allowed_mime_types = {
                    "image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"
                }
                
                if (file_extension not in allowed_extensions or 
                    profile_image.content_type not in allowed_mime_types):
                    raise APIError("Invalid file type. Please upload a PNG, JPG, JPEG, GIF, or WEBP image.", 400, "profile_image")
                
                # validate file size (5MB max)
                profile_image.seek(0, 2)
                file_size = profile_image.tell()
                profile_image.seek(0)
                if file_size > 5 * 1024 * 1024:
                    raise APIError("File size too large. Please upload an image smaller than 5MB.", 400, "profile_image")
                
                profile_image_path = AuthService.save_profile_image(profile_image)
            
            # create new user using utility function for public ID generation
            user = User()
            user.public_id = generate_public_id(User, "ACC-U")
            user.name = name
            user.email = email
            user.password_hash = generate_password_hash(password)
            user.account_type = "User"
            user.is_2fa_enabled = False
            
            # add profile image path
            if profile_image_path:
                user.profile_image_path = profile_image_path
            else:
                user.profile_image_path = current_app.config['DEFAULT_PROFILE_IMAGE_PATH']
            
            db.session.add(user)
            db.session.commit()
            
            # generate jwt token
            token = create_access_token(
                identity=user.id,
                additional_claims={
                    "email": user.email,
                    "role": "user"
                },
                expires_delta=timedelta(days=7)
            )
            
            return ResponseService.success_response({
                "message": "Registration successful! Welcome!",
                "token": token,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "name": name,
                    "role": "user",
                    "profile_picture": user.profile_image_path,
                }
            })
            
        except APIError:
            raise
        except Exception as e:
            current_app.logger.error(f"registration error: {str(e)}")
            raise APIError("An unexpected error occurred. Please try again.", 500)
    
    @staticmethod
    def get_user_info(user):
        """get user information for authenticated user"""
        try:
            return ResponseService.success_response({
                "id": user.id,
                "email": user.email,
                "name": user.email.split("@")[0],
                "role": "user",
            })
        except Exception as e:
            current_app.logger.error(f"get user info error: {str(e)}")
            raise APIError("internal server error", 500)
