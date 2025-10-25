"""
User API endpoints - Thin layer delegating to services
Following README.txt separation of concerns
"""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from ..services.user_service import UserService
from ..services.auth_service import AuthService
from ..services.response_service import ResponseService
from ..services.error_service import APIError, handle_api_error

users_bp = Blueprint('users', __name__)

@users_bp.route('/users', methods=['GET'])
@jwt_required()
@AuthService.require_admin()
def get_users():
    """Get paginated list of users with filtering and sorting (admin only)"""
    try:
        return UserService.get_users(request.args)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to retrieve users: {str(e)}", 500)

@users_bp.route('/users', methods=['POST'])
@jwt_required()
@AuthService.require_admin()
def create_user():
    """Create new user (admin only)"""
    try:
        data = request.get_json()
        if not data:
            return ResponseService.error_response('No data provided', 400)
        
        return UserService.create_user(data)
        
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to create user: {str(e)}", 500)


@users_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
@AuthService.require_admin()
def update_user(user_id):
    """Update user information (admin only)"""
    try:
        data = request.get_json()
        if not data:
            return ResponseService.error_response('No data provided', 400)
        
        return UserService.update_user(user_id, data)
        
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to update user: {str(e)}", 500)


@users_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
@AuthService.require_admin()
def delete_user(user_id):
    """Delete user account (admin only)"""
    try:
        return UserService.delete_user(user_id)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to delete user: {str(e)}", 500)
