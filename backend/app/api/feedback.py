"""
Feedback API endpoints
Following README.txt separation of concerns
"""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..services.feedback_service import FeedbackService
from ..services.auth_service import AuthService
from ..services.error_service import APIError, handle_api_error
from ..services.response_service import ResponseService

feedback_bp = Blueprint('feedback', __name__)


@feedback_bp.route("/feedback", methods=["POST"])
@jwt_required()
def submit_feedback():
    """Submit new feedback with optional file attachment"""
    try:
        print("[DEBUG] /api/feedback POST endpoint called")
        current_user_id = get_jwt_identity()
        
        # Get form data and file
        data = request.form.to_dict() if request.form else {}
        file = request.files.get('file') if request.files else None
        
        # If JSON request (fallback), get from JSON
        if not data and request.json:
            data = request.json.copy()
            file = None
        
        print(f"[DEBUG] Received data: {data}, file: {file.filename if file else None}")
        
        result = FeedbackService.create_feedback(current_user_id, data, file)
        return ResponseService.success_response(result['data'], message=result['message'])
        
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return ResponseService.error_response(f"Failed to submit feedback: {str(e)}", 500)


@feedback_bp.route("/feedback", methods=["GET"])
@jwt_required()
def get_feedbacks():
    """Get paginated list of feedbacks with filtering and sorting"""
    try:
        current_user_id = get_jwt_identity()
        
        # Check if user is admin
        user = AuthService.get_current_user()
        is_admin = user and user.account_type == 'Administrator'
        
        feedbacks = FeedbackService.get_feedbacks(request.args, current_user_id, is_admin)
        return feedbacks
        
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return ResponseService.error_response(f"Failed to retrieve feedbacks: {str(e)}", 500)


@feedback_bp.route("/feedback/<int:feedback_id>", methods=["GET"])
@jwt_required()
def get_feedback(feedback_id: int):
    """Get single feedback by ID"""
    try:
        current_user_id = get_jwt_identity()
        user = AuthService.get_current_user()
        is_admin = user and user.account_type == 'Administrator'
        
        feedback = FeedbackService.get_feedback(feedback_id, current_user_id, is_admin)
        return ResponseService.success_response(feedback)
        
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return ResponseService.error_response(f"Failed to retrieve feedback: {str(e)}", 500)


@feedback_bp.route("/feedback/<int:feedback_id>", methods=["PUT"])
@jwt_required()
@AuthService.require_admin()
def update_feedback_status(feedback_id: int):
    """Update feedback status (admin only)"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return ResponseService.error_response("Request data is required", 400)
        
        result = FeedbackService.update_feedback_status(feedback_id, data, current_user_id)
        return ResponseService.success_response(None, message=result['message'])
        
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return ResponseService.error_response(f"Failed to update feedback: {str(e)}", 500)


@feedback_bp.route("/feedback/<int:feedback_id>", methods=["DELETE"])
@jwt_required()
def delete_feedback(feedback_id: int):
    """Delete feedback"""
    try:
        current_user_id = get_jwt_identity()
        user = AuthService.get_current_user()
        is_admin = user and user.account_type == 'Administrator'
        
        result = FeedbackService.delete_feedback(feedback_id, current_user_id, is_admin)
        return ResponseService.success_response(None, message=result['message'])
        
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return ResponseService.error_response(f"Failed to delete feedback: {str(e)}", 500)

