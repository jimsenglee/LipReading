"""
Quiz API endpoints - Thin layer delegating to services
Following README.txt separation of concerns
"""
from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..services.quiz_service import QuizService
from ..services.auth_service import AuthService
from ..services.response_service import ResponseService
from ..services.error_service import APIError, handle_api_error
from . import bp


@bp.get('/quizzes')
def list_quizzes():
    """Get paginated list of quizzes with filtering and sorting"""
    try:
        result = QuizService.get_quizzes(request.args)
        return result
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return ResponseService.error_response(f"Failed to retrieve quizzes: {str(e)}", 500)


@bp.get('/quizzes/<int:quiz_id>')
def get_quiz(quiz_id: int):
    """Get single quiz by ID"""
    try:
        return QuizService.get_quiz(quiz_id)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to retrieve quiz: {str(e)}", 500)


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


@bp.post('/quizzes/series')
@jwt_required()
@AuthService.require_admin()
def create_quiz_series():
    """Create new quiz series (admin only)"""
    try:
        current_user_id = get_jwt_identity()
        user = AuthService.get_user_info(current_user_id)
        user_name = user.get('name', 'Admin User') if isinstance(user, dict) else 'Admin User'
        
        data = request.get_json()
        if not data:
            return ResponseService.error_response('No data provided', 400)
        
        return QuizService.create_quiz_series(data, user_name)
        
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to create quiz series: {str(e)}", 500)


@bp.get('/quizzes/series')
def list_quiz_series():
    """Get paginated list of quiz series"""
    try:
        return QuizService.get_quiz_series(request.args)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to retrieve quiz series: {str(e)}", 500)


@bp.get('/quizzes/<int:quiz_id>/questions')
def get_quiz_questions(quiz_id: int):
    """Get all questions for a specific quiz"""
    try:
        return QuizService.get_quiz_questions(quiz_id, request.args)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to retrieve quiz questions: {str(e)}", 500)


@bp.post('/quizzes/<int:quiz_id>/questions')
@jwt_required()
@AuthService.require_admin()
def create_quiz_question(quiz_id: int):
    """Add question to quiz (admin only)"""
    try:
        data = request.get_json()
        if not data:
            return ResponseService.error_response('No data provided', 400)
        
        return QuizService.create_quiz_question(quiz_id, data)
        
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to create quiz question: {str(e)}", 500)


@bp.put('/quizzes/<int:quiz_id>/questions/<int:question_id>')
@jwt_required()
@AuthService.require_admin()
def update_quiz_question(quiz_id: int, question_id: int):
    """Update question (admin only)"""
    try:
        data = request.get_json()
        if not data:
            return ResponseService.error_response('No data provided', 400)
        
        return QuizService.update_quiz_question(quiz_id, question_id, data)
        
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to update quiz question: {str(e)}", 500)


@bp.delete('/quizzes/<int:quiz_id>/questions/<int:question_id>')
@jwt_required()
@AuthService.require_admin()
def delete_quiz_question(quiz_id: int, question_id: int):
    """Delete question (admin only)"""
    try:
        return QuizService.delete_quiz_question(quiz_id, question_id)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to delete quiz question: {str(e)}", 500)


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


@bp.get('/quizzes/<int:quiz_id>/files/<file_type>')
def get_quiz_file_url(quiz_id: int, file_type: str):
    """Get file URL for quiz files (public endpoint for user education)"""
    try:
        return QuizService.get_quiz_file_url(quiz_id, file_type)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to get quiz file URL: {str(e)}", 500)


# user-side quiz endpoints
@bp.get('/quiz/<int:quiz_id>')
@jwt_required()
def get_quiz_for_taking(quiz_id: int):
    """Get quiz for user to take (with shuffling, check attempt limits)"""
    try:
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return ResponseService.error_response('Authentication required', 401)
        
        return QuizService.get_quiz_for_taking(quiz_id, current_user_id)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to get quiz: {str(e)}", 500)


@bp.post('/quiz/<int:quiz_id>/submit')
@jwt_required()
def submit_quiz(quiz_id: int):
    """Submit quiz answers and get graded results"""
    try:
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return ResponseService.error_response('Authentication required', 401)
        
        data = request.get_json()
        if not data:
            return ResponseService.error_response('No data provided', 400)
        
        return QuizService.submit_quiz(quiz_id, current_user_id, data)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to submit quiz: {str(e)}", 500)


