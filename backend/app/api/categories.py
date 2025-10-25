"""
Category API endpoints - Thin layer delegating to services
Following README.txt separation of concerns
"""
from flask import request
from flask_jwt_extended import jwt_required

from ..services.category_service import CategoryService
from ..services.auth_service import AuthService
from ..services.response_service import ResponseService
from ..services.error_service import APIError, handle_api_error
from . import bp


@bp.get('/categories')
def list_categories():
    """Get paginated list of categories with filtering and sorting"""
    try:
        return CategoryService.get_categories(request.args)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to retrieve categories: {str(e)}", 500)


@bp.post('/categories')
@jwt_required()
@AuthService.require_admin()
def create_category():
    """Create new category (admin only)"""
    try:
        data = request.get_json()
        if not data:
            return ResponseService.error_response('No data provided', 400)
        
        return CategoryService.create_category(data)
        
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to create category: {str(e)}", 500)


@bp.put('/categories/<int:category_id>')
@jwt_required()
@AuthService.require_admin()
def update_category(category_id: int):
    """Update existing category (admin only)"""
    try:
        data = request.get_json()
        if not data:
            return ResponseService.error_response('No data provided', 400)
        
        return CategoryService.update_category(category_id, data)
        
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to update category: {str(e)}", 500)


@bp.delete('/categories/<int:category_id>')
@jwt_required()
@AuthService.require_admin()
def delete_category(category_id: int):
    """Delete category (admin only)"""
    try:
        return CategoryService.delete_category(category_id)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to delete category: {str(e)}", 500)


