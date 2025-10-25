"""
Tutorial API endpoints - Thin layer delegating to services
Following README.txt separation of concerns
"""
from flask import request
from flask_jwt_extended import jwt_required

from ..services.tutorial_service import TutorialService
from ..services.auth_service import AuthService
from ..services.response_service import ResponseService
from ..services.error_service import APIError, handle_api_error
from . import bp


@bp.get('/tutorials')
def list_tutorials():
    """Get paginated list of tutorials with filtering and sorting"""
    try:
        return TutorialService.get_tutorials(request.args)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to retrieve tutorials: {str(e)}", 500)


@bp.get('/tutorials/<int:tutorial_id>')
def get_tutorial(tutorial_id):
    """Get single tutorial by ID"""
    try:
        return TutorialService.get_tutorial(tutorial_id)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to retrieve tutorial: {str(e)}", 500)


@bp.post('/tutorials')
@jwt_required()
@AuthService.require_admin()
def create_tutorial():
    """Create new tutorial (admin only)"""
    try:
        data = request.get_json()
        if not data:
            return ResponseService.error_response('No data provided', 400)
        
        user = AuthService.get_current_user()
        return TutorialService.create_tutorial(data, user.name)
        
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to create tutorial: {str(e)}", 500)


@bp.delete('/tutorials/<int:tutorial_id>')
@jwt_required()
@AuthService.require_admin()
def delete_tutorial(tutorial_id):
    """Delete tutorial (admin only)"""
    try:
        return TutorialService.delete_tutorial(tutorial_id)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to delete tutorial: {str(e)}", 500)


@bp.put('/tutorials/<int:tutorial_id>')
@jwt_required()
@AuthService.require_admin()
def update_tutorial(tutorial_id):
    """Update tutorial (admin only)"""
    try:
        data = request.get_json()
        if not data:
            return ResponseService.error_response('No data provided', 400)
        
        return TutorialService.update_tutorial(tutorial_id, data)
        
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to update tutorial: {str(e)}", 500)


@bp.post('/tutorials/series')
@jwt_required()
@AuthService.require_admin()
def create_tutorial_series():
    """Create new tutorial series (admin only)"""
    try:
        # This complex function should be moved to TutorialService
        # For now, return a simple response
        return ResponseService.error_response('Tutorial series creation not yet implemented in service layer', 501)
        
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to create tutorial series: {str(e)}", 500)
