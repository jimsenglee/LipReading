"""
Practice Word API endpoints - Thin layer delegating to services
Following README.txt separation of concerns
"""
from flask import request
from flask_jwt_extended import jwt_required
import os

from ..services.practice_word_service import PracticeWordService
from ..services.auth_service import AuthService
from ..services.response_service import ResponseService
from ..services.error_service import APIError, handle_api_error
from ..utils.file_handler import FileHandler
from . import bp


@bp.get('/practice-words')
def list_practice_words():
    """Get paginated list of practice words with filtering and sorting"""
    try:
        result = PracticeWordService.get_practice_words(request.args)
        return result
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return ResponseService.error_response(f"Failed to retrieve practice words: {str(e)}", 500)


@bp.get('/practice-words/<int:word_id>')
def get_practice_word(word_id: int):
    """Get single practice word by ID"""
    try:
        return PracticeWordService.get_practice_word(word_id)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to retrieve practice word: {str(e)}", 500)


@bp.post('/practice-words')
@jwt_required()
@AuthService.require_admin()
def create_practice_word():
    """Create new practice word (admin only)"""
    try:
        data = request.get_json()
        if not data:
            return ResponseService.error_response('No data provided', 400)
        
        return PracticeWordService.create_practice_word(data)
        
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return ResponseService.error_response(f"Failed to create practice word: {str(e)}", 500)


@bp.put('/practice-words/<int:word_id>')
@jwt_required()
@AuthService.require_admin()
def update_practice_word(word_id: int):
    """Update existing practice word (admin only)"""
    try:
        data = request.get_json()
        if not data:
            return ResponseService.error_response('No data provided', 400)
        
        return PracticeWordService.update_practice_word(word_id, data)
        
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return ResponseService.error_response(f"Failed to update practice word: {str(e)}", 500)


@bp.delete('/practice-words/<int:word_id>')
@jwt_required()
@AuthService.require_admin()
def delete_practice_word(word_id: int):
    """Delete practice word (admin only)"""
    try:
        return PracticeWordService.delete_practice_word(word_id)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return ResponseService.error_response(f"Failed to delete practice word: {str(e)}", 500)


@bp.post('/upload/practice-video')
@jwt_required()
@AuthService.require_admin()
def upload_practice_video():
    """Upload a video file for practice word (admin only)"""
    try:
        if 'file' not in request.files:
            return ResponseService.error_response("No file provided", 400)
        
        file = request.files['file']
        if file.filename == '':
            return ResponseService.error_response("No file selected", 400)
        
        # validate file type
        filename = file.filename
        if filename is None:
            return ResponseService.error_response("Invalid filename", 400)
        
        file_ext = os.path.splitext(filename)[1].lower()
        allowed_extensions = FileHandler.SUPPORTED_VIDEO_TYPES
        
        if file_ext not in allowed_extensions:
            return ResponseService.error_response(f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}", 400)
        
        # validate file size (max 50MB)
        if not FileHandler.validate_file_size(file, max_size_mb=50):
            return ResponseService.error_response("File size exceeds 50MB limit", 400)
        
        # generate unique filename
        unique_filename = FileHandler.generate_unique_filename(filename, 'practice')
        
        # create upload directory
        upload_path = FileHandler.create_upload_directory('uploads/quiz/Words')
        
        # save file
        FileHandler.save_uploaded_file(file, upload_path, unique_filename)
        
        # get relative path for database
        relative_path = FileHandler.get_relative_path(
            os.path.join(upload_path, unique_filename)
        )
        
        return ResponseService.success_response({
            'path': relative_path.replace('\\', '/'),
            'fileName': unique_filename
        })
        
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return ResponseService.error_response(f"Failed to upload video: {str(e)}", 500)

