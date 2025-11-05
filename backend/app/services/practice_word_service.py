"""
Practice Word business logic service
Following README.txt separation of concerns
"""
import sqlalchemy as sa
from typing import Dict, Any
from flask import current_app

from ..extensions import db
from ..models.practice_word import PracticeWord
from ..models import Category
from ..schemas.practice_word_schemas import (
    PracticeWordCreateSchema, PracticeWordUpdateSchema, PracticeWordQuerySchema
)
from ..services.response_service import ResponseService
from ..services.error_service import APIError
from ..utils.id_generator import generate_public_id


class PracticeWordService:
    """Practice Word business logic service"""
    
    @staticmethod
    def get_practice_words(params: Dict[str, Any]):
        """Get paginated list of practice words with filtering and sorting"""
        try:
            # validate query parameters
            schema = PracticeWordQuerySchema()
            try:
                validated_params = schema.load(params)
                if not isinstance(validated_params, dict):
                    validated_params = {}
            except Exception:
                validated_params = {}
            
            # build base query with join to category
            query = sa.select(PracticeWord, Category)
            query = query.join(Category, PracticeWord.category_id == Category.id)
            query = query.where(PracticeWord.status != 'deleted')
            query = query.where(Category.status != 'deleted')
            
            # apply filters
            if validated_params.get('search'):
                search_term = validated_params['search']
                query = query.where(PracticeWord.word.ilike(f'%{search_term}%'))
            
            if validated_params.get('category'):
                query = query.where(PracticeWord.category_id == validated_params['category'])
            
            if validated_params.get('difficulty') and validated_params['difficulty'] != 'all':
                query = query.where(PracticeWord.difficulty == validated_params['difficulty'])
            
            if validated_params.get('status') and validated_params['status'] != 'all':
                query = query.where(PracticeWord.status == validated_params['status'])
            
            # apply sorting
            sort_by = validated_params.get('sort_by', 'sort_order')
            sort_order = validated_params.get('sort_order', 'asc')
            
            if sort_by == 'id':
                sort_column = PracticeWord.id
            elif sort_by == 'word':
                sort_column = PracticeWord.word
            elif sort_by == 'difficulty':
                sort_column = PracticeWord.difficulty
            elif sort_by == 'sort_order':
                sort_column = PracticeWord.sort_order
            elif sort_by == 'created_at':
                sort_column = PracticeWord.created_at
            else:
                sort_column = PracticeWord.sort_order
            
            if sort_order.lower() == 'desc':
                query = query.order_by(sa.desc(sort_column))
            else:
                query = query.order_by(sa.asc(sort_column))
            
            # get total count
            count_query = sa.select(sa.func.count()).select_from(query.subquery())
            total = db.session.scalar(count_query) or 0
            
            # apply pagination
            page = int(validated_params.get('page', 1))
            per_page = int(validated_params.get('per_page', 10))
            offset = (page - 1) * per_page
            query = query.offset(offset).limit(per_page)
            
            # execute query
            results = db.session.execute(query).all()
            
            # format response
            word_list = []
            for row in results:
                word = row[0]
                category = row[1]
                word_list.append({
                    'id': word.id,
                    'publicId': word.public_id,
                    'word': word.word,
                    'category': category.category_name,
                    'categoryId': category.id,
                    'phonetics': word.phonetics,
                    'description': word.description,
                    'videoPath': word.video_path,
                    'difficulty': word.difficulty,
                    'status': word.status,
                    'sortOrder': word.sort_order,
                    'createdAt': word.created_at.isoformat() if word.created_at else None,
                    'updatedAt': word.updated_at.isoformat() if word.updated_at else None,
                })
            
            pagination = ResponseService.pagination_info(page, per_page, total)
            return ResponseService.success_response(word_list, pagination=pagination)
            
        except Exception as e:
            current_app.logger.error(f"Get practice words error: {str(e)}")
            import traceback
            traceback.print_exc()
            raise APIError(f"Failed to retrieve practice words: {str(e)}", 500)
    
    @staticmethod
    def get_practice_word(word_id: int):
        """Get single practice word by ID"""
        try:
            result = db.session.execute(
                sa.select(PracticeWord, Category)
                .join(Category, PracticeWord.category_id == Category.id)
                .where(PracticeWord.id == word_id)
                .where(PracticeWord.status != 'deleted')
            ).first()
            
            if not result:
                raise APIError("Practice word not found", 404)
            
            word = result[0]
            category = result[1]
            
            return ResponseService.success_response({
                'id': word.id,
                'publicId': word.public_id,
                'word': word.word,
                'category': category.category_name,
                'categoryId': category.id,
                'phonetics': word.phonetics,
                'description': word.description,
                'videoPath': word.video_path,
                'difficulty': word.difficulty,
                'status': word.status,
                'sortOrder': word.sort_order,
                'createdAt': word.created_at.isoformat() if word.created_at else None,
                'updatedAt': word.updated_at.isoformat() if word.updated_at else None,
            })
            
        except APIError:
            raise
        except Exception as e:
            current_app.logger.error(f"Get practice word error: {str(e)}")
            import traceback
            traceback.print_exc()
            raise APIError(f"Failed to retrieve practice word: {str(e)}", 500)
    
    @staticmethod
    def create_practice_word(data: Dict[str, Any]):
        """Create new practice word"""
        try:
            # validate input data
            schema = PracticeWordCreateSchema()
            try:
                validated_data = schema.load(data)
                if not isinstance(validated_data, dict):
                    validated_data = {}
            except Exception:
                validated_data = {}
            
            # validate category exists
            category = db.session.scalar(
                sa.select(Category).where(Category.id == validated_data['category_id'])
            )
            if not category:
                raise APIError("Category not found", 404)
            
            # generate public ID
            public_id = generate_public_id(PracticeWord, "PW")
            
            # create practice word
            practice_word = PracticeWord()
            practice_word.public_id = public_id
            practice_word.word = validated_data['word']
            practice_word.category_id = validated_data['category_id']
            practice_word.phonetics = validated_data.get('phonetics')
            practice_word.description = validated_data.get('description')
            practice_word.video_path = validated_data['video_path']
            practice_word.difficulty = validated_data.get('difficulty', 'beginner')
            practice_word.status = validated_data.get('status', 'active')
            practice_word.sort_order = validated_data.get('sort_order', 0)
            
            db.session.add(practice_word)
            db.session.commit()
            
            return ResponseService.success_response({
                'id': practice_word.id,
                'publicId': practice_word.public_id,
                'message': 'Practice word created successfully'
            })
            
        except APIError:
            raise
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Create practice word error: {str(e)}")
            import traceback
            traceback.print_exc()
            raise APIError(f"Failed to create practice word: {str(e)}", 500)
    
    @staticmethod
    def update_practice_word(word_id: int, data: Dict[str, Any]):
        """Update existing practice word"""
        try:
            # validate input data
            schema = PracticeWordUpdateSchema()
            try:
                validated_data = schema.load(data)
                if not isinstance(validated_data, dict):
                    validated_data = {}
            except Exception:
                validated_data = {}
            
            # find practice word
            practice_word = db.session.scalar(
                sa.select(PracticeWord).where(PracticeWord.id == word_id)
            )
            if not practice_word:
                raise APIError("Practice word not found", 404)
            
            # validate category if changing
            if 'category_id' in validated_data:
                category = db.session.scalar(
                    sa.select(Category).where(Category.id == validated_data['category_id'])
                )
                if not category:
                    raise APIError("Category not found", 404)
            
            # update fields
            for field, value in validated_data.items():
                if hasattr(practice_word, field):
                    setattr(practice_word, field, value)
            
            db.session.commit()
            
            return ResponseService.success_response({
                'id': practice_word.id,
                'publicId': practice_word.public_id,
                'message': 'Practice word updated successfully'
            })
            
        except APIError:
            raise
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Update practice word error: {str(e)}")
            import traceback
            traceback.print_exc()
            raise APIError(f"Failed to update practice word: {str(e)}", 500)
    
    @staticmethod
    def delete_practice_word(word_id: int):
        """Soft delete practice word"""
        try:
            practice_word = db.session.scalar(
                sa.select(PracticeWord).where(PracticeWord.id == word_id)
            )
            if not practice_word:
                raise APIError("Practice word not found", 404)
            
            # soft delete
            practice_word.status = 'deleted'
            db.session.commit()
            
            return ResponseService.success_response({
                'message': 'Practice word deleted successfully'
            })
            
        except APIError:
            raise
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Delete practice word error: {str(e)}")
            import traceback
            traceback.print_exc()
            raise APIError(f"Failed to delete practice word: {str(e)}", 500)

