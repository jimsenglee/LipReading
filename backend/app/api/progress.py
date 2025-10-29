"""
progress tracking API endpoints - Thin layer delegating to services
Following README.txt separation of concerns
"""
from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..services.progress_service import ProgressService
from ..services.auth_service import AuthService
from ..services.response_service import ResponseService
from ..services.error_service import APIError, handle_api_error
from . import bp


@bp.post('/progress/series/<int:series_id>/enroll')
@jwt_required()
def enroll_in_series(series_id: int):
    """enroll user in a tutorial series"""
    try:
        current_user_id = get_jwt_identity()
        return ProgressService.enroll_in_series(current_user_id, series_id)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to enroll in series: {str(e)}", 500)


@bp.post('/progress/series/<int:series_id>/unenroll')
@jwt_required()
def unenroll_from_series(series_id: int):
    """unenroll user from a tutorial series"""
    try:
        current_user_id = get_jwt_identity()
        return ProgressService.unenroll_from_series(current_user_id, series_id)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to unenroll from series: {str(e)}", 500)


@bp.get('/progress/series/<int:series_id>')
@jwt_required()
def get_series_progress(series_id: int):
    """get user's progress for a specific series"""
    try:
        current_user_id = get_jwt_identity()
        return ProgressService.get_series_progress(current_user_id, series_id)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to get series progress: {str(e)}", 500)


@bp.put('/progress/tutorials/<int:tutorial_id>')
@jwt_required()
def update_video_progress(tutorial_id: int):
    """update user's progress for a specific video/tutorial"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        if not data:
            return ResponseService.error_response('No data provided', 400)
        
        return ProgressService.update_video_progress(current_user_id, tutorial_id, data)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to update progress: {str(e)}", 500)


@bp.get('/progress/user')
@jwt_required()
def get_user_progress():
    """get all user's progress across all series with filtering"""
    try:
        current_user_id = get_jwt_identity()
        return ProgressService.get_user_progress(current_user_id, request.args)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to get user progress: {str(e)}", 500)


@bp.post('/progress/quizzes/<int:quiz_id>/attempts')
@jwt_required()
def submit_quiz_attempt(quiz_id: int):
    """submit a quiz attempt"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        if not data:
            return ResponseService.error_response('No data provided', 400)
        
        return ProgressService.submit_quiz_attempt(current_user_id, quiz_id, data)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to submit quiz attempt: {str(e)}", 500)


@bp.get('/progress/quizzes/<int:quiz_id>/attempts')
@jwt_required()
def get_quiz_attempts(quiz_id: int):
    """get user's quiz attempts for a specific quiz"""
    try:
        current_user_id = get_jwt_identity()
        return ProgressService.get_quiz_attempts(current_user_id, quiz_id, request.args)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to get quiz attempts: {str(e)}", 500)


@bp.get('/progress/quizzes/attempts')
@jwt_required()
def get_all_quiz_attempts():
    """get all user's quiz attempts"""
    try:
        current_user_id = get_jwt_identity()
        return ProgressService.get_quiz_attempts(current_user_id, None, request.args)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to get quiz attempts: {str(e)}", 500)


@bp.get('/progress/statistics')
@jwt_required()
def get_progress_statistics():
    """get comprehensive progress statistics for the current user"""
    try:
        current_user_id = get_jwt_identity()
        statistics = ProgressService.get_progress_statistics(current_user_id)
        return ResponseService.success_response(statistics)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to get progress statistics: {str(e)}", 500)
