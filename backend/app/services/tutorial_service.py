"""
Tutorial business logic service
Following README.txt separation of concerns
"""
import sqlalchemy as sa
from sqlalchemy.orm import joinedload
from sqlalchemy import select
from typing import Dict, Any, List, Optional
from flask import current_app

from ..extensions import db
from ..models import Tutorial, Category
from ..models.review import Review
from ..schemas.tutorial_schemas import TutorialCreateSchema, TutorialUpdateSchema, TutorialQuerySchema
from ..services.response_service import ResponseService
from ..services.error_service import APIError, FileAccessError, ValidationError, create_file_access_error, create_validation_error
from ..utils.id_generator import generate_public_id


class TutorialService:
    """Tutorial business logic service"""
    
    @staticmethod
    def get_tutorials(params: Dict[str, Any]):
        """Get paginated list of tutorials with filtering and sorting"""
        try:
            # validate query parameters
            schema = TutorialQuerySchema()
            try:
                validated_params = schema.load(params)
                if not isinstance(validated_params, dict):
                    validated_params = {}
            except Exception:
                validated_params = {}
            
            # Build base query
            query = sa.select(Tutorial).options(joinedload(Tutorial.category))
            query = query.where(Tutorial.status != 'deleted')
            
            # Apply filters
            if validated_params.get('search'):
                search_term = validated_params['search']
                query = query.where(
                    sa.or_(
                        Tutorial.title.ilike(f'%{search_term}%'),
                        Tutorial.description.ilike(f'%{search_term}%')
                    )
                )
            
            if validated_params.get('category_id'):
                query = query.where(Tutorial.category_id == validated_params['category_id'])
            
            if validated_params.get('status') and validated_params['status'] != 'all':
                query = query.where(Tutorial.status == validated_params['status'])
            
            if validated_params.get('difficulty'):
                query = query.where(Tutorial.difficulty == validated_params['difficulty'])
            
            # Apply sorting
            sort_by = validated_params.get('sort_by', 'created_at')
            sort_order = validated_params.get('sort_order', 'desc')
            
            if sort_by == 'category':
                query = query.join(Category, Tutorial.category_id == Category.id)
                sort_column = Category.category_name
            else:
                sort_column = getattr(Tutorial, sort_by, Tutorial.created_at)
            
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
            tutorials = db.session.scalars(query).unique().all()
            
            # Format response
            tutorial_list = []
            for t in tutorials:
                tutorial_list.append({
                    'id': t.id,
                    'publicId': t.public_id,
                    'categoryId': t.category_id,
                    'categoryName': t.category.category_name if t.category else None,
                    'title': t.title,
                    'description': t.description,
                    'videoPath': t.video_path,
                    'subtitlePath': t.subtitle_path,  # subtitle support for educational video player
                    'status': t.status,
                    'difficulty': t.difficulty,
                    'author': t.author,
                    'thumbnailPath': t.thumbnail_path,
                    'views': t.views,
                    'rating': float(db.session.scalar(sa.select(sa.func.coalesce(sa.func.avg(Review.rating), 0)).where(Review.target_type=='tutorial', Review.target_id==t.id)) or 0.0),
                    'createdAt': t.created_at.isoformat() if t.created_at else None,
                    'updatedAt': t.updated_at.isoformat() if t.updated_at else None,
                    'videoDuration': t.video_duration, # add video duration field
                    'tags': t.tags, # add tags field
                })
            
            pagination = ResponseService.pagination_info(page, per_page, total or 0)
            return ResponseService.success_response(tutorial_list, pagination=pagination)
            
        except Exception as e:
            raise APIError(f"Failed to retrieve tutorials: {str(e)}", 500)
    
    @staticmethod
    def get_tutorial(tutorial_id: int):
        """Get single tutorial by ID"""
        try:
            tutorial = db.session.scalar(
                sa.select(Tutorial).options(joinedload(Tutorial.category))
                .where(Tutorial.id == tutorial_id)
                .where(Tutorial.status != 'deleted')
            )
            
            if not tutorial:
                raise APIError("Tutorial not found", 404)
            
            # Increment view count
            tutorial.views += 1
            db.session.commit()
            
            return ResponseService.success_response({
                'id': tutorial.id,
                'publicId': tutorial.public_id,
                'categoryId': tutorial.category_id,
                'categoryName': tutorial.category.category_name if tutorial.category else None,
                'title': tutorial.title,
                'description': tutorial.description,
                'videoPath': tutorial.video_path,
                'subtitlePath': tutorial.subtitle_path,  # subtitle support for educational video player
                'status': tutorial.status,
                'difficulty': tutorial.difficulty,
                'author': tutorial.author,
                'thumbnailPath': tutorial.thumbnail_path,
                'duration': tutorial.video_duration,
                'learningObjectives': tutorial.learning_objectives,
                'prerequisites': tutorial.prerequisites,
                'tags': tutorial.tags,
                'isPreview': tutorial.is_preview,
                'seriesId': tutorial.parent_series_id,
                'seriesTitle': tutorial.video_title,
                'orderInSeries': tutorial.video_order,
                'views': tutorial.views,
                'rating': float(db.session.scalar(sa.select(sa.func.coalesce(sa.func.avg(Review.rating), 0)).where(Review.target_type=='tutorial', Review.target_id==tutorial.id)) or 0.0),
                'createdAt': tutorial.created_at.isoformat() if tutorial.created_at else None,
                'updatedAt': tutorial.updated_at.isoformat() if tutorial.updated_at else None,
            })
            
        except APIError:
            raise
        except Exception as e:
            raise APIError(f"Failed to retrieve tutorial: {str(e)}", 500)
    
    @staticmethod
    def create_tutorial(data: Dict[str, Any], user_name: str):
        """Create new tutorial"""
        try:
            # validate input data
            schema = TutorialCreateSchema()
            try:
                validated_data = schema.load(data)
                if not isinstance(validated_data, dict):
                    validated_data = {}
            except Exception:
                validated_data = {}
            
            # Validate category exists
            category = db.session.scalar(
                sa.select(Category).where(Category.id == validated_data['category_id'])
            )
            if not category:
                raise APIError("Category not found", 400)
            
            # Generate public ID
            public_id = generate_public_id(Tutorial, "TUT")
            
            # Create tutorial
            tutorial = Tutorial()
            tutorial.public_id = public_id
            tutorial.category_id = validated_data['category_id']
            tutorial.title = validated_data['title']
            tutorial.description = validated_data.get('description', '')
            tutorial.video_path = validated_data.get('video_path', '')
            tutorial.subtitle_path = validated_data.get('subtitle_path')
            tutorial.status = validated_data.get('status', 'draft')
            tutorial.difficulty = validated_data.get('difficulty', 'beginner')
            tutorial.author = user_name
            tutorial.thumbnail_path = validated_data.get('thumbnail_path')
            tutorial.views = 0
            
            db.session.add(tutorial)
            db.session.commit()
            
            return ResponseService.success_response({
                'id': tutorial.id,
                'publicId': tutorial.public_id,
                'message': 'Tutorial created successfully'
            })
            
        except APIError:
            raise
        except Exception as e:
            db.session.rollback()
            raise APIError(f"Failed to create tutorial: {str(e)}", 500)
    
    @staticmethod
    def update_tutorial(tutorial_id: int, data: Dict[str, Any]):
        """Update existing tutorial"""
        try:
            # validate input data
            schema = TutorialUpdateSchema()
            try:
                validated_data = schema.load(data)
                if not isinstance(validated_data, dict):
                    validated_data = {}
            except Exception:
                validated_data = {}
            
            tutorial = db.session.scalar(
                sa.select(Tutorial).where(Tutorial.id == tutorial_id)
            )
            if not tutorial:
                raise APIError("Tutorial not found", 404)
            
            # Update fields
            for field, value in validated_data.items():
                if hasattr(tutorial, field):
                    setattr(tutorial, field, value)
            
            db.session.commit()
            
            return ResponseService.success_response({
                'id': tutorial.id,
                'publicId': tutorial.public_id,
                'message': 'Tutorial updated successfully'
            })
            
        except APIError:
            raise
        except Exception as e:
            db.session.rollback()
            raise APIError(f"Failed to update tutorial: {str(e)}", 500)
    
    @staticmethod
    def delete_tutorial(tutorial_id: int):
        """Soft delete tutorial"""
        try:
            tutorial = db.session.scalar(
                sa.select(Tutorial).where(Tutorial.id == tutorial_id)
            )
            if not tutorial:
                raise APIError("Tutorial not found", 404)
            
            # Soft delete
            tutorial.status = 'deleted'
            db.session.commit()
            
            return ResponseService.success_response({
                'message': 'Tutorial deleted successfully'
            })
            
        except APIError:
            raise
        except Exception as e:
            db.session.rollback()
            raise APIError(f"Failed to delete tutorial: {str(e)}", 500)
    
    @staticmethod
    def create_tutorial_series(data: Dict[str, Any], user_name: str):
        """Create new tutorial series with multiple videos"""
        try:
            # Validate input data for series creation
            required_fields = ['title', 'description', 'category_id']
            for field in required_fields:
                if field not in data:
                    raise APIError(f"Missing required field: {field}", 400)
            
            # Validate category exists
            category = db.session.scalar(
                sa.select(Category).where(Category.id == data['category_id'])
            )
            if not category:
                raise APIError("Category not found", 400)
            
            # Generate public ID for series
            series_public_id = generate_public_id(Tutorial, "TUT")
            
            # Create parent series tutorial
            series_tutorial = Tutorial()
            series_tutorial.public_id = series_public_id
            series_tutorial.category_id = data['category_id']
            series_tutorial.title = data['title']
            series_tutorial.description = data.get('description', '')
            series_tutorial.video_path = data.get('video_path', '')
            series_tutorial.subtitle_path = data.get('subtitle_path')
            series_tutorial.status = data.get('status', 'draft')
            series_tutorial.difficulty = data.get('difficulty', 'beginner')
            series_tutorial.author = user_name
            series_tutorial.thumbnail_path = data.get('thumbnail_path')
            series_tutorial.series_type = 'series'
            series_tutorial.learning_objectives = data.get('learning_objectives', '[]')
            series_tutorial.prerequisites = data.get('prerequisites', '[]')
            series_tutorial.tags = data.get('tags', '[]')
            series_tutorial.views = 0
            
            db.session.add(series_tutorial)
            db.session.flush()  # Get the series ID
            
            # Create individual videos if provided
            videos = data.get('videos', [])
            for i, video_data in enumerate(videos):
                video_public_id = generate_public_id(Tutorial, "TUT")
                
                video_tutorial = Tutorial()
                video_tutorial.public_id = video_public_id
                video_tutorial.category_id = data['category_id']
                video_tutorial.title = video_data.get('title', f"{data['title']} - Part {i+1}")
                video_tutorial.description = video_data.get('description', '')
                video_tutorial.video_path = video_data.get('video_path', '')
                video_tutorial.subtitle_path = video_data.get('subtitle_path')
                video_tutorial.status = data.get('status', 'draft')
                video_tutorial.difficulty = data.get('difficulty', 'beginner')
                video_tutorial.author = user_name
                video_tutorial.thumbnail_path = video_data.get('thumbnail_path')
                video_tutorial.series_type = 'single'
                video_tutorial.parent_series_id = series_tutorial.id
                video_tutorial.video_order = i + 1
                video_tutorial.video_title = video_data.get('title', f"Part {i+1}")
                video_tutorial.video_description = video_data.get('description', '')
                video_tutorial.video_duration = video_data.get('duration', 0)
                video_tutorial.learning_objectives = video_data.get('learning_objectives', '[]')
                video_tutorial.prerequisites = video_data.get('prerequisites', '[]')
                video_tutorial.tags = video_data.get('tags', '[]')
                video_tutorial.is_preview = video_data.get('is_preview', False)
                video_tutorial.views = 0
                
                db.session.add(video_tutorial)
            
            db.session.commit()
            
            return ResponseService.success_response({
                'id': series_tutorial.id,
                'publicId': series_tutorial.public_id,
                'message': 'Tutorial series created successfully',
                'videoCount': len(videos)
            })
            
        except APIError:
            raise
        except Exception as e:
            db.session.rollback()
            raise APIError(f"Failed to create tutorial series: {str(e)}", 500)
    
    @staticmethod
    def get_tutorial_series(params: Dict[str, Any]):
        """Get paginated list of tutorial series"""
        try:
            # validate query parameters
            schema = TutorialQuerySchema()
            try:
                validated_params = schema.load(params)
                if not isinstance(validated_params, dict):
                    validated_params = {}
            except Exception:
                validated_params = {}
            
            # Build base query for series only
            query = sa.select(Tutorial).options(joinedload(Tutorial.category))
            query = query.where(Tutorial.status != 'deleted')
            query = query.where(Tutorial.series_type == 'series')
            
            # Apply filters
            if validated_params.get('search'):
                search_term = validated_params['search']
                query = query.where(
                    sa.or_(
                        Tutorial.title.ilike(f'%{search_term}%'),
                        Tutorial.description.ilike(f'%{search_term}%')
                    )
                )
            
            if validated_params.get('category_id'):
                query = query.where(Tutorial.category_id == validated_params['category_id'])
            
            if validated_params.get('status') and validated_params['status'] != 'all':
                query = query.where(Tutorial.status == validated_params['status'])
            
            if validated_params.get('difficulty'):
                query = query.where(Tutorial.difficulty == validated_params['difficulty'])
            
            # Apply sorting
            sort_by = validated_params.get('sort_by', 'created_at')
            sort_order = validated_params.get('sort_order', 'desc')
            
            if sort_by == 'category':
                query = query.join(Category, Tutorial.category_id == Category.id)
                sort_column = Category.category_name
            else:
                sort_column = getattr(Tutorial, sort_by, Tutorial.created_at)
            
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
            series = db.session.scalars(query).unique().all()
            
            # Format response
            series_list = []
            for s in series:
                # Count videos in series
                video_count = db.session.scalar(
                    sa.select(sa.func.count()).select_from(Tutorial)
                    .where(Tutorial.parent_series_id == s.id)
                    .where(Tutorial.status != 'deleted')
                )
                
            series_list.append({
                    'id': s.id,
                    'publicId': s.public_id,
                    'categoryId': s.category_id,
                    'categoryName': s.category.category_name if s.category else None,
                    'title': s.title,
                    'description': s.description,
                    'videoPath': s.video_path,
                    'subtitlePath': s.subtitle_path,
                    'status': s.status,
                    'difficulty': s.difficulty,
                    'author': s.author,
                    'thumbnailPath': s.thumbnail_path,
                    'views': s.views,
                    'rating': float(db.session.scalar(sa.select(sa.func.coalesce(sa.func.avg(Review.rating), 0)).where(Review.target_type=='tutorial', Review.target_id==s.id)) or 0.0),
                    'videoCount': video_count,
                    'createdAt': s.created_at.isoformat() if s.created_at else None,
                    'updatedAt': s.updated_at.isoformat() if s.updated_at else None,
                    'videoDuration': s.video_duration,
                    'tags': s.tags,
                })
            
            pagination = ResponseService.pagination_info(page, per_page, total or 0)
            return ResponseService.success_response(series_list, pagination=pagination)
            
        except Exception as e:
            raise APIError(f"Failed to retrieve tutorial series: {str(e)}", 500)
    
    @staticmethod
    def get_tutorial_series_by_id(series_id: int):
        """Get single tutorial series by ID with all videos"""
        try:
            # get the parent series
            series = db.session.scalar(
                sa.select(Tutorial).options(joinedload(Tutorial.category))
                .where(Tutorial.id == series_id)
                .where(Tutorial.status != 'deleted')
                .where(Tutorial.series_type == 'series')
            )
            
            if not series:
                raise APIError("Tutorial series not found", 404)
            
            # get all videos in the series (child videos)
            videos = db.session.scalars(
                sa.select(Tutorial).where(Tutorial.parent_series_id == series_id)
                .where(Tutorial.status != 'deleted')
                .order_by(Tutorial.video_order)
            ).all()
            
            # if no child videos found, treat the series itself as a single video
            if not videos:
                videos = [series]
            
            # format videos
            video_list = []
            for v in videos:
                video_list.append({
                    'id': v.id,
                    'publicId': v.public_id,
                    'title': v.video_title or v.title,
                    'description': v.video_description or v.description,
                    'videoPath': v.video_path,
                    'subtitlePath': v.subtitle_path,
                    'videoOrder': v.video_order or 1,  # default to 1 if null
                    'videoDuration': v.video_duration,
                    'isPreview': v.is_preview,
                    'views': v.views,
                    'rating': float(db.session.scalar(sa.select(sa.func.coalesce(sa.func.avg(Review.rating), 0)).where(Review.target_type=='tutorial', Review.target_id==v.id)) or 0.0),
                    'createdAt': v.created_at.isoformat() if v.created_at else None,
                    'updatedAt': v.updated_at.isoformat() if v.updated_at else None,
                })
            
            return ResponseService.success_response({
                'id': series.id,
                'publicId': series.public_id,
                'categoryId': series.category_id,
                'categoryName': series.category.category_name if series.category else None,
                'title': series.title,
                'description': series.description,
                'videoPath': series.video_path,
                'subtitlePath': series.subtitle_path,
                'status': series.status,
                'difficulty': series.difficulty,
                'author': series.author,
                'thumbnailPath': series.thumbnail_path,
                'views': series.views,
                'rating': float(db.session.scalar(sa.select(sa.func.coalesce(sa.func.avg(Review.rating), 0)).where(Review.target_type=='tutorial', Review.target_id==series.id)) or 0.0),
                'videoCount': len(video_list),
                'videos': video_list,
                'learningObjectives': series.learning_objectives,
                'prerequisites': series.prerequisites,
                'tags': series.tags,
                'createdAt': series.created_at.isoformat() if series.created_at else None,
                'updatedAt': series.updated_at.isoformat() if series.updated_at else None,
            })
            
        except APIError:
            raise
        except Exception as e:
            raise APIError(f"Failed to retrieve tutorial series: {str(e)}", 500)
    
    @staticmethod
    def update_tutorial_series(series_id: int, data: Dict[str, Any], user_name: str):
        """Update existing tutorial series"""
        try:
            # validate input data
            schema = TutorialUpdateSchema()
            try:
                validated_data = schema.load(data)
                if not isinstance(validated_data, dict):
                    validated_data = {}
            except Exception:
                validated_data = {}
            
            # get the series
            series = db.session.scalar(
                sa.select(Tutorial).where(Tutorial.id == series_id)
                .where(Tutorial.series_type == 'series')
            )
            if not series:
                raise APIError("Tutorial series not found", 404)
            
            # update series fields
            for field, value in validated_data.items():
                if hasattr(series, field):
                    setattr(series, field, value)
            
            # update videos if provided
            if 'videos' in data:
                videos_data = data['videos']
                if isinstance(videos_data, list):
                    # get existing videos
                    existing_videos = db.session.scalars(
                        sa.select(Tutorial).where(Tutorial.parent_series_id == series_id)
                    ).all()
                    
                    # update existing videos
                    for i, video_data in enumerate(videos_data):
                        if i < len(existing_videos):
                            video = existing_videos[i]
                            for v_field, v_value in video_data.items():
                                if hasattr(video, v_field):
                                    setattr(video, v_field, v_value)
                                elif v_field == 'title':
                                    video.video_title = v_value
                                elif v_field == 'description':
                                    video.video_description = v_value
            
            db.session.commit()
            
            return ResponseService.success_response({
                'id': series.id,
                'publicId': series.public_id,
                'message': 'Tutorial series updated successfully'
            })
            
        except APIError:
            raise
        except Exception as e:
            db.session.rollback()
            raise APIError(f"Failed to update tutorial series: {str(e)}", 500)
    
    @staticmethod
    def delete_tutorial_series(series_id: int):
        """Soft delete tutorial series and all its videos"""
        try:
            # get the series
            series = db.session.scalar(
                sa.select(Tutorial).where(Tutorial.id == series_id)
                .where(Tutorial.series_type == 'series')
            )
            if not series:
                raise APIError("Tutorial series not found", 404)
            
            # soft delete the series
            series.status = 'deleted'
            
            # soft delete all videos in the series
            videos = db.session.scalars(
                sa.select(Tutorial).where(Tutorial.parent_series_id == series_id)
            ).all()
            
            for video in videos:
                video.status = 'deleted'
            
            db.session.commit()
            
            return ResponseService.success_response({
                'message': 'Tutorial series deleted successfully',
                'deletedVideos': len(videos)
            })
            
        except APIError:
            raise
        except Exception as e:
            db.session.rollback()
            raise APIError(f"Failed to delete tutorial series: {str(e)}", 500)

    @staticmethod
    def get_tutorial_file_url(tutorial_id: int, file_type: str):
        """get file URL for tutorial files (videos, thumbnails, subtitles)"""
        try:
            # validate file type for user education
            if file_type not in ['video', 'thumbnail', 'subtitle']:
                raise create_validation_error('file_type', f"invalid file type: {file_type}. must be video, thumbnail, or subtitle")
            
            tutorial = db.session.scalar(
                select(Tutorial).where(Tutorial.id == tutorial_id)
                .where(Tutorial.status != 'deleted')
            )
            
            if not tutorial:
                raise APIError("tutorial not found", 404)
            
            file_path = None
            if file_type == 'video':
                file_path = tutorial.video_path
            elif file_type == 'thumbnail':
                file_path = tutorial.thumbnail_path
            elif file_type == 'subtitle':
                file_path = tutorial.subtitle_path
            
            if not file_path:
                raise create_file_access_error(f"tutorial {tutorial_id} {file_type}", f"{file_type} not available for this tutorial")
            
            # generate file URL for frontend access
            from ..utils.file_handler import FileHandler
            file_url = FileHandler.get_file_url(file_path)
            
            return ResponseService.success_response({
                'tutorialId': tutorial_id,
                'fileType': file_type,
                'filePath': file_path,
                'fileUrl': file_url
            })
            
        except (ValidationError, FileAccessError):
            raise
        except APIError:
            raise
        except Exception as e:
            current_app.logger.error(f"get tutorial file url error: {str(e)}")
            raise APIError("internal server error", 500)
