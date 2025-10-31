"""
review system API endpoints - Thin layer delegating to services
Following README.txt separation of concerns
"""
from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..services.review_service import ReviewService
from ..services.auth_service import AuthService
from ..services.response_service import ResponseService
from ..services.error_service import APIError, handle_api_error
from . import bp


@bp.get('/tutorials/<int:tutorial_id>/reviews')
def get_tutorial_reviews_list(tutorial_id: int):
    """get all reviews for a tutorial"""
    try:
        result = ReviewService.get_tutorial_reviews(tutorial_id)
        return result
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return ResponseService.error_response(f"Failed to retrieve tutorial reviews: {str(e)}", 500)


@bp.post('/reviews/tutorials/<int:tutorial_id>')
@jwt_required()
def submit_tutorial_review(tutorial_id: int):
    """submit a review for a tutorial"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        if not data:
            return ResponseService.error_response('No data provided', 400)
        
        return ReviewService.submit_tutorial_review(current_user_id, tutorial_id, data)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to submit tutorial review: {str(e)}", 500)


@bp.post('/reviews/quizzes/<int:quiz_id>')
@jwt_required()
def submit_quiz_review(quiz_id: int):
    """submit a review for a quiz"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        if not data:
            return ResponseService.error_response('No data provided', 400)
        
        return ReviewService.submit_quiz_review(current_user_id, quiz_id, data)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to submit quiz review: {str(e)}", 500)


@bp.get('/reviews/tutorials/<int:tutorial_id>')
def get_tutorial_reviews(tutorial_id: int):
    """get all reviews for a tutorial (public endpoint)"""
    try:
        return ReviewService.get_tutorial_reviews(tutorial_id, request.args)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to get tutorial reviews: {str(e)}", 500)


@bp.get('/reviews/tutorials/<int:tutorial_id>/user')
@jwt_required()
def get_user_tutorial_review(tutorial_id: int):
    """get user's review for a specific tutorial"""
    try:
        current_user_id = get_jwt_identity()
        return ReviewService.get_user_review(current_user_id, tutorial_id)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to get user review: {str(e)}", 500)


@bp.put('/reviews/tutorials/<int:tutorial_id>')
@jwt_required()
def update_tutorial_review(tutorial_id: int):
    """update user's existing review for a tutorial"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        if not data:
            return ResponseService.error_response('No data provided', 400)
        
        return ReviewService.update_review(current_user_id, tutorial_id, data)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to update review: {str(e)}", 500)


@bp.delete('/reviews/tutorials/<int:tutorial_id>')
@jwt_required()
def delete_tutorial_review(tutorial_id: int):
    """delete user's review for a tutorial"""
    try:
        current_user_id = get_jwt_identity()
        return ReviewService.delete_review(current_user_id, tutorial_id)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to delete review: {str(e)}", 500)


@bp.get('/reviews/statistics')
def get_review_statistics():
    """get review statistics (public endpoint)"""
    try:
        tutorial_id = request.args.get('tutorial_id', type=int)
        return ReviewService.get_review_statistics(tutorial_id)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to get review statistics: {str(e)}", 500)


@bp.get('/reviews/search')
def search_reviews():
    """search reviews with advanced filtering (public endpoint)"""
    try:
        search_term = request.args.get('q', '')
        if not search_term:
            return ResponseService.error_response('Search term is required', 400)
        
        return ReviewService.search_reviews(search_term, request.args)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to search reviews: {str(e)}", 500)


@bp.put('/reviews/<int:review_id>/moderate')
@jwt_required()
@AuthService.require_admin()
def moderate_review(review_id: int):
    """moderate a review (admin only)"""
    try:
        data = request.get_json()
        if not data:
            return ResponseService.error_response('No data provided', 400)
        
        return ReviewService.moderate_review(review_id, data)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to moderate review: {str(e)}", 500)
