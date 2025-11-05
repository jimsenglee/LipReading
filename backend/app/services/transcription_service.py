"""
Transcription business logic service
Following README.txt separation of concerns
"""
import sqlalchemy as sa
from typing import Dict, Any, Optional
from datetime import datetime

from ..extensions import db
from ..models.transcription import Transcription
from ..schemas.transcription_schemas import TranscriptionCreateSchema, TranscriptionUpdateSchema, TranscriptionQuerySchema
from ..services.response_service import ResponseService
from ..services.error_service import APIError
from ..utils.id_generator import generate_public_id


class TranscriptionService:
    """Transcription business logic service"""
    
    @staticmethod
    def get_transcriptions(params: Dict[str, Any], user_id: int):
        """Get paginated list of user's transcriptions with filtering and sorting"""
        try:
            # Validate query parameters
            schema = TranscriptionQuerySchema()
            try:
                validated_params = schema.load(params)
                if not isinstance(validated_params, dict):
                    validated_params = {}
            except Exception:
                validated_params = {}
            
            # Build base query
            query = sa.select(Transcription)
            query = query.where(Transcription.user_id == user_id)
            
            # Apply filters
            if validated_params.get('search'):
                search_term = validated_params['search']
                query = query.where(
                    sa.or_(
                        Transcription.title.ilike(f'%{search_term}%'),
                        Transcription.content_text.ilike(f'%{search_term}%')
                    )
                )
            
            if validated_params.get('status'):
                query = query.where(Transcription.processing_status == validated_params['status'])
            
            # Apply sorting
            sort_by = validated_params.get('sort_by', 'creation_date')
            sort_order = validated_params.get('sort_order', 'desc')
            
            sort_column = getattr(Transcription, sort_by, Transcription.creation_date)
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
            transcriptions = db.session.scalars(query).all()
            
            # Format response
            transcription_list = []
            for t in transcriptions:
                transcription_list.append({
                    'id': t.id,
                    'publicId': t.public_id,
                    'title': t.title,
                    'contentText': t.content_text,
                    'timestampsJson': t.timestamps_json,
                    'creationDate': t.creation_date.isoformat() if t.creation_date else None,
                    'videoSourcePath': t.video_source_path,
                    'processingStatus': t.processing_status,
                    'gdriveFileId': t.gdrive_file_id,
                    'colabJobId': t.colab_job_id,
                    'processedAt': t.processed_at.isoformat() if t.processed_at else None,
                    'durationSeconds': t.duration_seconds
                })
            
            pagination = ResponseService.pagination_info(page, per_page, total or 0)
            return ResponseService.success_response(transcription_list, pagination=pagination)
            
        except APIError:
            raise
        except Exception as e:
            raise APIError(f"Failed to retrieve transcriptions: {str(e)}", 500)
    
    @staticmethod
    def get_transcription(transcription_id: int, user_id: int):
        """Get single transcription by ID"""
        try:
            transcription = db.session.scalar(
                sa.select(Transcription).where(
                    Transcription.id == transcription_id,
                    Transcription.user_id == user_id
                )
            )
            
            if not transcription:
                raise APIError("Transcription not found", 404)
            
            return ResponseService.success_response({
                'id': transcription.id,
                'publicId': transcription.public_id,
                'title': transcription.title,
                'contentText': transcription.content_text,
                'timestampsJson': transcription.timestamps_json,
                'creationDate': transcription.creation_date.isoformat() if transcription.creation_date else None,
                'videoSourcePath': transcription.video_source_path,
                'processingStatus': transcription.processing_status,
                'gdriveFileId': transcription.gdrive_file_id,
                'colabJobId': transcription.colab_job_id,
                'processedAt': transcription.processed_at.isoformat() if transcription.processed_at else None,
                'durationSeconds': transcription.duration_seconds
            })
            
        except APIError:
            raise
        except Exception as e:
            raise APIError(f"Failed to retrieve transcription: {str(e)}", 500)
    
    @staticmethod
    def create_transcription(data: Dict[str, Any], user_id: int):
        """Create new transcription"""
        try:
            # Validate input
            schema = TranscriptionCreateSchema()
            try:
                validated_data = schema.load(data)
                if not isinstance(validated_data, dict):
                    validated_data = {}
            except Exception:
                validated_data = {}
            
            # Generate public ID
            public_id = generate_public_id(Transcription, 'TRANS')
            
            # Create transcription
            transcription = Transcription()
            transcription.public_id = public_id
            transcription.user_id = user_id
            transcription.title = validated_data.get('title', '')
            transcription.video_source_path = validated_data.get('video_source_path')
            transcription.duration_seconds = validated_data.get('duration_seconds')
            transcription.processing_status = 'pending'
            
            db.session.add(transcription)
            db.session.commit()
            
            return ResponseService.success_response({
                'id': transcription.id,
                'publicId': transcription.public_id,
                'title': transcription.title,
                'processingStatus': transcription.processing_status
            }, message="Transcription created successfully")
            
        except Exception as e:
            db.session.rollback()
            raise APIError(f"Failed to create transcription: {str(e)}", 500)
    
    @staticmethod
    def update_transcription(transcription_id: int, data: Dict[str, Any], user_id: int):
        """Update existing transcription"""
        try:
            # Validate input
            schema = TranscriptionUpdateSchema()
            try:
                validated_data = schema.load(data)
                if not isinstance(validated_data, dict):
                    validated_data = {}
            except Exception:
                validated_data = {}
            
            # Get transcription
            transcription = db.session.scalar(
                sa.select(Transcription).where(
                    Transcription.id == transcription_id,
                    Transcription.user_id == user_id
                )
            )
            
            if not transcription:
                raise APIError("Transcription not found", 404)
            
            # Update fields
            for key, value in validated_data.items():
                setattr(transcription, key, value)
            
            db.session.commit()
            
            return ResponseService.success_response({
                'id': transcription.id,
                'publicId': transcription.public_id,
                'processingStatus': transcription.processing_status
            }, message="Transcription updated successfully")
            
        except APIError:
            raise
        except Exception as e:
            db.session.rollback()
            raise APIError(f"Failed to update transcription: {str(e)}", 500)
    
    @staticmethod
    def update_transcription_status(transcription_id: int, status: str, gdrive_file_id: Optional[str] = None, colab_job_id: Optional[str] = None):
        """Update transcription processing status (internal use)"""
        try:
            transcription = db.session.scalar(
                sa.select(Transcription).where(Transcription.id == transcription_id)
            )
            
            if not transcription:
                raise APIError("Transcription not found", 404)
            
            transcription.processing_status = status
            
            if status == 'completed':
                transcription.processed_at = datetime.utcnow()
            
            if gdrive_file_id:
                transcription.gdrive_file_id = gdrive_file_id
            
            if colab_job_id:
                transcription.colab_job_id = colab_job_id
            
            db.session.commit()
            
        except APIError:
            raise
        except Exception as e:
            db.session.rollback()
            raise APIError(f"Failed to update transcription status: {str(e)}", 500)
    
    @staticmethod
    def delete_transcription(transcription_id: int, user_id: int):
        """Delete transcription"""
        try:
            transcription = db.session.scalar(
                sa.select(Transcription).where(
                    Transcription.id == transcription_id,
                    Transcription.user_id == user_id
                )
            )
            
            if not transcription:
                raise APIError("Transcription not found", 404)
            
            db.session.delete(transcription)
            db.session.commit()
            
            return ResponseService.success_response(None, message="Transcription deleted successfully")
            
        except APIError:
            raise
        except Exception as e:
            db.session.rollback()
            raise APIError(f"Failed to delete transcription: {str(e)}", 500)

