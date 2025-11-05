"""
Feedback API endpoints - Thin layer delegating to services
Following README.txt separation of concerns
"""
from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity
import os

from ..services.feedback_service import FeedbackService
from ..services.auth_service import AuthService
from ..services.response_service import ResponseService
from ..services.error_service import APIError, handle_api_error
from ..utils.file_handler import FileHandler
from . import bp


@bp.post('/feedback/upload')
@jwt_required()
def upload_feedback_file():
    """Upload a file for feedback"""
    try:
        current_user_id = get_jwt_identity()
        
        if 'file' not in request.files:
            return ResponseService.error_response("No file provided", 400)
        
        file = request.files['file']
        if file.filename == '':
            return ResponseService.error_response("No file selected", 400)
        
        # Validate file type
        filename = file.filename
        if filename is None:
            return ResponseService.error_response("Invalid filename", 400)
        
        file_ext = os.path.splitext(filename)[1].lower()
        allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.webm', '.mov', '.avi'}
        
        if file_ext not in allowed_extensions:
            return ResponseService.error_response("Unsupported file type", 400)
        
        # Generate unique filename
        unique_filename = FileHandler.generate_unique_filename(filename, 'feedback')
        
        # Create feedback directory
        upload_path = FileHandler.create_upload_directory('uploads/feedback')
        
        # Save file
        FileHandler.save_uploaded_file(file, upload_path, unique_filename)
        
        # Get relative path for database
        relative_path = FileHandler.get_relative_path(
            os.path.join(upload_path, unique_filename)
        )
        
        return ResponseService.success_response({
            'filePath': relative_path.replace('\\', '/'),
            'fileName': unique_filename
        })
        
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return ResponseService.error_response(f"Failed to upload file: {str(e)}", 500)


@bp.post('/feedback')
@jwt_required()
def submit_feedback():
    """Submit feedback from the current user"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return ResponseService.error_response("Request data is required", 400)
        
        result = FeedbackService.submit_feedback(current_user_id, data)
        return result
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return ResponseService.error_response(f"Failed to submit feedback: {str(e)}", 500)


@bp.get('/feedback')
@jwt_required()
def get_user_feedback_list():
    """Get all feedback submitted by the current user"""
    try:
        current_user_id = get_jwt_identity()
        result = FeedbackService.get_user_feedback(current_user_id, request.args)
        return result
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return ResponseService.error_response(f"Failed to retrieve feedback: {str(e)}", 500)


@bp.get('/feedback/<int:feedback_id>')
@jwt_required()
def get_feedback(feedback_id: int):
    """Get a specific feedback item by ID"""
    try:
        current_user_id = get_jwt_identity()
        result = FeedbackService.get_feedback_by_id(feedback_id, current_user_id)
        return result
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return ResponseService.error_response(f"Failed to retrieve feedback: {str(e)}", 500)


@bp.get('/feedback/statistics')
@jwt_required()
def get_feedback_statistics():
    """Get feedback statistics for the current user"""
    try:
        current_user_id = get_jwt_identity()
        statistics = FeedbackService.get_feedback_statistics(current_user_id)
        return ResponseService.success_response(statistics)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return ResponseService.error_response(f"Failed to get feedback statistics: {str(e)}", 500)


@bp.put('/feedback/<int:feedback_id>')
@jwt_required()
@AuthService.require_admin()
def update_feedback(feedback_id: int):
    """Update feedback (admin only)"""
    try:
        data = request.get_json()
        if not data:
            return ResponseService.error_response('No data provided', 400)
        
        return FeedbackService.update_feedback(feedback_id, data)
        
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return ResponseService.error_response(f"Failed to update feedback: {str(e)}", 500)

