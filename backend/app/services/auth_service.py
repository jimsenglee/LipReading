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
from werkzeug.security import check_password_hash as check_pw_hash
from werkzeug.utils import secure_filename
from email_validator import validate_email as validate_email_address, EmailNotValidError

from ..extensions import db
from ..models import Account, User, LoginActivity
from .response_service import ResponseService
from .error_service import APIError
from ..utils.file_handler import FileHandler
from ..utils.id_generator import generate_public_id
from ..utils.email_service import EmailService
import secrets
import random
from datetime import datetime, timedelta
try:
    import pyotp
except ImportError:
    pyotp = None


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
    def log_login_activity(user_id: int, ip_address: str | None = None, device_info: str | None = None):
        """log login activity to database"""
        try:
            login_activity = LoginActivity()
            login_activity.user_id = user_id
            login_activity.ip_address = ip_address
            login_activity.device_info = device_info
            db.session.add(login_activity)
            db.session.commit()
        except Exception as e:
            current_app.logger.error(f"failed to log login activity: {str(e)}")
            # don't raise error, just log it - login should still succeed
    
    @staticmethod
    def login_user(email, password, remember_me: bool = False, ip_address: str | None = None, device_info: str | None = None):
        """login user with email and password with attempt tracking and lockout"""
        try:
            # validate email
            if not email:
                raise APIError("Email is required", 400, field="email")
            
            if not AuthService.validate_email(email):
                raise APIError("Please enter a valid email address", 400, field="email")
            
            # validate password
            if not password:
                raise APIError("Password is required", 400, field="password")
            
            # find user by email
            user = db.session.scalar(sa.select(Account).where(Account.email == email))
            
            if not user:
                # don't reveal if user exists - security best practice
                raise APIError("Invalid email or password", 401, field="general")
            
            # check if account is locked (tiered lockout system)
            if user.account_locked_until and user.account_locked_until > datetime.utcnow():
                remaining_seconds = int((user.account_locked_until - datetime.utcnow()).total_seconds())
                lockout_count = user.lockout_count or 0
                current_app.logger.warning(f"[DEBUG] login: account locked for user_id: {user.id}, lockout_count: {lockout_count}, remaining: {remaining_seconds}s")
                
                # determine lockout type based on lockout_count
                if lockout_count >= 3:
                    # permanent lockout - account should be inactive
                    if user.status != 'inactive':
                        user.status = 'inactive'
                        db.session.commit()
                    raise APIError(
                        "Your account has been permanently locked due to multiple security violations. Please contact support for assistance.",
                        403,
                        field="account_inactive"
                    )
                else:
                    # temporary lockout
                    raise APIError(
                        f"Account is temporarily locked. Please try again in {remaining_seconds} second(s).",
                        423,  # Locked
                        field="account_locked",
                        extra_data={
                            "remaining_seconds": remaining_seconds,
                            "lockout_count": lockout_count
                        }
                    )
            elif user.account_locked_until and user.account_locked_until <= datetime.utcnow():
                # lockout period expired, reset failed attempts but keep lockout_count
                user.account_locked_until = None
                user.failed_login_attempts = 0
                db.session.commit()
                current_app.logger.info(f"[DEBUG] login: lockout expired for user_id: {user.id}, resetting failed attempts (lockout_count: {user.lockout_count})")
            
            # check if account is inactive
            if user.status == 'inactive':
                current_app.logger.warning(f"[DEBUG] login: account inactive for user_id: {user.id}")
                raise APIError(
                    "Your account has been deactivated. Please contact support for assistance.",
                    403,
                    field="account_inactive"
                )
            
            # check password
            password_valid = check_password_hash(user.password_hash, password)
            
            if not password_valid:
                # increment failed login attempts
                user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
                current_app.logger.warning(f"[DEBUG] login: failed attempt {user.failed_login_attempts} for user_id: {user.id}")
                
                max_attempts = 5
                
                # check if max attempts reached - implement tiered lockout
                if user.failed_login_attempts >= max_attempts:
                    # increment lockout count
                    lockout_count = (user.lockout_count or 0) + 1
                    user.lockout_count = lockout_count
                    
                    # tiered lockout system: 1st=1min, 2nd=3min, 3rd=permanent
                    if lockout_count == 1:
                        # first lockout: 1 minute
                        lockout_duration_minutes = 1
                        lockout_message = "Too many failed login attempts. Account locked for 1 minute."
                    elif lockout_count == 2:
                        # second lockout: 3 minutes
                        lockout_duration_minutes = 3
                        lockout_message = "Too many failed login attempts. Account locked for 3 minutes."
                    elif lockout_count >= 3:
                        # third lockout: permanent (deactivate account)
                        user.status = 'inactive'
                        user.account_locked_until = None
                        db.session.commit()
                        current_app.logger.warning(f"[DEBUG] login: account permanently locked (deactivated) for user_id: {user.id} after {lockout_count} lockouts")
                        raise APIError(
                            "Your account has been permanently locked due to multiple security violations. Please contact support for assistance.",
                            403,
                            field="account_inactive"
                        )
                    
                    # set lockout duration for temporary lockouts
                    user.account_locked_until = datetime.utcnow() + timedelta(minutes=lockout_duration_minutes)
                    remaining_seconds = lockout_duration_minutes * 60
                    current_app.logger.warning(f"[DEBUG] login: account locked for user_id: {user.id}, lockout_count: {lockout_count}, duration: {lockout_duration_minutes}min, until: {user.account_locked_until.isoformat()}")
                    db.session.commit()
                    
                    raise APIError(
                        lockout_message,
                        423,
                        field="account_locked",
                        extra_data={
                            "remaining_seconds": remaining_seconds,
                            "lockout_count": lockout_count,
                            "failed_attempts": user.failed_login_attempts
                        }
                    )
                else:
                    # save failed attempt count
                    remaining_attempts = max_attempts - user.failed_login_attempts
                    db.session.commit()
                    current_app.logger.warning(f"[DEBUG] login: {remaining_attempts} attempts remaining for user_id: {user.id}")
                    
                    # different error messages based on remaining attempts
                    if remaining_attempts == 1:
                        error_message = "Invalid email or password. This is your last attempt before account lockout."
                    elif remaining_attempts <= 3:
                        error_message = f"Invalid email or password. {remaining_attempts} attempts remaining before lockout."
                    else:
                        error_message = "Invalid email or password. Please check your credentials and try again."
                    
                    raise APIError(
                        error_message,
                        401,
                        field="invalid_credentials",
                        extra_data={
                            "remaining_attempts": remaining_attempts,
                            "failed_attempts": user.failed_login_attempts
                        }
                    )
            
            # login successful - reset failed attempts and lockout (but keep lockout_count for lifetime tracking)
            if user.failed_login_attempts > 0 or user.account_locked_until:
                current_app.logger.info(f"[DEBUG] login: successful login, resetting failed attempts for user_id: {user.id} (lockout_count: {user.lockout_count})")
                user.failed_login_attempts = 0
                user.account_locked_until = None
                # note: lockout_count does NOT reset - it tracks lifetime lockouts (1st=1min, 2nd=3min, 3rd=permanent)
                db.session.commit()
            
            # check if 2FA is enabled for regular users
            if user.account_type == "User":
                # get User instance to check is_2fa_enabled
                user_instance = db.session.scalar(sa.select(User).where(User.id == user.id))
                if user_instance and user_instance.is_2fa_enabled:
                    # return temporary token that requires 2FA verification
                    # generate short-lived token for 2FA verification
                    temp_expires = timedelta(minutes=5)
                    temp_token = create_access_token(
                        identity=user.id,
                        additional_claims={
                            "email": user.email,
                            "role": "user",
                            "requires_2fa": True
                        },
                        expires_delta=temp_expires
                    )
                    
                    return jsonify({
                        "requires_2fa": True,
                        "temp_token": temp_token,
                        "message": "Please enter your 2FA code to complete login."
                    })
            
            # determine token expiration based on remember_me
            if remember_me:
                expires_delta = timedelta(days=30)
                current_app.logger.info(f"[DEBUG] login: remember_me=True, token expires in 30 days")
            else:
                expires_delta = timedelta(hours=24)
                current_app.logger.info(f"[DEBUG] login: remember_me=False, token expires in 24 hours")
            
            # generate jwt token with user name included
            token = create_access_token(
                identity=user.id,
                additional_claims={
                    "email": user.email,
                    "name": user.name,  # include name in token for consistency
                    "role": "admin" if user.account_type == "Administrator" else "user"
                },
                expires_delta=expires_delta
            )
            current_app.logger.debug(f"[DEBUG] login: JWT token generated successfully for user_id: {user.id}, name: {user.name}")
            
            # log login activity
            AuthService.log_login_activity(user_id=user.id, ip_address=ip_address, device_info=device_info)
            
            # determine role
            role = "admin" if user.account_type == "Administrator" else "user"
            
            return jsonify({
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
            user: User = User()
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
            
            return jsonify({
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
            # determine role based on account type
            role = "admin" if user.account_type == "Administrator" else "user"
            
            return jsonify({
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": role,
                "profile_picture": user.profile_image_path,
            })
        except Exception as e:
            current_app.logger.error(f"get user info error: {str(e)}")
            raise APIError("internal server error", 500)
    
    @staticmethod
    def request_password_reset(email: str):
        """request password reset - generate token and send email with rate limiting"""
        try:
            current_app.logger.info(f"[DEBUG] password reset requested for email: {email}")
            
            # validate email
            if not email:
                current_app.logger.warning("[DEBUG] password reset: email is empty")
                raise APIError("Email is required", 400, field="email")
            
            if not AuthService.validate_email(email):
                current_app.logger.warning(f"[DEBUG] password reset: invalid email format: {email}")
                raise APIError("Please enter a valid email address", 400, field="email")
            
            # find user by email
            user = db.session.scalar(sa.select(Account).where(Account.email == email))
            
            # rate limiting: check if user exists and has made recent request (60 second cooldown)
            if user and user.last_password_reset_request:
                time_since_last_request = (datetime.utcnow() - user.last_password_reset_request).total_seconds()
                cooldown_seconds = 60  # 60 second cooldown between requests
                
                if time_since_last_request < cooldown_seconds:
                    remaining_seconds = int(cooldown_seconds - time_since_last_request)
                    current_app.logger.warning(f"[DEBUG] password reset: rate limit hit for user_id: {user.id}, remaining: {remaining_seconds}s")
                    raise APIError(
                        f"Please wait {remaining_seconds} second(s) before requesting another password reset.",
                        429,  # Too Many Requests
                        field="rate_limit",
                        extra_data={"remaining_seconds": remaining_seconds, "cooldown_seconds": cooldown_seconds}
                    )
            
            # always return success message (don't reveal if email exists) - security best practice
            if not user:
                current_app.logger.warning(f"[DEBUG] password reset: user not found for email: {email}")
                # return generic success message without sending email
                return jsonify({
                    "message": "If an account with that email exists, a password reset link has been sent.",
                    "email_exists": False  # internal flag for frontend to show appropriate message
                })
            
            current_app.logger.info(f"[DEBUG] password reset: user found - user_id: {user.id}, email: {user.email}")
            
            # import PasswordResetToken here to avoid circular import
            from ..models.password_reset_token import PasswordResetToken
            
            # generate secure token
            token = secrets.token_urlsafe(32)
            current_app.logger.debug(f"[DEBUG] password reset: generated token (first 10 chars): {token[:10]}...")
            
            # set expiration to 1 hour from now
            expires_at = datetime.utcnow() + timedelta(hours=1)
            current_app.logger.debug(f"[DEBUG] password reset: token expires at: {expires_at.isoformat()}")
            
            # invalidate any existing tokens for this user
            db.session.execute(
                sa.update(PasswordResetToken)
                .where(PasswordResetToken.user_id == user.id)
                .where(PasswordResetToken.used == False)
                .values(used=True)
            )
            current_app.logger.debug(f"[DEBUG] password reset: invalidated existing tokens for user_id: {user.id}")
            
            # create new reset token
            reset_token = PasswordResetToken()
            reset_token.user_id = user.id
            reset_token.token = token
            reset_token.expires_at = expires_at
            reset_token.used = False
            
            db.session.add(reset_token)
            
            # update last password reset request time for rate limiting
            user.last_password_reset_request = datetime.utcnow()
            current_app.logger.debug(f"[DEBUG] password reset: updated last_password_reset_request to: {user.last_password_reset_request.isoformat()}")
            
            db.session.commit()
            current_app.logger.info(f"[DEBUG] password reset: token saved to database for user_id: {user.id}")
            
            # generate reset link
            frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:8080')
            reset_link = f"{frontend_url}/reset-password?token={token}"
            current_app.logger.info(f"[DEBUG] password reset: generated reset link: {reset_link}")
            
            # send email
            current_app.logger.info(f"[DEBUG] password reset: attempting to send email to: {user.email}")
            email_sent = EmailService.send_password_reset_email(user.email, reset_link)
            
            if not email_sent:
                current_app.logger.error(f"[DEBUG] password reset: failed to send email to {user.email}")
                raise APIError("Failed to send reset email. Please try again later.", 500)
            
            current_app.logger.info(f"[DEBUG] password reset: email sent successfully to {user.email}")
            
            return jsonify({
                "message": "If an account with that email exists, a password reset link has been sent.",
                "email_exists": True,  # internal flag
                "cooldown_seconds": 60  # return cooldown info for frontend
            })
            
        except APIError:
            raise
        except Exception as e:
            current_app.logger.error(f"[DEBUG] password reset request error: {str(e)}", exc_info=True)
            raise APIError("An unexpected error occurred. Please try again.", 500)
    
    @staticmethod
    def verify_reset_token(token: str):
        """verify password reset token validity"""
        try:
            if not token:
                raise APIError("Token is required", 400, "token")
            
            from ..models.password_reset_token import PasswordResetToken
            
            # find token in database
            reset_token = db.session.scalar(
                sa.select(PasswordResetToken).where(PasswordResetToken.token == token)
            )
            
            if not reset_token:
                raise APIError("Invalid or expired reset token", 400, "token")
            
            # check if token is expired
            if datetime.utcnow() > reset_token.expires_at:
                raise APIError("Invalid or expired reset token", 400, "token")
            
            # check if token is already used
            if reset_token.used:
                raise APIError("Invalid or expired reset token", 400, "token")
            
            return jsonify({
                "valid": True,
                "message": "Token is valid"
            })
            
        except APIError:
            raise
        except Exception as e:
            current_app.logger.error(f"verify reset token error: {str(e)}")
            raise APIError("An unexpected error occurred. Please try again.", 500)
    
    @staticmethod
    def reset_password(token: str, new_password: str):
        """reset password using valid token"""
        try:
            if not token:
                raise APIError("Token is required", 400, "token")
            
            if not new_password:
                raise APIError("Password is required", 400, "password")
            
            # validate password strength
            is_valid_password, password_error = AuthService.validate_password(new_password)
            if not is_valid_password:
                raise APIError(password_error, 400, "password")
            
            from ..models.password_reset_token import PasswordResetToken
            
            # find token in database
            reset_token = db.session.scalar(
                sa.select(PasswordResetToken).where(PasswordResetToken.token == token)
            )
            
            if not reset_token:
                raise APIError("Invalid or expired reset token", 400, "token")
            
            # check if token is expired
            if datetime.utcnow() > reset_token.expires_at:
                raise APIError("Invalid or expired reset token", 400, "token")
            
            # check if token is already used
            if reset_token.used:
                raise APIError("Invalid or expired reset token", 400, "token")
            
            # get user
            user = db.session.scalar(sa.select(Account).where(Account.id == reset_token.user_id))
            
            if not user:
                raise APIError("User not found", 404, "user")
            
            # update password
            user.password_hash = generate_password_hash(new_password)
            
            # mark token as used
            reset_token.used = True
            
            db.session.commit()
            
            # cleanup expired tokens (optional, can be done via cron job)
            db.session.execute(
                sa.delete(PasswordResetToken)
                .where(PasswordResetToken.expires_at < datetime.utcnow())
            )
            db.session.commit()
            
            return jsonify({
                "message": "Password has been reset successfully. You can now login with your new password."
            })
            
        except APIError:
            raise
        except Exception as e:
            current_app.logger.error(f"reset password error: {str(e)}")
            raise APIError("An unexpected error occurred. Please try again.", 500)
    
    @staticmethod
    def login_with_google(google_user_info: dict, ip_address: str | None = None, device_info: str | None = None):
        """login or register user with Google OAuth"""
        try:
            from ..models.third_party_app import ThirdPartyApp
            
            google_id = google_user_info.get('google_id')
            email = google_user_info.get('email')
            name = google_user_info.get('name')
            picture = google_user_info.get('picture')
            
            if not google_id or not email:
                raise APIError("Invalid Google user info", 400, "oauth")
            
            # check if user exists by google_id
            user = db.session.scalar(sa.select(Account).where(Account.google_id == google_id))
            
            # if not found, check by email
            if not user:
                user = db.session.scalar(sa.select(Account).where(Account.email == email))
            
            # if user exists, update google_id if missing
            if user:
                if not user.google_id:
                    user.google_id = google_id
                
                # update name if google provides better name (user might have changed name on google)
                if name and name.strip():
                    current_app.logger.debug(f"[DEBUG] Google login: updating existing user name from '{user.name}' to '{name}'")
                    user.name = name
                
                # update profile picture if available and not set
                if picture and not user.profile_image_path:
                    user.profile_image_path = picture
                
                db.session.commit()
                
                # check if ThirdPartyApp record exists
                existing_app = db.session.scalar(
                    sa.select(ThirdPartyApp).where(
                        ThirdPartyApp.user_id == user.id,
                        ThirdPartyApp.app_name == 'Google'
                    )
                )
                
                # create ThirdPartyApp record if it doesn't exist
                if not existing_app:
                    google_app = ThirdPartyApp()
                    google_app.user_id = user.id
                    google_app.app_name = 'Google'
                    db.session.add(google_app)
                    db.session.commit()
            else:
                # create new user
                user = User()
                user.public_id = generate_public_id(User, "ACC-U")
                user.name = name
                user.email = email
                user.google_id = google_id
                user.account_type = "User"
                user.is_2fa_enabled = False
                user.password_hash = ""  # empty password for OAuth users
                
                # set profile image
                if picture:
                    user.profile_image_path = picture
                else:
                    user.profile_image_path = current_app.config['DEFAULT_PROFILE_IMAGE_PATH']
                
                db.session.add(user)
                db.session.flush()
                
                # create ThirdPartyApp record
                google_app = ThirdPartyApp()
                google_app.user_id = user.id
                google_app.app_name = 'Google'
                db.session.add(google_app)
                db.session.commit()
            
            # determine token expiration (30 days for OAuth users - "remember me" by default)
            expires_delta = timedelta(days=30)
            
            # generate jwt token with user name included
            token = create_access_token(
                identity=user.id,
                additional_claims={
                    "email": user.email,
                    "name": user.name,  # include name in token
                    "role": "admin" if user.account_type == "Administrator" else "user"
                },
                expires_delta=expires_delta
            )
            
            current_app.logger.info(f"[DEBUG] Google login: user name set to: {user.name}")
            
            # log login activity
            AuthService.log_login_activity(user_id=user.id, ip_address=ip_address, device_info=device_info)
            
            # determine role
            role = "admin" if user.account_type == "Administrator" else "user"
            
            return {
                "token": token,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "name": user.name,
                    "role": role,
                    "profile_picture": user.profile_image_path,
                }
            }
            
        except APIError:
            raise
        except Exception as e:
            current_app.logger.error(f"Google OAuth login error: {str(e)}")
            raise APIError("An unexpected error occurred during Google login.", 500)
    
    @staticmethod
    def generate_2fa_secret(user_id: int):
        """generate 2FA secret and QR code URI"""
        try:
            if pyotp is None:
                raise APIError("2FA library not installed. Please install pyotp.", 500)
            
            # get user
            user = db.session.scalar(sa.select(Account).where(Account.id == user_id))
            if not user:
                raise APIError("User not found", 404, "user")
            
            # generate TOTP secret
            secret = pyotp.random_base32()
            
            # generate QR code URI
            app_name = current_app.config.get('APP_NAME', 'LipReading')
            totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
                name=user.email,
                issuer_name=app_name
            )
            
            # return as dict (not jsonify) since it will be wrapped in jsonify in the API endpoint
            return {
                "secret": secret,
                "qr_code_uri": totp_uri
            }
            
        except APIError:
            raise
        except Exception as e:
            current_app.logger.error(f"generate 2FA secret error: {str(e)}")
            raise APIError("An unexpected error occurred while generating 2FA secret.", 500)
    
    @staticmethod
    def enable_2fa(user_id: int, secret: str, verification_code: str):
        """enable 2FA with verification code"""
        try:
            if pyotp is None:
                raise APIError("2FA library not installed. Please install pyotp.", 500)
            
            # get user (must be User type)
            user = db.session.scalar(sa.select(User).where(User.id == user_id))
            if not user:
                raise APIError("User not found", 404, "user")
            
            # verify code
            totp = pyotp.TOTP(secret)
            if not totp.verify(verification_code, valid_window=1):
                raise APIError("Invalid verification code. Please try again.", 400, "verification_code")
            
            # store secret and enable 2FA
            user._2fa_secret = secret
            user.is_2fa_enabled = True
            db.session.commit()
            
            return jsonify({
                "message": "Two-factor authentication has been enabled successfully."
            })
            
        except APIError:
            raise
        except Exception as e:
            current_app.logger.error(f"enable 2FA error: {str(e)}")
            raise APIError("An unexpected error occurred while enabling 2FA.", 500)
    
    @staticmethod
    def disable_2fa(user_id: int, password: str):
        """disable 2FA with password verification"""
        try:
            # get user
            user = db.session.scalar(sa.select(User).where(User.id == user_id))
            if not user:
                raise APIError("User not found", 404, "user")
            
            # verify password
            if not check_pw_hash(user.password_hash, password):
                raise APIError("Invalid password", 400, "password")
            
            # clear secret and disable 2FA
            user._2fa_secret = None
            user.is_2fa_enabled = False
            db.session.commit()
            
            return jsonify({
                "message": "Two-factor authentication has been disabled successfully."
            })
            
        except APIError:
            raise
        except Exception as e:
            current_app.logger.error(f"disable 2FA error: {str(e)}")
            raise APIError("An unexpected error occurred while disabling 2FA.", 500)
    
    @staticmethod
    def verify_2fa_code(user_id: int, code: str):
        """verify 2FA code for user"""
        try:
            if pyotp is None:
                raise APIError("2FA library not installed. Please install pyotp.", 500)
            
            # get user
            user = db.session.scalar(sa.select(User).where(User.id == user_id))
            if not user:
                raise APIError("User not found", 404, "user")
            
            if not user._2fa_secret:
                raise APIError("2FA is not enabled for this user", 400, "2fa")
            
            # verify code
            totp = pyotp.TOTP(user._2fa_secret)
            if not totp.verify(code, valid_window=1):
                raise APIError("Invalid 2FA code", 400, "code")
            
            return True
            
        except APIError:
            raise
        except Exception as e:
            current_app.logger.error(f"verify 2FA code error: {str(e)}")
            raise APIError("An unexpected error occurred while verifying 2FA code.", 500)
    
    @staticmethod
    def send_2fa_code_email(user_id: int):
        """send 2FA code via email (alternative to TOTP)"""
        try:
            # get user
            user = db.session.scalar(sa.select(User).where(User.id == user_id))
            if not user:
                raise APIError("User not found", 404, "user")
            
            # generate 6-digit code
            code = str(random.randint(100000, 999999))
            
            # store code temporarily (in-memory cache - in production, use Redis or database)
            # for now, we'll just send the email
            # in production, store with expiration timestamp
            
            # send email
            email_sent = EmailService.send_2fa_code_email(user.email, code)
            
            if not email_sent:
                raise APIError("Failed to send 2FA code email. Please try again later.", 500)
            
            # note: in production, store code in cache/database with expiration
            # for now, just return success
            return jsonify({
                "message": "2FA code has been sent to your email.",
                "code": code  # remove this in production - only for testing
            })
            
        except APIError:
            raise
        except Exception as e:
            current_app.logger.error(f"send 2FA code email error: {str(e)}")
            raise APIError("An unexpected error occurred while sending 2FA code.", 500)
