"""
analytics API endpoints for admin dashboard
Following README.txt separation of concerns
"""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from ..services.analytics_service import AnalyticsService
from ..services.auth_service import AuthService
from ..services.response_service import ResponseService
from ..services.error_service import APIError, handle_api_error


analytics_bp = Blueprint('analytics', __name__)


@analytics_bp.get('/analytics/content')
@jwt_required()
@AuthService.require_admin()
def get_content_analytics():
    """get content interaction analytics for admin dashboard"""
    try:
        result = AnalyticsService.get_content_analytics()
        return result
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return ResponseService.error_response(f"failed to get content analytics: {str(e)}", 500)


@analytics_bp.get('/analytics/content/popularity')
@jwt_required()
@AuthService.require_admin()
def get_tutorial_popularity():
    """get tutorial popularity data for chart"""
    try:
        result = AnalyticsService.get_tutorial_popularity()
        return result
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return ResponseService.error_response(f"failed to get tutorial popularity: {str(e)}", 500)


@analytics_bp.get('/analytics/content/interactions')
@jwt_required()
@AuthService.require_admin()
def get_tutorial_interactions():
    """get detailed tutorial interaction data for table with pagination and filtering"""
    try:
        params = request.args.to_dict()
        result = AnalyticsService.get_tutorial_interaction_details(params)
        return result
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return ResponseService.error_response(f"failed to get tutorial interactions: {str(e)}", 500)


@analytics_bp.get('/analytics/feedback')
@jwt_required()
@AuthService.require_admin()
def get_feedback_analytics():
    """get feedback management analytics"""
    try:
        result = AnalyticsService.get_feedback_analytics()
        return result
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return ResponseService.error_response(f"failed to get feedback analytics: {str(e)}", 500)


@analytics_bp.get('/analytics/feedback/distributions')
@jwt_required()
@AuthService.require_admin()
def get_feedback_distributions():
    """get feedback distribution data for charts"""
    try:
        result = AnalyticsService.get_feedback_distributions()
        return result
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return ResponseService.error_response(f"failed to get feedback distributions: {str(e)}", 500)


@analytics_bp.get('/analytics/feedback/list')
@jwt_required()
@AuthService.require_admin()
def get_feedback_list():
    """get paginated and filtered feedback list for admin"""
    try:
        # get query parameters
        params = request.args.to_dict()
        
        result = AnalyticsService.get_feedback_list(params)
        return result
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return ResponseService.error_response(f"failed to get feedback list: {str(e)}", 500)


@analytics_bp.get('/analytics/quiz')
@jwt_required()
@AuthService.require_admin()
def get_quiz_analytics():
    """get quiz analytics similar to tutorial analytics"""
    try:
        result = AnalyticsService.get_quiz_analytics()
        return result
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return ResponseService.error_response(f"failed to get quiz analytics: {str(e)}", 500)


@analytics_bp.get('/analytics/user-learning')
@jwt_required()
@AuthService.require_admin()
def get_user_learning_analytics():
    """get comprehensive user learning analytics for admin dashboard"""
    try:
        params = request.args.to_dict()
        result = AnalyticsService.get_user_learning_analytics(params)
        return result
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return ResponseService.error_response(f"failed to get user learning analytics: {str(e)}", 500)

