"""
Error service - Consistent error handling
Following README.txt separation of concerns
"""
from typing import Any
from flask import jsonify, current_app


class APIError(Exception):
    """Custom API error class"""
    def __init__(self, message: str, status_code: int = 400, details: Any = None):
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(self.message)


class ValidationError(APIError):
    """validation error for user education input"""
    def __init__(self, message: str, field: str | None = None, details: Any = None):
        super().__init__(message, 400, details)
        self.field = field


class FileAccessError(APIError):
    """file access error for educational content"""
    def __init__(self, message: str, file_path: str | None = None, details: Any = None):
        super().__init__(message, 404, details)
        self.file_path = file_path


class ProgressError(APIError):
    """progress tracking error for user education"""
    def __init__(self, message: str, user_id: int | None = None, tutorial_id: int | None = None, details: Any = None):
        super().__init__(message, 400, details)
        self.user_id = user_id
        self.tutorial_id = tutorial_id


class BookmarkError(APIError):
    """bookmark operation error for user education"""
    def __init__(self, message: str, user_id: int | None = None, tutorial_id: int | None = None, details: Any = None):
        super().__init__(message, 400, details)
        self.user_id = user_id
        self.tutorial_id = tutorial_id


class ReviewError(APIError):
    """review system error for user education"""
    def __init__(self, message: str, user_id: int | None = None, tutorial_id: int | None = None, details: Any = None):
        super().__init__(message, 400, details)
        self.user_id = user_id
        self.tutorial_id = tutorial_id


def handle_api_error(error):
    """Global error handler for API errors"""
    current_app.logger.error(f"API Error: {error.message}")
    
    response_data = {
        'success': False,
        'error': error.message,
        'details': error.details
    }
    
    # add specific error details for user education
    if hasattr(error, 'field') and error.field:
        response_data['field'] = error.field
    
    if hasattr(error, 'file_path') and error.file_path:
        response_data['file_path'] = error.file_path
    
    if hasattr(error, 'user_id') and error.user_id:
        response_data['user_id'] = error.user_id
    
    if hasattr(error, 'tutorial_id') and error.tutorial_id:
        response_data['tutorial_id'] = error.tutorial_id
    
    return jsonify(response_data), error.status_code


def handle_generic_error(error):
    """Global error handler for generic errors"""
    current_app.logger.error(f"Generic Error: {str(error)}")
    
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500


def create_validation_error(field: str, message: str, details: Any = None):
    """create validation error for user education"""
    return ValidationError(f"validation error: {message}", field, details)


def create_file_access_error(file_path: str, message: str = "file not accessible"):
    """create file access error for educational content"""
    return FileAccessError(f"file access error: {message}", file_path)


def create_progress_error(user_id: int, tutorial_id: int, message: str, details: Any = None):
    """create progress tracking error for user education"""
    return ProgressError(f"progress error: {message}", user_id, tutorial_id, details)


def create_bookmark_error(user_id: int, tutorial_id: int, message: str, details: Any = None):
    """create bookmark operation error for user education"""
    return BookmarkError(f"bookmark error: {message}", user_id, tutorial_id, details)


def create_review_error(user_id: int, tutorial_id: int, message: str, details: Any = None):
    """create review system error for user education"""
    return ReviewError(f"review error: {message}", user_id, tutorial_id, details)
