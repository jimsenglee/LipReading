"""
Quiz business logic service
Following README.txt separation of concerns
"""
import sqlalchemy as sa
from typing import Dict, Any

from ..extensions import db
from ..models import Quiz
from ..schemas.quiz_schemas import QuizCreateSchema, QuizUpdateSchema, QuizQuerySchema
from ..services.response_service import ResponseService
from ..services.error_service import APIError
from ..utils.id_generator import generate_public_id


class QuizService:
    """Quiz business logic service"""
    
    @staticmethod
    def get_quizzes(params: Dict[str, Any]):
        """Get paginated list of quizzes with filtering and sorting"""
        try:
            # Validate query parameters
            schema = QuizQuerySchema()
            validated_params = schema.load(params)
            
            # Build base query
            query = sa.select(Quiz)
            query = query.where(Quiz.status != 'deleted')
            
            # Apply filters
            if validated_params.get('search'):
                search_term = validated_params['search']
                query = query.where(Quiz.title.ilike(f'%{search_term}%'))
            
            if validated_params.get('category_id'):
                query = query.where(Quiz.category_id == validated_params['category_id'])
            
            if validated_params.get('status') and validated_params['status'] != 'all':
                query = query.where(Quiz.status == validated_params['status'])
            
            # Apply sorting
            sort_by = validated_params.get('sort_by', 'id')
            sort_order = validated_params.get('sort_order', 'asc')
            
            if sort_by == 'id':
                sort_column = Quiz.id
            elif sort_by == 'title':
                sort_column = Quiz.title
            else:
                sort_column = Quiz.id
            
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
            quizzes = db.session.scalars(query).all()
            
            # Format response
            quiz_list = []
            for q in quizzes:
                quiz_list.append({
                    'id': q.id,
                    'publicId': q.public_id,
                    'categoryId': q.category_id,
                    'title': q.title,
                    'status': q.status,
                })
            
            pagination = ResponseService.pagination_info(page, per_page, total)
            return ResponseService.success_response(quiz_list, pagination=pagination)
            
        except Exception as e:
            raise APIError(f"Failed to retrieve quizzes: {str(e)}", 500)
    
    @staticmethod
    def create_quiz(data: Dict[str, Any]):
        """Create new quiz"""
        try:
            # Validate input data
            schema = QuizCreateSchema()
            validated_data = schema.load(data)
            
            # Generate public ID
            public_id = generate_public_id(Quiz, "QUZ")
            
            # Create quiz
            quiz = Quiz(
                public_id=public_id,
                category_id=validated_data['category_id'],
                title=validated_data['title'],
                status=validated_data.get('status', 'active')
            )
            
            db.session.add(quiz)
            db.session.commit()
            
            return ResponseService.success_response({
                'id': quiz.id,
                'publicId': quiz.public_id,
                'message': 'Quiz created successfully'
            })
            
        except Exception as e:
            db.session.rollback()
            raise APIError(f"Failed to create quiz: {str(e)}", 500)
    
    @staticmethod
    def update_quiz(quiz_id: int, data: Dict[str, Any]):
        """Update existing quiz"""
        try:
            # Validate input data
            schema = QuizUpdateSchema()
            validated_data = schema.load(data)
            
            quiz = db.session.scalar(
                sa.select(Quiz).where(Quiz.id == quiz_id)
            )
            if not quiz:
                raise APIError("Quiz not found", 404)
            
            # Update fields
            for field, value in validated_data.items():
                if hasattr(quiz, field):
                    setattr(quiz, field, value)
            
            db.session.commit()
            
            return ResponseService.success_response({
                'id': quiz.id,
                'publicId': quiz.public_id,
                'message': 'Quiz updated successfully'
            })
            
        except APIError:
            raise
        except Exception as e:
            db.session.rollback()
            raise APIError(f"Failed to update quiz: {str(e)}", 500)
    
    @staticmethod
    def delete_quiz(quiz_id: int):
        """Soft delete quiz"""
        try:
            quiz = db.session.scalar(
                sa.select(Quiz).where(Quiz.id == quiz_id)
            )
            if not quiz:
                raise APIError("Quiz not found", 404)
            
            # Soft delete
            quiz.status = 'deleted'
            db.session.commit()
            
            return ResponseService.success_response({
                'message': 'Quiz deleted successfully'
            })
            
        except APIError:
            raise
        except Exception as e:
            db.session.rollback()
            raise APIError(f"Failed to delete quiz: {str(e)}", 500)
