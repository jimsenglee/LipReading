"""
Category business logic service
Following README.txt separation of concerns
"""
import sqlalchemy as sa
from typing import Dict, Any

from ..extensions import db
from ..models import Category
from ..schemas.category_schemas import CategoryCreateSchema, CategoryUpdateSchema, CategoryQuerySchema
from ..services.response_service import ResponseService
from ..services.error_service import APIError
from ..utils.id_generator import generate_public_id


class CategoryService:
    """Category business logic service"""
    
    @staticmethod
    def get_categories(params: Dict[str, Any]):
        """Get paginated list of categories with filtering and sorting"""
        try:
            # validate query parameters
            schema = CategoryQuerySchema()
            try:
                validated_params = schema.load(params)
                if not isinstance(validated_params, dict):
                    validated_params = {}
            except Exception:
                validated_params = {}
            
            # Build base query
            query = sa.select(Category)
            query = query.where(Category.status != 'deleted')
            
            # Apply filters
            if validated_params.get('search'):
                search_term = validated_params['search']
                query = query.where(Category.category_name.ilike(f'%{search_term}%'))
            
            if validated_params.get('status') and validated_params['status'] != 'all':
                query = query.where(Category.status == validated_params['status'])
            
            # apply sorting
            sort_by = validated_params.get('sort_by', 'created_at')
            sort_order = validated_params.get('sort_order', 'desc')
            
            if sort_by == 'id':
                sort_column = Category.id
            elif sort_by == 'name':
                sort_column = Category.category_name
            elif sort_by == 'created_at':
                sort_column = Category.created_at
            elif sort_by == 'updated_at':
                sort_column = Category.updated_at
            else:
                sort_column = Category.created_at
            
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
            categories = db.session.scalars(query).all()
            
            # Format response
            category_list = []
            for c in categories:
                category_list.append({
                    'id': c.id,
                    'publicId': c.public_id,
                    'category_name': c.category_name,
                    'status': c.status,
                })
            
            pagination = ResponseService.pagination_info(page, per_page, total or 0)
            return ResponseService.success_response(category_list, pagination=pagination)
            
        except Exception as e:
            raise APIError(f"Failed to retrieve categories: {str(e)}", 500)
    
    @staticmethod
    def get_category(category_id: int):
        """Get single category by ID"""
        try:
            category = db.session.scalar(
                sa.select(Category).where(Category.id == category_id)
                .where(Category.status != 'deleted')
            )
            
            if not category:
                raise APIError("Category not found", 404)
            
            return ResponseService.success_response({
                'id': category.id,
                'publicId': category.public_id,
                'category_name': category.category_name,
                'status': category.status,
                'createdAt': str(category.created_at) if category.created_at else None,
                'updatedAt': str(category.updated_at) if category.updated_at else None,
            })
            
        except APIError:
            raise
        except Exception as e:
            raise APIError(f"Failed to retrieve category: {str(e)}", 500)
    
    @staticmethod
    def create_category(data: Dict[str, Any]):
        """Create new category"""
        try:
            # validate input data
            schema = CategoryCreateSchema()
            try:
                validated_data = schema.load(data)
                if not isinstance(validated_data, dict):
                    validated_data = {}
            except Exception:
                validated_data = {}
            
            # Generate public ID
            public_id = generate_public_id(Category, "CAT")
            
            # create category
            category = Category()
            category.public_id = public_id
            category.category_name = validated_data['name']
            category.status = validated_data.get('status', 'active')
            
            db.session.add(category)
            db.session.commit()
            
            return ResponseService.success_response({
                'id': category.id,
                'publicId': category.public_id,
                'message': 'Category created successfully'
            })
            
        except Exception as e:
            db.session.rollback()
            raise APIError(f"Failed to create category: {str(e)}", 500)
    
    @staticmethod
    def update_category(category_id: int, data: Dict[str, Any]):
        """Update existing category"""
        try:
            # validate input data
            schema = CategoryUpdateSchema()
            try:
                validated_data = schema.load(data)
                if not isinstance(validated_data, dict):
                    validated_data = {}
            except Exception:
                validated_data = {}
            
            category = db.session.scalar(
                sa.select(Category).where(Category.id == category_id)
            )
            if not category:
                raise APIError("Category not found", 404)
            
            # Update fields
            for field, value in validated_data.items():
                if hasattr(category, field):
                    if field == 'name':
                        setattr(category, 'category_name', value)
                    else:
                        setattr(category, field, value)
            
            db.session.commit()
            
            return ResponseService.success_response({
                'id': category.id,
                'publicId': category.public_id,
                'message': 'Category updated successfully'
            })
            
        except APIError:
            raise
        except Exception as e:
            db.session.rollback()
            raise APIError(f"Failed to update category: {str(e)}", 500)
    
    @staticmethod
    def delete_category(category_id: int):
        """Soft delete category"""
        try:
            category = db.session.scalar(
                sa.select(Category).where(Category.id == category_id)
            )
            if not category:
                raise APIError("Category not found", 404)
            
            # Soft delete
            category.status = 'deleted'
            db.session.commit()
            
            return ResponseService.success_response({
                'message': 'Category deleted successfully'
            })
            
        except APIError:
            raise
        except Exception as e:
            db.session.rollback()
            raise APIError(f"Failed to delete category: {str(e)}", 500)

    @staticmethod
    def get_category_statistics(category_id: int | None = None):
        """get category usage statistics for user education"""
        try:
            from ..models.tutorial import Tutorial
            from ..models.quiz import Quiz
            
            if category_id:
                # get statistics for specific category
                tutorial_count = db.session.scalar(
                    sa.select(sa.func.count(Tutorial.id))
                    .where(Tutorial.category_id == category_id)
                    .where(Tutorial.status != 'deleted')
                )
                
                quiz_count = db.session.scalar(
                    sa.select(sa.func.count(Quiz.id))
                    .where(Quiz.category_id == category_id)
                    .where(Quiz.status != 'deleted')
                )
                
                total_views = db.session.scalar(
                    sa.select(sa.func.sum(Tutorial.views))
                    .where(Tutorial.category_id == category_id)
                    .where(Tutorial.status != 'deleted')
                ) or 0
                
                avg_rating = db.session.scalar(
                    sa.select(sa.func.avg(Tutorial.rating))
                    .where(Tutorial.category_id == category_id)
                    .where(Tutorial.status != 'deleted')
                ) or 0.0
                
                return ResponseService.success_response({
                    'categoryId': category_id,
                    'tutorialCount': tutorial_count or 0,
                    'quizCount': quiz_count or 0,
                    'totalViews': total_views,
                    'averageRating': round(float(avg_rating), 2)
                })
            else:
                # get statistics for all categories
                categories = db.session.scalars(
                    sa.select(Category).where(Category.status != 'deleted')
                ).all()
                
                stats = []
                for category in categories:
                    tutorial_count = db.session.scalar(
                        sa.select(sa.func.count(Tutorial.id))
                        .where(Tutorial.category_id == category.id)
                        .where(Tutorial.status != 'deleted')
                    )
                    
                    quiz_count = db.session.scalar(
                        sa.select(sa.func.count(Quiz.id))
                        .where(Quiz.category_id == category.id)
                        .where(Quiz.status != 'deleted')
                    )
                    
                    stats.append({
                        'categoryId': category.id,
                        'categoryName': category.category_name,
                        'tutorialCount': tutorial_count or 0,
                        'quizCount': quiz_count or 0
                    })
                
                return ResponseService.success_response(stats)
                
        except Exception as e:
            raise APIError(f"Failed to get category statistics: {str(e)}", 500)

    @staticmethod
    def validate_category_usage(category_id: int):
        """validate category usage before deletion"""
        try:
            from ..models.tutorial import Tutorial
            from ..models.quiz import Quiz
            
            # check if category has tutorials
            tutorial_count = db.session.scalar(
                sa.select(sa.func.count(Tutorial.id))
                .where(Tutorial.category_id == category_id)
                .where(Tutorial.status != 'deleted')
            )
            
            # check if category has quizzes
            quiz_count = db.session.scalar(
                sa.select(sa.func.count(Quiz.id))
                .where(Quiz.category_id == category_id)
                .where(Quiz.status != 'deleted')
            )
            
            total_content = (tutorial_count or 0) + (quiz_count or 0)
            
            return ResponseService.success_response({
                'categoryId': category_id,
                'hasContent': total_content > 0,
                'tutorialCount': tutorial_count or 0,
                'quizCount': quiz_count or 0,
                'totalContent': total_content,
                'canDelete': total_content == 0
            })
            
        except Exception as e:
            raise APIError(f"Failed to validate category usage: {str(e)}", 500)

    @staticmethod
    def search_categories(params: Dict[str, Any]):
        """search categories with advanced filtering for user education"""
        try:
            # validate query parameters
            schema = CategoryQuerySchema()
            try:
                validated_params = schema.load(params)
                if not isinstance(validated_params, dict):
                    validated_params = {}
            except Exception:
                validated_params = {}
            
            # build base query
            query = sa.select(Category)
            query = query.where(Category.status != 'deleted')
            
            # apply search filter
            if validated_params.get('search'):
                search_term = validated_params['search']
                query = query.where(Category.category_name.ilike(f'%{search_term}%'))
            
            # apply status filter
            if validated_params.get('status') and validated_params['status'] != 'all':
                query = query.where(Category.status == validated_params['status'])
            
            # apply with_content filter
            if validated_params.get('with_content'):
                from ..models.tutorial import Tutorial
                from ..models.quiz import Quiz
                
                # only categories that have tutorials or quizzes
                query = query.where(
                    sa.or_(
                        sa.exists().where(Tutorial.category_id == Category.id),
                        sa.exists().where(Quiz.category_id == Category.id)
                    )
                )
            
            # apply sorting
            sort_by = validated_params.get('sort_by', 'name')
            sort_order = validated_params.get('sort_order', 'asc')
            
            if sort_by == 'id':
                sort_column = Category.id
            elif sort_by == 'name':
                sort_column = Category.category_name
            elif sort_by == 'created_at':
                sort_column = Category.created_at
            elif sort_by == 'sort_order':
                sort_column = Category.sort_order if hasattr(Category, 'sort_order') else Category.id
            elif sort_by == 'tutorial_count':
                from ..models.tutorial import Tutorial
                sort_column = sa.func.count(Tutorial.id)
                query = query.outerjoin(Tutorial, Category.id == Tutorial.category_id)
                query = query.group_by(Category.id)
            elif sort_by == 'quiz_count':
                from ..models.quiz import Quiz
                sort_column = sa.func.count(Quiz.id)
                query = query.outerjoin(Quiz, Category.id == Quiz.category_id)
                query = query.group_by(Category.id)
            else:
                sort_column = Category.category_name
            
            if sort_order.lower() == 'desc':
                query = query.order_by(sa.desc(sort_column))
            else:
                query = query.order_by(sa.asc(sort_column))
            
            # get total count
            count_query = sa.select(sa.func.count()).select_from(query.subquery())
            total = db.session.scalar(count_query)
            
            # apply pagination
            page = validated_params.get('page', 1)
            per_page = validated_params.get('per_page', 10)
            offset = (page - 1) * per_page
            query = query.offset(offset).limit(per_page)
            
            # execute query
            categories = db.session.scalars(query).all()
            
            # format response
            category_list = []
            for category in categories:
                category_data = {
                    'id': category.id,
                    'publicId': category.public_id,
                    'category_name': category.category_name,
                    'status': category.status,
                    'createdAt': str(category.created_at) if category.created_at else None,
                    'updatedAt': str(category.updated_at) if category.updated_at else None,
                }
                
                # include statistics if requested
                if validated_params.get('include_stats'):
                    from ..models.tutorial import Tutorial
                    from ..models.quiz import Quiz
                    
                    tutorial_count = db.session.scalar(
                        sa.select(sa.func.count(Tutorial.id))
                        .where(Tutorial.category_id == category.id)
                        .where(Tutorial.status != 'deleted')
                    )
                    
                    quiz_count = db.session.scalar(
                        sa.select(sa.func.count(Quiz.id))
                        .where(Quiz.category_id == category.id)
                        .where(Quiz.status != 'deleted')
                    )
                    
                    category_data['tutorialCount'] = tutorial_count or 0
                    category_data['quizCount'] = quiz_count or 0
                
                category_list.append(category_data)
            
            pagination = ResponseService.pagination_info(page, per_page, total or 0)
            return ResponseService.success_response(category_list, pagination=pagination)
            
        except Exception as e:
            raise APIError(f"Failed to search categories: {str(e)}", 500)
