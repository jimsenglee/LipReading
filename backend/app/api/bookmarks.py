"""
bookmark API endpoints
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models.account import Account
from ..services.bookmark_service import BookmarkService
from ..services.error_service import APIError, handle_api_error
from ..services.response_service import ResponseService

bookmark_bp = Blueprint('bookmark', __name__)


@bookmark_bp.route("/bookmarks", methods=["GET"])
@jwt_required()
def get_user_bookmarks():
    """get all bookmarks for the current user with filtering and pagination"""
    try:
        current_user_id = get_jwt_identity()
        bookmarks = BookmarkService.get_user_bookmarks(current_user_id, request.args)
        return bookmarks
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return ResponseService.error_response(f"Failed to get bookmarks: {str(e)}", 500)


@bookmark_bp.route("/bookmarks/<int:tutorial_id>", methods=["POST"])
@jwt_required()
def add_bookmark(tutorial_id):
    """add a tutorial to user's bookmarks"""
    try:
        current_user_id = get_jwt_identity()
        result = BookmarkService.add_bookmark(current_user_id, tutorial_id)
        return ResponseService.success_response(result)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to add bookmark: {str(e)}", 500)


@bookmark_bp.route("/bookmarks/<int:tutorial_id>", methods=["DELETE"])
@jwt_required()
def remove_bookmark(tutorial_id):
    """remove a tutorial from user's bookmarks"""
    try:
        current_user_id = get_jwt_identity()
        result = BookmarkService.remove_bookmark(current_user_id, tutorial_id)
        return ResponseService.success_response(result)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to remove bookmark: {str(e)}", 500)


@bookmark_bp.route("/bookmarks/<int:tutorial_id>/check", methods=["GET"])
@jwt_required()
def check_bookmark(tutorial_id):
    """check if a tutorial is bookmarked by user"""
    try:
        current_user_id = get_jwt_identity()
        is_bookmarked = BookmarkService.is_bookmarked(current_user_id, tutorial_id)
        return ResponseService.success_response({"isBookmarked": is_bookmarked})
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to check bookmark: {str(e)}", 500)


@bookmark_bp.route("/bookmarks/bulk", methods=["POST"])
@jwt_required()
def bulk_add_bookmarks():
    """add multiple tutorials to user's bookmarks"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        if not data or 'tutorial_ids' not in data:
            return ResponseService.error_response("tutorial_ids list is required", 400)
        
        result = BookmarkService.bulk_add_bookmarks(current_user_id, data['tutorial_ids'])
        return ResponseService.success_response(result)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to bulk add bookmarks: {str(e)}", 500)


@bookmark_bp.route("/bookmarks/bulk", methods=["DELETE"])
@jwt_required()
def bulk_remove_bookmarks():
    """remove multiple tutorials from user's bookmarks"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        if not data or 'tutorial_ids' not in data:
            return ResponseService.error_response("tutorial_ids list is required", 400)
        
        result = BookmarkService.bulk_remove_bookmarks(current_user_id, data['tutorial_ids'])
        return ResponseService.success_response(result)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to bulk remove bookmarks: {str(e)}", 500)


@bookmark_bp.route("/bookmarks/search", methods=["GET"])
@jwt_required()
def search_bookmarks():
    """search bookmarks with advanced filtering"""
    try:
        current_user_id = get_jwt_identity()
        search_term = request.args.get('q')
        if not search_term:
            return ResponseService.error_response("search term (q) is required", 400)
        
        result = BookmarkService.search_bookmarks(current_user_id, search_term, request.args)
        return result
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to search bookmarks: {str(e)}", 500)
