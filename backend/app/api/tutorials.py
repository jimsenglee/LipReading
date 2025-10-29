"""
Tutorial API endpoints - Thin layer delegating to services
Following README.txt separation of concerns
"""
from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..services.tutorial_service import TutorialService
from ..services.auth_service import AuthService
from ..services.response_service import ResponseService
from ..services.error_service import APIError, handle_api_error
from . import bp


@bp.get('/tutorials')
def list_tutorials():
    """Get paginated list of tutorials with filtering and sorting"""
    try:
        print(f"DEBUG: list_tutorials called with args: {request.args}")
        result = TutorialService.get_tutorials(request.args)
        print(f"DEBUG: TutorialService.get_tutorials returned: {type(result)}")
        # Print the actual response data
        if hasattr(result, 'data'):
            print(f"DEBUG: Response data: {result.data}")
        return result
    except APIError as e:
        print(f"DEBUG: APIError in list_tutorials: {e}")
        return handle_api_error(e)
    except Exception as e:
        print(f"DEBUG: Exception in list_tutorials: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
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
        if not user:
            return ResponseService.error_response('User not found', 401)
        user_name = user.name if user else 'Admin User'
        return TutorialService.create_tutorial(data, user_name)
        
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
        current_user_id = get_jwt_identity()
        user = AuthService.get_current_user()
        if not user:
            return ResponseService.error_response('User not found', 401)
        user_name = user.name
        
        return TutorialService.create_tutorial_series(request.get_json(), user_name)
        
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to create tutorial series: {str(e)}", 500)


@bp.get('/tutorials/series')
def list_tutorial_series():
    """Get paginated list of tutorial series"""
    try:
        return TutorialService.get_tutorial_series(request.args)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to retrieve tutorial series: {str(e)}", 500)


@bp.get('/tutorials/series/<int:series_id>')
def get_tutorial_series(series_id: int):
    """Get specific tutorial series by ID"""
    try:
        return TutorialService.get_tutorial_series_by_id(series_id)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to retrieve tutorial series: {str(e)}", 500)


@bp.put('/tutorials/series/<int:series_id>')
@jwt_required()
@AuthService.require_admin()
def update_tutorial_series(series_id: int):
    """Update existing tutorial series (admin only)"""
    try:
        current_user_id = get_jwt_identity()
        user = AuthService.get_current_user()
        if not user:
            return ResponseService.error_response('User not found', 401)
        user_name = user.name
        
        data = request.get_json()
        if not data:
            return ResponseService.error_response('No data provided', 400)
        
        return TutorialService.update_tutorial_series(series_id, data, user_name)
        
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to update tutorial series: {str(e)}", 500)


@bp.delete('/tutorials/series/<int:series_id>')
@jwt_required()
@AuthService.require_admin()
def delete_tutorial_series(series_id: int):
    """Delete tutorial series (admin only)"""
    try:
        return TutorialService.delete_tutorial_series(series_id)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to delete tutorial series: {str(e)}", 500)


@bp.get('/tutorials/<int:tutorial_id>/files/<file_type>')
def get_tutorial_file_url(tutorial_id: int, file_type: str):
    """Get file URL for tutorial files (public endpoint for user education)"""
    try:
        print(f"DEBUG: get_tutorial_file_url called with tutorial_id: {tutorial_id}, file_type: {file_type}")
        result = TutorialService.get_tutorial_file_url(tutorial_id, file_type)
        print(f"DEBUG: TutorialService.get_tutorial_file_url returned: {type(result)}")
        return result
    except APIError as e:
        print(f"DEBUG: APIError in get_tutorial_file_url: {e}")
        return handle_api_error(e)
    except Exception as e:
        print(f"DEBUG: Exception in get_tutorial_file_url: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return ResponseService.error_response(f"Failed to get tutorial file URL: {str(e)}", 500)


@bp.get('/tutorials/files/statistics')
def get_education_file_statistics():
    """Get education file statistics (public endpoint for monitoring)"""
    try:
        from ..utils.file_handler import FileHandler
        stats = FileHandler.get_education_file_statistics()
        return ResponseService.success_response(stats)
    except Exception as e:
        return ResponseService.error_response(f"Failed to get file statistics: {str(e)}", 500)
