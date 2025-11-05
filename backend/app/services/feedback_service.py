"""
Feedback service for managing user feedback submissions
Following README.txt separation of concerns
"""
from flask import current_app
from sqlalchemy import select, func, and_, or_
from typing import Dict, Any
from datetime import datetime
from ..extensions import db
from ..models.feedback import Feedback
from ..models.account import Account
from ..schemas.feedback_schemas import FeedbackSubmissionSchema, FeedbackQuerySchema, FeedbackUpdateSchema
from .error_service import APIError
from .response_service import ResponseService
from ..utils.id_generator import generate_public_id
from ..utils.file_handler import FileHandler


class FeedbackService:
    """Service for managing user feedback submissions"""

    @staticmethod
    def submit_feedback(user_id: int, feedback_data: Dict[str, Any]):
        """Submit feedback from a user"""
        try:
            # validate input data
            schema = FeedbackSubmissionSchema()
            try:
                validated_data = schema.load(feedback_data)
                if not isinstance(validated_data, dict):
                    raise APIError("invalid feedback data", 400)
            except Exception as e:
                raise APIError("invalid feedback data", 400)
            
            # generate public id
            public_id = generate_public_id(Feedback, "FEED")
            
            # create feedback record
            feedback = Feedback()
            feedback.public_id = public_id
            feedback.submitted_by_user_id = user_id
            feedback.feedback_type = validated_data['feedback_type']
            feedback.description = validated_data['description']
            feedback.attached_file_path = validated_data.get('attached_file_path')
            feedback.submission_date = datetime.utcnow()
            feedback.status = 'New'
            
            db.session.add(feedback)
            db.session.commit()
            
            return ResponseService.success_response({
                "message": "feedback submitted successfully",
                "feedbackId": feedback.id,
                "publicId": public_id
            })
            
        except APIError:
            raise
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"submit feedback error: {str(e)}")
            import traceback
            traceback.print_exc()
            raise APIError("internal server error", 500)

    @staticmethod
    def get_user_feedback(user_id: int, params: Dict[str, Any] | None = None):
        """Get all feedback submitted by a specific user"""
        try:
            # validate query parameters
            if params:
                schema = FeedbackQuerySchema()
                try:
                    validated_params = schema.load(params)
                    if not isinstance(validated_params, dict):
                        validated_params = {}
                except Exception:
                    validated_params = {}
            else:
                validated_params = {}
            
            # build base query
            feedback_query = select(Feedback).where(
                Feedback.submitted_by_user_id == user_id
            )
            
            # apply filters if provided
            if validated_params.get('search'):
                search_term = validated_params['search']
                feedback_query = feedback_query.where(
                    or_(
                        Feedback.description.ilike(f'%{search_term}%'),
                        Feedback.feedback_type.ilike(f'%{search_term}%')
                    )
                )
            
            if validated_params.get('feedback_type') and validated_params['feedback_type'] != 'all':
                feedback_query = feedback_query.where(
                    Feedback.feedback_type == validated_params['feedback_type']
                )
            
            if validated_params.get('status') and validated_params['status'] != 'all':
                feedback_query = feedback_query.where(
                    Feedback.status == validated_params['status']
                )
            
            # apply sorting
            sort_by = validated_params.get('sort_by', 'submission_date') if validated_params else 'submission_date'
            sort_order = validated_params.get('sort_order', 'desc') if validated_params else 'desc'
            
            if sort_by == 'id':
                sort_column = Feedback.id
            elif sort_by == 'submission_date':
                sort_column = Feedback.submission_date
            elif sort_by == 'feedback_type':
                sort_column = Feedback.feedback_type
            elif sort_by == 'status':
                sort_column = Feedback.status
            else:
                sort_column = Feedback.submission_date
            
            if sort_order.lower() == 'desc':
                feedback_query = feedback_query.order_by(sort_column.desc())
            else:
                feedback_query = feedback_query.order_by(sort_column.asc())
            
            # get total count
            count_query = select(func.count()).select_from(feedback_query.subquery())
            total = db.session.scalar(count_query)
            
            # apply pagination
            page = validated_params.get('page', 1) if validated_params else 1
            per_page = validated_params.get('per_page', 10) if validated_params else 10
            offset = (page - 1) * per_page
            feedback_query = feedback_query.offset(offset).limit(per_page)
            
            # execute query
            results = db.session.scalars(feedback_query).all()
            
            feedback_list = []
            for feedback in results:
                feedback_list.append({
                    'id': feedback.id,
                    'publicId': feedback.public_id,
                    'feedbackType': feedback.feedback_type,
                    'description': feedback.description,
                    'attachedFilePath': feedback.attached_file_path,
                    'submissionDate': feedback.submission_date.isoformat() if feedback.submission_date else None,
                    'status': feedback.status,
                })
            
            pagination = ResponseService.pagination_info(page, per_page, total or 0)
            return ResponseService.success_response(feedback_list, pagination=pagination)
            
        except Exception as e:
            current_app.logger.error(f"get user feedback error: {str(e)}")
            import traceback
            traceback.print_exc()
            raise APIError("internal server error", 500)

    @staticmethod
    def get_feedback_by_id(feedback_id: int, user_id: int):
        """Get a specific feedback item by ID (only if user owns it)"""
        try:
            feedback = db.session.scalar(
                select(Feedback).where(
                    and_(
                        Feedback.id == feedback_id,
                        Feedback.submitted_by_user_id == user_id
                    )
                )
            )
            
            if not feedback:
                raise APIError("feedback not found", 404)
            
            return ResponseService.success_response({
                'id': feedback.id,
                'publicId': feedback.public_id,
                'feedbackType': feedback.feedback_type,
                'description': feedback.description,
                'attachedFilePath': feedback.attached_file_path,
                'submissionDate': feedback.submission_date.isoformat() if feedback.submission_date else None,
                'status': feedback.status,
            })
            
        except APIError:
            raise
        except Exception as e:
            current_app.logger.error(f"get feedback by id error: {str(e)}")
            import traceback
            traceback.print_exc()
            raise APIError("internal server error", 500)

    @staticmethod
    def get_feedback_statistics(user_id: int):
        """Get feedback statistics for a user"""
        try:
            # get total feedback
            total_feedback = db.session.scalar(
                select(func.count()).select_from(Feedback)
                .where(Feedback.submitted_by_user_id == user_id)
            )
            
            # get by type
            general_count = db.session.scalar(
                select(func.count()).select_from(Feedback)
                .where(and_(
                    Feedback.submitted_by_user_id == user_id,
                    Feedback.feedback_type == 'general'
                ))
            )
            
            bug_count = db.session.scalar(
                select(func.count()).select_from(Feedback)
                .where(and_(
                    Feedback.submitted_by_user_id == user_id,
                    Feedback.feedback_type == 'bug'
                ))
            )
            
            feature_count = db.session.scalar(
                select(func.count()).select_from(Feedback)
                .where(and_(
                    Feedback.submitted_by_user_id == user_id,
                    Feedback.feedback_type == 'feature'
                ))
            )
            
            return {
                'totalFeedback': total_feedback or 0,
                'generalFeedback': general_count or 0,
                'bugReports': bug_count or 0,
                'featureSuggestions': feature_count or 0,
            }
            
        except Exception as e:
            current_app.logger.error(f"get feedback statistics error: {str(e)}")
            import traceback
            traceback.print_exc()
            raise APIError("internal server error", 500)

    @staticmethod
    def update_feedback(feedback_id: int, feedback_data: Dict[str, Any]):
        """Update feedback (admin only)"""
        try:
            from flask_jwt_extended import get_jwt_identity
            
            # validate input data
            schema = FeedbackUpdateSchema()
            try:
                validated_data = schema.load(feedback_data)
                if not isinstance(validated_data, dict):
                    raise APIError("invalid feedback data", 400)
            except Exception as e:
                raise APIError("invalid feedback data", 400)
            
            # get feedback
            feedback = db.session.scalar(
                select(Feedback).where(Feedback.id == feedback_id)
            )
            
            if not feedback:
                raise APIError("feedback not found", 404)
            
            # update fields
            if 'status' in validated_data:
                feedback.status = validated_data['status']
            
            if 'admin_response' in validated_data:
                feedback.admin_response = validated_data['admin_response']
            
            # set reviewed_by_admin_id to current admin
            admin_id = get_jwt_identity()
            feedback.reviewed_by_admin_id = admin_id
            feedback.updated_at = datetime.utcnow()
            
            db.session.commit()
            
            return ResponseService.success_response({
                "message": "feedback updated successfully",
                "feedbackId": feedback.id
            })
            
        except APIError:
            raise
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"update feedback error: {str(e)}")
            import traceback
            traceback.print_exc()
            raise APIError("internal server error", 500)

