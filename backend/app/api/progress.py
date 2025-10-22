from flask import Blueprint, request, jsonify, current_app
from sqlalchemy import select
from datetime import datetime

from ..extensions import db
from ..models.user import User
from ..models.tutorial import Tutorial
from ..models.user_bookmark import user_bookmarks
from .auth import token_required

progress_bp = Blueprint('progress', __name__)


@progress_bp.route('/series/<int:series_id>/enroll', methods=['POST'])
@token_required
def enroll_in_series(current_user, series_id):
    """enroll user in a tutorial series"""
    try:
        # check if series exists
        series = db.session.scalar(select(Tutorial).where(Tutorial.id == series_id))
        if not series:
            return jsonify({'error': 'series not found'}), 404
        
        # check if already enrolled (using bookmarks as enrollment for now)
        existing_bookmark = db.session.scalar(
            select(user_bookmarks).where(
                user_bookmarks.c.user_id == current_user.id,
                user_bookmarks.c.tutorial_id == series_id
            )
        )
        
        if existing_bookmark:
            return jsonify({
                'success': False,
                'message': 'already enrolled in this series'
            }), 409
        
        # create enrollment (using bookmark table for now)
        db.session.execute(
            user_bookmarks.insert().values(
                user_id=current_user.id,
                tutorial_id=series_id
            )
        )
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'successfully enrolled in the series!'
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'enrollment error: {str(e)}')
        return jsonify({'error': 'internal server error'}), 500


@progress_bp.route('/series/<int:series_id>/unenroll', methods=['POST'])
@token_required
def unenroll_from_series(current_user, series_id):
    """unenroll user from a tutorial series"""
    try:
        # find enrollment
        bookmark = db.session.scalar(
            select(user_bookmarks).where(
                user_bookmarks.c.user_id == current_user.id,
                user_bookmarks.c.tutorial_id == series_id
            )
        )
        
        if not bookmark:
            return jsonify({
                'success': False,
                'message': 'not enrolled in this series'
            }), 404
        
        # remove enrollment
        db.session.execute(
            user_bookmarks.delete().where(
                user_bookmarks.c.user_id == current_user.id,
                user_bookmarks.c.tutorial_id == series_id
            )
        )
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'successfully unenrolled from the series'
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'unenrollment error: {str(e)}')
        return jsonify({'error': 'internal server error'}), 500


@progress_bp.route('/series/<int:series_id>/progress', methods=['GET'])
@token_required
def get_series_progress(current_user, series_id):
    """get user's progress for a specific series"""
    try:
        # check if enrolled
        bookmark = db.session.scalar(
            select(user_bookmarks).where(
                user_bookmarks.c.user_id == current_user.id,
                user_bookmarks.c.tutorial_id == series_id
            )
        )
        
        if not bookmark:
            return jsonify({
                'success': False,
                'message': 'not enrolled in this series'
            }), 404
        
        # for now, return basic enrollment info
        # in a real app, you'd have a separate progress table
        progress = {
            'seriesId': str(series_id),
            'status': 'in-progress',
            'enrolledAt': bookmark.created_at.isoformat(),
            'completedVideos': [],  # would come from video progress table
            'totalWatchTime': 0,    # would be calculated from video progress
            'lastWatchedVideo': None
        }
        
        return jsonify({
            'success': True,
            'progress': progress
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'progress retrieval error: {str(e)}')
        return jsonify({'error': 'internal server error'}), 500


@progress_bp.route('/series/<int:series_id>/rating', methods=['POST'])
@token_required
def submit_series_rating(current_user, series_id):
    """submit rating and review for a series"""
    try:
        data = request.get_json()
        rating = data.get('rating')
        review = data.get('review', '')
        
        if not rating or not isinstance(rating, int) or rating < 1 or rating > 5:
            return jsonify({'error': 'invalid rating'}), 400
        
        # check if series exists
        series = db.session.scalar(select(Tutorial).where(Tutorial.id == series_id))
        if not series:
            return jsonify({'error': 'series not found'}), 404
        
        # for now, just return success
        # in a real app, you'd store this in a ratings/reviews table
        return jsonify({
            'success': True,
            'message': 'thank you for your feedback!'
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'rating submission error: {str(e)}')
        return jsonify({'error': 'internal server error'}), 500


@progress_bp.route('/video/<int:video_id>/feedback', methods=['POST'])
@token_required
def submit_video_feedback(current_user, video_id):
    """submit feedback for a specific video"""
    try:
        data = request.get_json()
        helpful = data.get('helpful')
        comments = data.get('comments', '')
        
        if helpful is None:
            return jsonify({'error': 'helpful field is required'}), 400
        
        # for now, just return success
        # in a real app, you'd store this in a video feedback table
        return jsonify({
            'success': True,
            'message': 'thank you for your feedback!'
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'video feedback error: {str(e)}')
        return jsonify({'error': 'internal server error'}), 500


@progress_bp.route('/user/progress', methods=['GET'])
@token_required
def get_user_progress(current_user):
    """get all user's progress across all series"""
    try:
        # get all enrolled series
        bookmarks = db.session.scalars(
            select(user_bookmarks).where(user_bookmarks.c.user_id == current_user.id)
        ).all()
        
        progress_data = {}
        for bookmark in bookmarks:
            progress_data[str(bookmark.tutorial_id)] = {
                'status': 'in-progress',
                'enrolledAt': bookmark.created_at.isoformat(),
                'completedVideos': [],
                'totalWatchTime': 0,
                'lastWatchedVideo': None
            }
        
        return jsonify({
            'success': True,
            'progress': progress_data
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'user progress error: {str(e)}')
        return jsonify({'error': 'internal server error'}), 500
