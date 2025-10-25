"""
Tutorial business logic service
Following README.txt separation of concerns
"""
import sqlalchemy as sa
from sqlalchemy.orm import joinedload
from typing import Dict, Any, List, Optional

from ..extensions import db
from ..models import Tutorial, Category
from ..schemas.tutorial_schemas import TutorialCreateSchema, TutorialUpdateSchema, TutorialQuerySchema
from ..services.response_service import ResponseService
from ..services.error_service import APIError
from ..utils.id_generator import generate_public_id


class TutorialService:
    """Tutorial business logic service"""
    
    @staticmethod
    def get_tutorials(params: Dict[str, Any]):
        """Get paginated list of tutorials with filtering and sorting"""
        try:
            # Validate query parameters
            schema = TutorialQuerySchema()
            validated_params = schema.load(params)
            
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
                    'status': t.status,
                    'difficulty': t.difficulty,
                    'author': t.author,
                    'thumbnailPath': t.thumbnail_path,
                    'views': t.views,
                    'rating': float(t.rating) if t.rating else 0.0,
                    'createdAt': t.created_at.isoformat() if t.created_at else None,
                    'updatedAt': t.updated_at.isoformat() if t.updated_at else None,
                })
            
            pagination = ResponseService.pagination_info(page, per_page, total)
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
                'rating': float(tutorial.rating) if tutorial.rating else 0.0,
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
            # Validate input data
            schema = TutorialCreateSchema()
            validated_data = schema.load(data)
            
            # Validate category exists
            category = db.session.scalar(
                sa.select(Category).where(Category.id == validated_data['category_id'])
            )
            if not category:
                raise APIError("Category not found", 400)
            
            # Generate public ID
            public_id = generate_public_id(Tutorial, "TUT")
            
            # Create tutorial
            tutorial = Tutorial(
                public_id=public_id,
                category_id=validated_data['category_id'],
                title=validated_data['title'],
                description=validated_data.get('description', ''),
                video_path=validated_data.get('video_path', ''),
                status=validated_data.get('status', 'draft'),
                difficulty=validated_data.get('difficulty', 'beginner'),
                author=user_name,
                thumbnail_path=validated_data.get('thumbnail_path'),
                views=0,
                rating=0.0
            )
            
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
            # Validate input data
            schema = TutorialUpdateSchema()
            validated_data = schema.load(data)
            
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
