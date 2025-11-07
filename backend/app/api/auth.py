"""
Auth API endpoints - Thin layer delegating to services
Following README.txt separation of concerns
"""
from flask import request, jsonify, redirect, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, decode_token, create_access_token
from datetime import timedelta
import functools
import sqlalchemy as sa

from ..services.auth_service import AuthService
from ..services.response_service import ResponseService
from ..services.error_service import APIError, handle_api_error
from ..extensions import db
from ..models import Account
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
        remember_me = data.get("remember_me", False)
        
        # extract ip address and device info from request
        ip_address = request.remote_addr
        device_info = request.headers.get('User-Agent', '')

        result = AuthService.login_user(email, password, remember_me=remember_me, ip_address=ip_address, device_info=device_info)
        return result

    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        import traceback
        traceback.print_exc()
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


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    """logout endpoint for user authentication"""
    try:
        # for jwt tokens, logout is handled on frontend by removing token
        # backend doesn't need to do anything special for jwt logout
        return jsonify({
            "success": True,
            "message": "Logout successful"
        })
    except Exception as e:
        return ResponseService.error_response(f"Failed to logout: {str(e)}", 500)


@auth_bp.route("/check-google-user", methods=["GET"])
def check_google_user():
    """check if email belongs to a Google-authenticated user"""
    try:
        email = request.args.get("email", "").strip()
        
        if not email:
            return ResponseService.error_response("Email is required", 400, "email")
        
        # check if user exists and is google-authenticated
        user = db.session.scalar(sa.select(Account).where(Account.email == email))
        
        if user:
            # check if user is google-authenticated (has google_id or empty password_hash)
            is_google_user = bool(user.google_id) or (user.password_hash == "" or not user.password_hash)
            return jsonify({
                "is_google_user": is_google_user,
                "exists": True
            })
        else:
            return jsonify({
                "is_google_user": False,
                "exists": False
            })
        
    except Exception as e:
        return ResponseService.error_response(f"Failed to check user: {str(e)}", 500)


@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    """forgot password endpoint - request password reset"""
    try:
        data = request.get_json()
        
        if not data:
            return ResponseService.error_response("Request data is required", 400, "general")
        
        email = data.get("email", "").strip()
        
        # check if user is google-authenticated
        user = db.session.scalar(sa.select(Account).where(Account.email == email))
        if user:
            is_google_user = bool(user.google_id) or (user.password_hash == "" or not user.password_hash)
            if is_google_user:
                # return error for google users
                return ResponseService.error_response(
                    "This account is linked to Google. Please sign in with Google instead.", 
                    400, 
                    "oauth_account"
                )
        
        result = AuthService.request_password_reset(email)
        return result
        
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to process password reset request: {str(e)}", 500)


@auth_bp.route("/verify-reset-token", methods=["GET"])
def verify_reset_token():
    """verify password reset token endpoint"""
    try:
        token = request.args.get("token", "").strip()
        
        if not token:
            return ResponseService.error_response("Token is required", 400, "token")
        
        result = AuthService.verify_reset_token(token)
        return result
        
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to verify reset token: {str(e)}", 500)


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    """reset password endpoint"""
    try:
        data = request.get_json()
        
        if not data:
            return ResponseService.error_response("Request data is required", 400, "general")
        
        token = data.get("token", "").strip()
        password = data.get("password", "")
        
        result = AuthService.reset_password(token, password)
        return result
        
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to reset password: {str(e)}", 500)


@auth_bp.route("/google/login", methods=["GET"])
def google_login():
    """initiate Google OAuth login - redirect to Google"""
    try:
        from ..services.oauth_service import OAuthService
        
        authorization_url, state = OAuthService.get_google_auth_url()
        
        # store state in session for verification (optional, but recommended)
        # for now, we'll just redirect
        return redirect(authorization_url)
        
    except Exception as e:
        return ResponseService.error_response(f"Failed to initiate Google login: {str(e)}", 500)


@auth_bp.route("/google/callback", methods=["GET"])
def google_callback():
    """handle Google OAuth callback"""
    try:
        from ..services.oauth_service import OAuthService
        
        # get authorization code from query params
        authorization_code = request.args.get('code')
        error = request.args.get('error')
        
        if error:
            current_app.logger.warning(f"Google OAuth error: {error}")
            frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:5173')
            return redirect(f"{frontend_url}/login?error=oauth_cancelled")
        
        if not authorization_code:
            return ResponseService.error_response("Authorization code not provided", 400, "oauth")
        
        # exchange code for user info
        google_user_info = OAuthService.handle_google_callback(authorization_code)
        
        # extract ip address and device info
        ip_address = request.remote_addr
        device_info = request.headers.get('User-Agent', '')
        
        # login or register user
        result = AuthService.login_with_google(
            google_user_info,
            ip_address=ip_address,
            device_info=device_info
        )
        
        # redirect to frontend with token
        frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:5173')
        token = result['token']
        
        # redirect to frontend callback page with token
        return redirect(f"{frontend_url}/auth/google/callback?token={token}")
        
    except APIError as e:
        frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:5173')
        return redirect(f"{frontend_url}/login?error=oauth_failed")
    except Exception as e:
        current_app.logger.error(f"Google OAuth callback error: {str(e)}")
        frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:5173')
        return redirect(f"{frontend_url}/login?error=oauth_failed")


@auth_bp.route("/2fa/generate", methods=["POST"])
@jwt_required()
def generate_2fa_secret():
    """generate 2FA secret and QR code URI"""
    try:
        user_id = get_jwt_identity()
        result = AuthService.generate_2fa_secret(user_id)
        return jsonify(result)
        
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to generate 2FA secret: {str(e)}", 500)


@auth_bp.route("/2fa/enable", methods=["POST"])
@jwt_required()
def enable_2fa():
    """enable 2FA with verification code"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return ResponseService.error_response("Request data is required", 400, "general")
        
        secret = data.get("secret", "").strip()
        verification_code = data.get("verification_code", "").strip()
        
        if not secret or not verification_code:
            return ResponseService.error_response("Secret and verification code are required", 400, "general")
        
        result = AuthService.enable_2fa(user_id, secret, verification_code)
        return result
        
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to enable 2FA: {str(e)}", 500)


@auth_bp.route("/2fa/disable", methods=["POST"])
@jwt_required()
def disable_2fa():
    """disable 2FA with password verification"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return ResponseService.error_response("Request data is required", 400, "general")
        
        password = data.get("password", "")
        
        if not password:
            return ResponseService.error_response("Password is required", 400, "password")
        
        result = AuthService.disable_2fa(user_id, password)
        return result
        
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to disable 2FA: {str(e)}", 500)


@auth_bp.route("/2fa/verify", methods=["POST"])
def verify_2fa():
    """verify 2FA code during login"""
    try:
        data = request.get_json()
        
        if not data:
            return ResponseService.error_response("Request data is required", 400, "general")
        
        temp_token = data.get("temp_token", "").strip()
        code = data.get("code", "").strip()
        
        if not temp_token or not code:
            return ResponseService.error_response("Temporary token and 2FA code are required", 400, "general")
        
        # verify temp token and extract user_id
        try:
            decoded = decode_token(temp_token)
            user_id = decoded['sub']
            
            # verify 2FA code
            AuthService.verify_2fa_code(user_id, code)
            
            # generate full JWT token
            user = db.session.scalar(sa.select(Account).where(Account.id == user_id))
            if not user:
                return ResponseService.error_response("User not found", 404, "user")
            
            expires_delta = timedelta(days=30)  # 30 days for remember me
            token = create_access_token(
                identity=user.id,
                additional_claims={
                    "email": user.email,
                    "role": "admin" if user.account_type == "Administrator" else "user"
                },
                expires_delta=expires_delta
            )
            
            # determine role
            role = "admin" if user.account_type == "Administrator" else "user"
            
            return jsonify({
                "token": token,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "name": user.name,
                    "role": role,
                    "profile_picture": user.profile_image_path,
                }
            })
            
        except Exception as e:
            current_app.logger.error(f"Token decode error: {str(e)}")
            return ResponseService.error_response("Invalid or expired temporary token", 400, "token")
        
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to verify 2FA code: {str(e)}", 500)


@auth_bp.route("/2fa/send-code", methods=["POST"])
@jwt_required()
def send_2fa_code():
    """send 2FA code via email (alternative method)"""
    try:
        user_id = get_jwt_identity()
        result = AuthService.send_2fa_code_email(user_id)
        return result
        
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to send 2FA code: {str(e)}", 500)