"""
Feedback business logic service
Following README.txt separation of concerns
"""
import sqlalchemy as sa
from typing import Dict, Any
from flask import current_app
from werkzeug.datastructures import FileStorage

from ..extensions import db
from ..models.feedback import Feedback
from ..schemas.feedback_schemas import FeedbackCreateSchema, FeedbackUpdateSchema, FeedbackQuerySchema
from ..services.response_service import ResponseService
from ..services.error_service import APIError
from ..utils.id_generator import generate_public_id
from ..utils.file_handler import FileHandler


class FeedbackService:
    """Feedback business logic service"""

    # File upload configuration
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    ALLOWED_FILE_TYPES = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/mov', 'video/avi'
    ]
    
    @staticmethod
    def create_feedback(user_id: int, data: Dict[str, Any], file: FileStorage = None):
        """Create new feedback with optional file attachment"""
        try:
            print(f"[DEBUG] create_feedback called for user_id: {user_id}, type: {data.get('feedback_type')}")
            
            # Validate input data
            schema = FeedbackCreateSchema()
            try:
                validated_data = schema.load(data)
                if not isinstance(validated_data, dict):
                    validated_data = {}
            except Exception as e:
                print(f"[DEBUG] Validation error: {str(e)}")
                raise APIError(f"Invalid feedback data: {str(e)}", 400)
            
            # Handle file upload if provided
            attached_file_path = None
            if file and file.filename:
                print(f"[DEBUG] Processing file upload: {file.filename}")
                
                # Validate file type
                if file.content_type not in FeedbackService.ALLOWED_FILE_TYPES:
                    raise APIError("Unsupported file type. Please upload an image or video file.", 400)
                
                # Validate file size
                if file.content_length and file.content_length > FeedbackService.MAX_FILE_SIZE:
                    raise APIError(f"File size exceeds maximum limit of {FeedbackService.MAX_FILE_SIZE / 1024 / 1024} MB.", 400)
                
                # Create feedback upload directory
                upload_dir = FileHandler.create_upload_directory("uploads/feedback")
                
                # Generate unique filename
                unique_filename = FileHandler.generate_unique_filename(file.filename, prefix="feedback")
                
                # Save file
                file_path = FileHandler.save_uploaded_file(file, upload_dir, unique_filename)
                
                # Get relative path for database storage
                attached_file_path = FileHandler.get_relative_path(file_path)
                print(f"[DEBUG] File saved to: {attached_file_path}")
            
            # Create feedback record
            feedback = Feedback()
            feedback.public_id = generate_public_id(Feedback, 'FB')
            feedback.submitted_by_user_id = user_id
            feedback.feedback_type = validated_data['feedback_type']
            feedback.description = validated_data['description']
            feedback.attached_file_path = attached_file_path
            feedback.status = 'New'
            
            db.session.add(feedback)
            db.session.commit()
            
            print(f"[DEBUG] Successfully created feedback with public_id: {feedback.public_id}")
            
            return {
                "message": "Feedback submitted successfully",
                "data": {
                    "publicId": feedback.public_id,
                    "feedbackType": feedback.feedback_type,
                    "description": feedback.description,
                    "status": feedback.status,
                    "submissionDate": feedback.submission_date.isoformat() if feedback.submission_date else None
                }
            }
            
        except APIError:
            db.session.rollback()
            raise
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"create feedback error: {str(e)}")
            import traceback
            traceback.print_exc()
            raise APIError("internal server error", 500)

    @staticmethod
    def get_feedbacks(params: Dict[str, Any] | None = None, user_id: int = None, is_admin: bool = False):
        """Get paginated list of feedbacks with filtering and sorting"""
        try:
            print(f"[DEBUG] get_feedbacks called, user_id: {user_id}, is_admin: {is_admin}")
            
            # Validate query parameters
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
            
            # Build base query
            query = sa.select(Feedback)
            
            # Apply user filter if not admin
            if not is_admin and user_id:
                query = query.where(Feedback.submitted_by_user_id == user_id)
            
            # Apply filters
            if validated_params.get('search'):
                search_term = validated_params['search']
                query = query.where(
                    sa.or_(
                        Feedback.description.ilike(f'%{search_term}%'),
                        Feedback.feedback_type.ilike(f'%{search_term}%')
                    )
                )
            
            if validated_params.get('feedback_type') and validated_params['feedback_type'] != 'all':
                query = query.where(Feedback.feedback_type == validated_params['feedback_type'])
            
            if validated_params.get('status') and validated_params['status'] != 'all':
                query = query.where(Feedback.status == validated_params['status'])
            
            # Apply sorting
            sort_by = validated_params.get('sort_by', 'submission_date')
            sort_order = validated_params.get('sort_order', 'desc')
            
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
                query = query.order_by(sa.desc(sort_column))
            else:
                query = query.order_by(sa.asc(sort_column))
            
            # Get total count
            count_query = sa.select(sa.func.count()).select_from(query.subquery())
            total = db.session.scalar(count_query)
            
            # Apply pagination
            page = validated_params.get('page', 1)
            per_page = validated_params.get('per_page', 10)
            offset = (page - 1) * per_page
            query = query.offset(offset).limit(per_page)
            
            # Execute query
            feedbacks = db.session.scalars(query).all()
            
            print(f"[DEBUG] Found {len(feedbacks)} feedback entries")
            
            # Format response
            feedback_list = []
            for f in feedbacks:
                feedback_list.append({
                    'id': f.id,
                    'publicId': f.public_id,
                    'submittedByUserId': f.submitted_by_user_id,
                    'feedbackType': f.feedback_type,
                    'description': f.description,
                    'attachedFilePath': f.attached_file_path,
                    'submissionDate': f.submission_date.isoformat() if f.submission_date else None,
                    'status': f.status,
                    'reviewedByAdminId': f.reviewed_by_admin_id,
                })
            
            pagination = ResponseService.pagination_info(page, per_page, total or 0)
            return ResponseService.success_response(feedback_list, pagination=pagination)
            
        except Exception as e:
            current_app.logger.error(f"get feedbacks error: {str(e)}")
            import traceback
            traceback.print_exc()
            raise APIError("internal server error", 500)

    @staticmethod
    def get_feedback(feedback_id: int, user_id: int = None, is_admin: bool = False):
        """Get single feedback by ID"""
        try:
            print(f"[DEBUG] get_feedback called for feedback_id: {feedback_id}, user_id: {user_id}")
            
            feedback = db.session.scalar(
                sa.select(Feedback).where(Feedback.id == feedback_id)
            )
            
            if not feedback:
                raise APIError("Feedback not found", 404)
            
            # Check permissions
            if not is_admin and feedback.submitted_by_user_id != user_id:
                raise APIError("Access denied", 403)
            
            return {
                'id': feedback.id,
                'publicId': feedback.public_id,
                'submittedByUserId': feedback.submitted_by_user_id,
                'feedbackType': feedback.feedback_type,
                'description': feedback.description,
                'attachedFilePath': feedback.attached_file_path,
                'submissionDate': feedback.submission_date.isoformat() if feedback.submission_date else None,
                'status': feedback.status,
                'reviewedByAdminId': feedback.reviewed_by_admin_id,
            }
            
        except APIError:
            raise
        except Exception as e:
            current_app.logger.error(f"get feedback error: {str(e)}")
            import traceback
            traceback.print_exc()
            raise APIError("internal server error", 500)

    @staticmethod
    def update_feedback_status(feedback_id: int, data: Dict[str, Any], admin_id: int):
        """Update feedback status (admin only)"""
        try:
            print(f"[DEBUG] update_feedback_status called for feedback_id: {feedback_id}")
            
            # Validate input data
            schema = FeedbackUpdateSchema()
            try:
                validated_data = schema.load(data)
                if not isinstance(validated_data, dict):
                    validated_data = {}
            except Exception as e:
                print(f"[DEBUG] Validation error: {str(e)}")
                raise APIError(f"Invalid feedback data: {str(e)}", 400)
            
            # Get feedback
            feedback = db.session.scalar(
                sa.select(Feedback).where(Feedback.id == feedback_id)
            )
            
            if not feedback:
                raise APIError("Feedback not found", 404)
            
            # Update fields
            if 'status' in validated_data:
                feedback.status = validated_data['status']
            feedback.reviewed_by_admin_id = admin_id
            
            db.session.commit()
            
            print(f"[DEBUG] Successfully updated feedback status")
            
            return {"message": "Feedback status updated successfully"}
            
        except APIError:
            db.session.rollback()
            raise
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"update feedback status error: {str(e)}")
            import traceback
            traceback.print_exc()
            raise APIError("internal server error", 500)

    @staticmethod
    def delete_feedback(feedback_id: int, user_id: int, is_admin: bool = False):
        """Delete feedback"""
        try:
            print(f"[DEBUG] delete_feedback called for feedback_id: {feedback_id}")
            
            feedback = db.session.scalar(
                sa.select(Feedback).where(Feedback.id == feedback_id)
            )
            
            if not feedback:
                raise APIError("Feedback not found", 404)
            
            # Check permissions
            if not is_admin and feedback.submitted_by_user_id != user_id:
                raise APIError("Access denied", 403)
            
            # Delete attached file if exists
            if feedback.attached_file_path:
                try:
                    from ..utils.file_handler import FileHandler
                    import os
                    full_path = os.path.join(current_app.root_path, '..', feedback.attached_file_path)
                    if os.path.exists(full_path):
                        os.remove(full_path)
                        print(f"[DEBUG] Deleted attached file: {full_path}")
                except Exception as e:
                    print(f"[DEBUG] Error deleting file: {str(e)}")
            
            db.session.delete(feedback)
            db.session.commit()
            
            print(f"[DEBUG] Successfully deleted feedback")
            
            return {"message": "Feedback deleted successfully"}
            
        except APIError:
            db.session.rollback()
            raise
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"delete feedback error: {str(e)}")
            import traceback
            traceback.print_exc()
            raise APIError("internal server error", 500)

