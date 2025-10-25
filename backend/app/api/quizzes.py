"""
Quiz API endpoints - Thin layer delegating to services
Following README.txt separation of concerns
"""
from flask import request
from flask_jwt_extended import jwt_required

from ..services.quiz_service import QuizService
from ..services.auth_service import AuthService
from ..services.response_service import ResponseService
from ..services.error_service import APIError, handle_api_error
from . import bp


@bp.get('/quizzes')
def list_quizzes():
    """Get paginated list of quizzes with filtering and sorting"""
    try:
        return QuizService.get_quizzes(request.args)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to retrieve quizzes: {str(e)}", 500)


@bp.post('/quizzes')
@jwt_required()
@AuthService.require_admin()
def create_quiz():
    """Create new quiz (admin only)"""
    try:
        data = request.get_json()
        if not data:
            return ResponseService.error_response('No data provided', 400)
        
        return QuizService.create_quiz(data)
        
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to create quiz: {str(e)}", 500)


@bp.put('/quizzes/<int:quiz_id>')
@jwt_required()
@AuthService.require_admin()
def update_quiz(quiz_id: int):
    """Update existing quiz (admin only)"""
    try:
        data = request.get_json()
        if not data:
            return ResponseService.error_response('No data provided', 400)
        
        return QuizService.update_quiz(quiz_id, data)
        
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to update quiz: {str(e)}", 500)


@bp.delete('/quizzes/<int:quiz_id>')
@jwt_required()
@AuthService.require_admin()
def delete_quiz(quiz_id: int):
    """Delete quiz (admin only)"""
    try:
        return QuizService.delete_quiz(quiz_id)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to delete quiz: {str(e)}", 500)


