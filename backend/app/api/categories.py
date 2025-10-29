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
        print(f"DEBUG: list_categories called with args: {request.args}")
        result = CategoryService.get_categories(request.args)
        print(f"DEBUG: CategoryService.get_categories returned: {type(result)}")
        # Print the actual response data
        if hasattr(result, 'data'):
            print(f"DEBUG: Response data: {result.data}")
        return result
    except APIError as e:
        print(f"DEBUG: APIError in list_categories: {e}")
        return handle_api_error(e)
    except Exception as e:
        print(f"DEBUG: Exception in list_categories: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return ResponseService.error_response(f"Failed to retrieve categories: {str(e)}", 500)


@bp.get('/categories/<int:category_id>')
def get_category(category_id: int):
    """Get single category by ID"""
    try:
        return CategoryService.get_category(category_id)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to retrieve category: {str(e)}", 500)


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


@bp.get('/categories/statistics')
def get_category_statistics():
    """Get category usage statistics (public endpoint for user education)"""
    try:
        category_id = request.args.get('category_id', type=int)
        return CategoryService.get_category_statistics(category_id)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to get category statistics: {str(e)}", 500)


@bp.get('/categories/<int:category_id>/usage')
def validate_category_usage(category_id: int):
    """Validate category usage before deletion (public endpoint for user education)"""
    try:
        return CategoryService.validate_category_usage(category_id)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to validate category usage: {str(e)}", 500)


@bp.get('/categories/search')
def search_categories():
    """Search categories with advanced filtering (public endpoint for user education)"""
    try:
        return CategoryService.search_categories(request.args)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to search categories: {str(e)}", 500)


