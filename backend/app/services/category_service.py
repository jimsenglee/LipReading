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
            # Validate query parameters
            schema = CategoryQuerySchema()
            validated_params = schema.load(params)
            
            # Build base query
            query = sa.select(Category)
            query = query.where(Category.status != 'deleted')
            
            # Apply filters
            if validated_params.get('search'):
                search_term = validated_params['search']
                query = query.where(Category.category_name.ilike(f'%{search_term}%'))
            
            if validated_params.get('status') and validated_params['status'] != 'all':
                query = query.where(Category.status == validated_params['status'])
            
            # Apply sorting
            sort_by = validated_params.get('sort_by', 'id')
            sort_order = validated_params.get('sort_order', 'asc')
            
            if sort_by == 'id':
                sort_column = Category.id
            elif sort_by == 'name':
                sort_column = Category.category_name
            else:
                sort_column = Category.id
            
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
                    'name': c.category_name,
                    'status': c.status,
                })
            
            pagination = ResponseService.pagination_info(page, per_page, total)
            return ResponseService.success_response(category_list, pagination=pagination)
            
        except Exception as e:
            raise APIError(f"Failed to retrieve categories: {str(e)}", 500)
    
    @staticmethod
    def create_category(data: Dict[str, Any]):
        """Create new category"""
        try:
            # Validate input data
            schema = CategoryCreateSchema()
            validated_data = schema.load(data)
            
            # Generate public ID
            public_id = generate_public_id(Category, "CAT")
            
            # Create category
            category = Category(
                public_id=public_id,
                category_name=validated_data['name'],
                status=validated_data.get('status', 'active')
            )
            
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
            # Validate input data
            schema = CategoryUpdateSchema()
            validated_data = schema.load(data)
            
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
