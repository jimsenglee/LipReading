"""
Quiz business logic service
Following README.txt separation of concerns
"""
import sqlalchemy as sa
from sqlalchemy import select
from typing import Dict, Any
from flask import current_app

from ..extensions import db
from ..models import Quiz, QuizQuestion, QuizAttempt
from ..models.review import Review
from ..models.account import Account
from ..schemas.quiz_schemas import (
    QuizCreateSchema, QuizUpdateSchema, QuizQuerySchema,
    QuizQuestionSchema, QuizQuestionUpdateSchema, QuizSubmissionSchema
)
from ..services.response_service import ResponseService
from ..services.error_service import APIError
from ..utils.id_generator import generate_public_id


class QuizService:
    """Quiz business logic service"""
    
    @staticmethod
    def get_quizzes(params: Dict[str, Any]):
        """Get paginated list of quizzes with filtering and sorting"""
        try:
            # validate query parameters
            schema = QuizQuerySchema()
            try:
                validated_params = schema.load(params)
                if not isinstance(validated_params, dict):
                    validated_params = {}
            except Exception:
                validated_params = {}
            
            # Build base query - only show parent quiz series (like tutorials)
            # Filter out child quizzes (quizzes that belong to a series)
            query = sa.select(Quiz)
            query = query.where(Quiz.status != 'deleted')
            # Only show parent series quizzes (parent_series_id IS NULL) - same logic as tutorials
            query = query.where(Quiz.parent_series_id.is_(None))
            
            # Apply filters
            if validated_params.get('search'):
                search_term = validated_params['search']
                query = query.where(Quiz.title.ilike(f'%{search_term}%'))
            
            if validated_params.get('category_id'):
                query = query.where(Quiz.category_id == validated_params['category_id'])
            
            if validated_params.get('status') and validated_params['status'] != 'all':
                query = query.where(Quiz.status == validated_params['status'])
            
            if validated_params.get('difficulty'):
                query = query.where(Quiz.difficulty == validated_params['difficulty'])
            
            # Apply sorting
            sort_by = validated_params.get('sort_by', 'created_at')
            sort_order = validated_params.get('sort_order', 'desc')
            
            if sort_by == 'id':
                sort_column = Quiz.id
            elif sort_by == 'title':
                sort_column = Quiz.title
            elif sort_by == 'created_at':
                sort_column = Quiz.created_at
            elif sort_by == 'updated_at':
                sort_column = Quiz.updated_at
            elif sort_by == 'views':
                sort_column = Quiz.views
            elif sort_by == 'rating':
                sort_column = Quiz.created_at
            else:
                sort_column = Quiz.created_at
            
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
                    'description': q.description,
                    'status': q.status,
                    # phase 2: add missing fields for education module
                    'difficulty': q.difficulty,
                    'author': q.author,
                    'thumbnailPath': q.thumbnail_path,
                    'views': q.views,
                    'rating': float(db.session.scalar(sa.select(sa.func.coalesce(sa.func.avg(Review.rating), 0)).where(Review.target_type=='quiz', Review.target_id==q.id)) or 0.0),
                    'totalQuestions': q.total_questions,
                    'estimatedDuration': q.estimated_duration,
                    'tags': q.tags,
                    'passingScore': q.passing_score,
                    'maxAttempts': q.max_attempts,
                    'shuffleQuestions': q.shuffle_questions,
                    'shuffleAnswers': q.shuffle_answers,
                    'showResultsImmediately': q.show_results_immediately,
                    'createdAt': q.created_at.isoformat() if q.created_at else None,
                    'updatedAt': q.updated_at.isoformat() if q.updated_at else None,
                })
            
            pagination = ResponseService.pagination_info(page, per_page, total or 0)
            return ResponseService.success_response(quiz_list, pagination=pagination)
            
        except Exception as e:
            raise APIError(f"Failed to retrieve quizzes: {str(e)}", 500)
    
    @staticmethod
    def get_quiz(quiz_id: int):
        """Get single quiz by ID"""
        try:
            quiz = db.session.scalar(
                sa.select(Quiz).where(Quiz.id == quiz_id)
                .where(Quiz.status != 'deleted')
            )
            
            if not quiz:
                raise APIError("Quiz not found", 404)
            
            # Increment view count
            quiz.views += 1
            db.session.commit()
            
            return ResponseService.success_response({
                'id': quiz.id,
                'publicId': quiz.public_id,
                'categoryId': quiz.category_id,
                'title': quiz.title,
                'description': quiz.description,
                'status': quiz.status,
                'difficulty': quiz.difficulty,
                'author': quiz.author,
                'thumbnailPath': quiz.thumbnail_path,
                'views': quiz.views,
                'rating': float(db.session.scalar(sa.select(sa.func.coalesce(sa.func.avg(Review.rating), 0)).where(Review.target_type=='quiz', Review.target_id==quiz.id)) or 0.0),
                'totalQuestions': quiz.total_questions,
                'estimatedDuration': quiz.estimated_duration,
                'tags': quiz.tags,
                'passingScore': quiz.passing_score,
                'maxAttempts': quiz.max_attempts,
                'shuffleQuestions': quiz.shuffle_questions,
                'shuffleAnswers': quiz.shuffle_answers,
                'showResultsImmediately': quiz.show_results_immediately,
                'createdAt': quiz.created_at.isoformat() if quiz.created_at else None,
                'updatedAt': quiz.updated_at.isoformat() if quiz.updated_at else None,
            })
            
        except APIError:
            raise
        except Exception as e:
            raise APIError(f"Failed to retrieve quiz: {str(e)}", 500)
    
    @staticmethod
    def create_quiz(data: Dict[str, Any]):
        """Create new quiz"""
        try:
            # validate input data
            schema = QuizCreateSchema()
            try:
                validated_data = schema.load(data)
                if not isinstance(validated_data, dict):
                    validated_data = {}
            except Exception:
                validated_data = {}
            
            # Generate public ID
            public_id = generate_public_id(Quiz, "QUZ")
            
            # Create quiz
            quiz = Quiz()
            quiz.public_id = public_id
            quiz.category_id = validated_data['category_id']
            quiz.title = validated_data['title']
            quiz.description = validated_data.get('description', '')
            quiz.status = validated_data.get('status', 'active')
            quiz.difficulty = validated_data.get('difficulty', 'beginner')
            quiz.author = validated_data.get('author', 'System')
            quiz.thumbnail_path = validated_data.get('thumbnail_path')
            quiz.total_questions = validated_data.get('total_questions', 0)
            quiz.estimated_duration = validated_data.get('estimated_duration', 0)
            quiz.tags = str(validated_data.get('tags', []))
            quiz.passing_score = validated_data.get('passing_score', 70)
            quiz.max_attempts = validated_data.get('max_attempts', 3)
            quiz.shuffle_questions = validated_data.get('shuffle_questions', False)
            quiz.shuffle_answers = validated_data.get('shuffle_answers', False)
            quiz.show_results_immediately = validated_data.get('show_results_immediately', True)
            quiz.views = 0
            
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
            # validate input data
            schema = QuizUpdateSchema()
            try:
                validated_data = schema.load(data)
                if not isinstance(validated_data, dict):
                    validated_data = {}
            except Exception:
                validated_data = {}
            
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

    @staticmethod
    def get_quiz_file_url(quiz_id: int, file_type: str):
        """get file URL for quiz files (thumbnails)"""
        try:
            quiz = db.session.scalar(
                select(Quiz).where(Quiz.id == quiz_id)
                .where(Quiz.status != 'deleted')
            )
            
            if not quiz:
                raise APIError("quiz not found", 404)
            
            file_path = None
            if file_type == 'thumbnail':
                file_path = quiz.thumbnail_path
            else:
                raise APIError("invalid file type", 400)
            
            if not file_path:
                raise APIError(f"{file_type} not available", 404)
            
            # generate file URL for frontend access
            from ..utils.file_handler import FileHandler
            file_url = FileHandler.get_file_url(file_path)
            
            return ResponseService.success_response({
                'quizId': quiz_id,
                'fileType': file_type,
                'filePath': file_path,
                'fileUrl': file_url
            })
            
        except APIError:
            raise
        except Exception as e:
            current_app.logger.error(f"get quiz file url error: {str(e)}")
            raise APIError("internal server error", 500)
    
    @staticmethod
    def create_quiz_series(data: Dict[str, Any], user_name: str):
        """Create new quiz series with multiple quizzes"""
        try:
            # validate input data for series creation
            required_fields = ['title', 'description', 'category_id']
            for field in required_fields:
                if field not in data:
                    raise APIError(f"Missing required field: {field}", 400)
            
            # validate input data
            schema = QuizCreateSchema()
            try:
                validated_data = schema.load(data)
                if not isinstance(validated_data, dict):
                    validated_data = {}
            except Exception:
                validated_data = {}
            
            # generate public ID for series
            series_public_id = generate_public_id(Quiz, "QUZ")
            
            # create parent series quiz
            series_quiz = Quiz()
            series_quiz.public_id = series_public_id
            series_quiz.category_id = data['category_id']
            series_quiz.title = data['title']
            series_quiz.description = data.get('description', '')
            series_quiz.status = data.get('status', 'active')
            series_quiz.difficulty = data.get('difficulty', 'beginner')
            series_quiz.author = user_name
            series_quiz.thumbnail_path = data.get('thumbnail_path')
            series_quiz.series_type = 'series'
            series_quiz.total_questions = data.get('total_questions', 0)
            series_quiz.estimated_duration = data.get('estimated_duration', 0)
            series_quiz.tags = str(data.get('tags', []))
            series_quiz.views = 0
            # rating removed; reviews drive ratings
            
            db.session.add(series_quiz)
            db.session.flush()  # get the series ID
            
            # create individual quizzes if provided
            quizzes = data.get('quizzes', [])
            for i, quiz_data in enumerate(quizzes):
                quiz_public_id = generate_public_id(Quiz, "QUZ")
                
                quiz = Quiz()
                quiz.public_id = quiz_public_id
                quiz.category_id = data['category_id']
                quiz.title = quiz_data.get('title', f"{data['title']} - Quiz {i+1}")
                quiz.description = quiz_data.get('description', '')
                quiz.status = data.get('status', 'active')
                quiz.difficulty = data.get('difficulty', 'beginner')
                quiz.author = user_name
                quiz.thumbnail_path = quiz_data.get('thumbnail_path')
                quiz.series_type = 'single'
                quiz.parent_series_id = series_quiz.id
                quiz.quiz_order = i + 1
                quiz.quiz_title = quiz_data.get('title', f"Quiz {i+1}")
                quiz.quiz_description = quiz_data.get('description', '')
                quiz.total_questions = quiz_data.get('total_questions', 0)
                quiz.estimated_duration = quiz_data.get('estimated_duration', 0)
                quiz.tags = str(quiz_data.get('tags', []))
                quiz.views = 0
                
                db.session.add(quiz)
            
            db.session.commit()
            
            return ResponseService.success_response({
                'id': series_quiz.id,
                'publicId': series_quiz.public_id,
                'message': 'Quiz series created successfully',
                'quizCount': len(quizzes)
            })
            
        except APIError:
            raise
        except Exception as e:
            db.session.rollback()
            raise APIError(f"Failed to create quiz series: {str(e)}", 500)
    
    @staticmethod
    def get_quiz_series(params: Dict[str, Any]):
        """Get paginated list of quiz series"""
        try:
            # validate query parameters
            schema = QuizQuerySchema()
            try:
                validated_params = schema.load(params)
                if not isinstance(validated_params, dict):
                    validated_params = {}
            except Exception:
                validated_params = {}
            
            # build base query for series only
            query = sa.select(Quiz)
            query = query.where(Quiz.status != 'deleted')
            query = query.where(Quiz.series_type == 'series')
            
            # apply filters
            if validated_params.get('search'):
                search_term = validated_params['search']
                query = query.where(Quiz.title.ilike(f'%{search_term}%'))
            
            if validated_params.get('category_id'):
                query = query.where(Quiz.category_id == validated_params['category_id'])
            
            if validated_params.get('status') and validated_params['status'] != 'all':
                query = query.where(Quiz.status == validated_params['status'])
            
            if validated_params.get('difficulty'):
                query = query.where(Quiz.difficulty == validated_params['difficulty'])
            
            # apply sorting
            sort_by = validated_params.get('sort_by', 'created_at')
            sort_order = validated_params.get('sort_order', 'desc')
            
            if sort_by == 'id':
                sort_column = Quiz.id
            elif sort_by == 'title':
                sort_column = Quiz.title
            elif sort_by == 'created_at':
                sort_column = Quiz.created_at
            elif sort_by == 'updated_at':
                sort_column = Quiz.updated_at
            elif sort_by == 'views':
                sort_column = Quiz.views
            elif sort_by == 'rating':
                sort_column = Quiz.created_at
            else:
                sort_column = Quiz.created_at
            
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
            series = db.session.scalars(query).all()
            
            # format response
            series_list = []
            for s in series:
                # count quizzes in series
                quiz_count = db.session.scalar(
                    sa.select(sa.func.count()).select_from(Quiz)
                    .where(Quiz.parent_series_id == s.id)
                    .where(Quiz.status != 'deleted')
                )
                
                series_list.append({
                    'id': s.id,
                    'publicId': s.public_id,
                    'categoryId': s.category_id,
                    'title': s.title,
                    'description': s.description,
                    'status': s.status,
                    'difficulty': s.difficulty,
                    'author': s.author,
                    'thumbnailPath': s.thumbnail_path,
                    'views': s.views,
                    'rating': float(db.session.scalar(sa.select(sa.func.coalesce(sa.func.avg(Review.rating), 0)).where(Review.target_type=='quiz', Review.target_id==s.id)) or 0.0),
                    'quizCount': quiz_count,
                    'totalQuestions': s.total_questions,
                    'estimatedDuration': s.estimated_duration,
                    'tags': s.tags,
                    'createdAt': s.created_at.isoformat() if s.created_at else None,
                    'updatedAt': s.updated_at.isoformat() if s.updated_at else None,
                })
            
            pagination = ResponseService.pagination_info(page, per_page, total or 0)
            return ResponseService.success_response(series_list, pagination=pagination)
            
        except Exception as e:
            raise APIError(f"Failed to retrieve quiz series: {str(e)}", 500)
    
    @staticmethod
    def get_quiz_questions(quiz_id: int, params: Dict[str, Any]):
        """Get all questions for a specific quiz"""
        try:
            # validate query parameters
            schema = QuizQuerySchema()
            try:
                validated_params = schema.load(params)
                if not isinstance(validated_params, dict):
                    validated_params = {}
            except Exception:
                validated_params = {}
            
            # verify quiz exists
            quiz = db.session.scalar(
                sa.select(Quiz).where(Quiz.id == quiz_id)
                .where(Quiz.status != 'deleted')
            )
            if not quiz:
                raise APIError("Quiz not found", 404)
            
            # get questions for the quiz
            query = sa.select(QuizQuestion).where(QuizQuestion.quiz_id == quiz_id)
            
            # apply sorting
            sort_by = validated_params.get('sort_by', 'id')
            sort_order = validated_params.get('sort_order', 'asc')
            
            if sort_by == 'id':
                sort_column = QuizQuestion.id
            else:
                sort_column = QuizQuestion.id
            
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
            questions = db.session.scalars(query).all()
            
            # format response with polymorphic fields
            question_list = []
            for q in questions:
                # parse incorrect options (stored as JSON string) - only for video_mcq
                incorrect_options = []
                if q.question_type == 'video_mcq' and q.incorrect_options:
                    try:
                        import json
                        incorrect_options = json.loads(q.incorrect_options)
                    except:
                        incorrect_options = []
                
                question_data = {
                    'id': q.id,
                    'quizId': q.quiz_id,
                    'questionType': q.question_type,
                    'points': q.points,
                    'explanation': q.explanation,
                    'correctAnswer': q.correct_answer,
                }
                
                # add type-specific fields
                if q.question_type == 'video_mcq':
                    question_data['videoClipPath'] = q.video_clip_path
                    question_data['incorrectOptions'] = incorrect_options
                elif q.question_type == 'true_false':
                    question_data['questionText'] = q.question_text
                
                question_list.append(question_data)
            
            pagination = ResponseService.pagination_info(page, per_page, total or 0)
            return ResponseService.success_response(question_list, pagination=pagination)
            
        except APIError:
            raise
        except Exception as e:
            raise APIError(f"Failed to retrieve quiz questions: {str(e)}", 500)
    
    @staticmethod
    def create_quiz_question(quiz_id: int, data: Dict[str, Any]):
        """Create new question for a quiz with polymorphic support"""
        try:
            # validate input data using schema
            schema = QuizQuestionSchema()
            try:
                validated_data = schema.load(data)
                if not isinstance(validated_data, dict):
                    raise APIError("Invalid data format", 400)
            except Exception as e:
                raise APIError(f"Validation failed: {str(e)}", 400)
            
            # verify quiz exists
            quiz = db.session.scalar(
                sa.select(Quiz).where(Quiz.id == quiz_id)
                .where(Quiz.status != 'deleted')
            )
            if not quiz:
                raise APIError("Quiz not found", 404)
            
            # create question
            question = QuizQuestion()
            question.quiz_id = quiz_id
            question.question_type = validated_data['question_type']
            question.points = validated_data.get('points', 1)
            question.explanation = validated_data.get('explanation')
            question.correct_answer = validated_data['correct_answer']
            
            # handle type-specific fields
            if validated_data['question_type'] == 'video_mcq':
                question.video_clip_path = validated_data['video_clip_path']
                incorrect_options = validated_data.get('incorrect_options', [])
                import json
                if isinstance(incorrect_options, list):
                    question.incorrect_options = json.dumps(incorrect_options)
                else:
                    question.incorrect_options = str(incorrect_options)
            elif validated_data['question_type'] == 'true_false':
                question.question_text = validated_data['question_text']
                # video_clip_path and incorrect_options are None for true_false
            
            db.session.add(question)
            db.session.commit()
            
            # update quiz total questions count
            total_count = db.session.scalar(
                sa.select(sa.func.count()).select_from(QuizQuestion)
                .where(QuizQuestion.quiz_id == quiz_id)
            )
            quiz.total_questions = total_count or 0
            db.session.commit()
            
            return ResponseService.success_response({
                'id': question.id,
                'quizId': question.quiz_id,
                'message': 'Quiz question created successfully'
            })
            
        except APIError:
            raise
        except Exception as e:
            db.session.rollback()
            raise APIError(f"Failed to create quiz question: {str(e)}", 500)
    
    @staticmethod
    def update_quiz_question(quiz_id: int, question_id: int, data: Dict[str, Any]):
        """Update existing quiz question with polymorphic support"""
        try:
            # validate input data using schema
            schema = QuizQuestionUpdateSchema()
            try:
                validated_data = schema.load(data)
                if not isinstance(validated_data, dict):
                    validated_data = {}
            except Exception:
                validated_data = {}
            
            # verify quiz exists
            quiz = db.session.scalar(
                sa.select(Quiz).where(Quiz.id == quiz_id)
                .where(Quiz.status != 'deleted')
            )
            if not quiz:
                raise APIError("Quiz not found", 404)
            
            # get the question
            question = db.session.scalar(
                sa.select(QuizQuestion).where(QuizQuestion.id == question_id)
                .where(QuizQuestion.quiz_id == quiz_id)
            )
            if not question:
                raise APIError("Quiz question not found", 404)
            
            # update common fields
            if 'question_type' in validated_data:
                question.question_type = validated_data['question_type']
            if 'points' in validated_data:
                question.points = validated_data['points']
            if 'explanation' in validated_data:
                question.explanation = validated_data['explanation']
            if 'correct_answer' in validated_data:
                question.correct_answer = validated_data['correct_answer']
            
            # update type-specific fields
            updated_type = validated_data.get('question_type', question.question_type)
            
            if updated_type == 'video_mcq':
                if 'video_clip_path' in validated_data:
                    question.video_clip_path = validated_data['video_clip_path']
                if 'incorrect_options' in validated_data:
                    incorrect_options = validated_data['incorrect_options']
                    import json
                    if isinstance(incorrect_options, list):
                        question.incorrect_options = json.dumps(incorrect_options)
                    else:
                        question.incorrect_options = str(incorrect_options)
                # clear true_false fields if changing type
                if 'question_type' in validated_data:
                    question.question_text = None
            elif updated_type == 'true_false':
                if 'question_text' in validated_data:
                    question.question_text = validated_data['question_text']
                # clear video_mcq fields if changing type
                if 'question_type' in validated_data:
                    question.video_clip_path = None
                    question.incorrect_options = None
            
            db.session.commit()
            
            return ResponseService.success_response({
                'id': question.id,
                'quizId': question.quiz_id,
                'message': 'Quiz question updated successfully'
            })
            
        except APIError:
            raise
        except Exception as e:
            db.session.rollback()
            raise APIError(f"Failed to update quiz question: {str(e)}", 500)
    
    @staticmethod
    def delete_quiz_question(quiz_id: int, question_id: int):
        """Delete quiz question"""
        try:
            # verify quiz exists
            quiz = db.session.scalar(
                sa.select(Quiz).where(Quiz.id == quiz_id)
                .where(Quiz.status != 'deleted')
            )
            if not quiz:
                raise APIError("Quiz not found", 404)
            
            # get the question
            question = db.session.scalar(
                sa.select(QuizQuestion).where(QuizQuestion.id == question_id)
                .where(QuizQuestion.quiz_id == quiz_id)
            )
            if not question:
                raise APIError("Quiz question not found", 404)
            
            # delete the question
            db.session.delete(question)
            db.session.commit()
            
            # update quiz total questions count
            total_count = db.session.scalar(
                sa.select(sa.func.count()).select_from(QuizQuestion)
                .where(QuizQuestion.quiz_id == quiz_id)
            )
            quiz.total_questions = total_count or 0
            db.session.commit()
            
            return ResponseService.success_response({
                'message': 'Quiz question deleted successfully'
            })
            
        except APIError:
            raise
        except Exception as e:
            db.session.rollback()
            raise APIError(f"Failed to delete quiz question: {str(e)}", 500)
    
    @staticmethod
    def get_quiz_for_taking(quiz_id: int, user_id: int):
        """get quiz for user to take (apply shuffling, check attempt limits)"""
        try:
            import random
            import json
            
            # verify quiz exists and is active
            quiz = db.session.scalar(
                sa.select(Quiz).where(Quiz.id == quiz_id)
                .where(Quiz.status == 'active')
            )
            if not quiz:
                raise APIError("Quiz not found or not available", 404)
            
            # check attempt limits
            if quiz.max_attempts > 0:
                attempt_count = db.session.scalar(
                    sa.select(sa.func.count()).select_from(QuizAttempt)
                    .where(QuizAttempt.user_id == user_id)
                    .where(QuizAttempt.quiz_id == quiz_id)
                )
                if attempt_count and attempt_count >= quiz.max_attempts:
                    raise APIError(f"Maximum attempts ({quiz.max_attempts}) reached for this quiz", 403)
            
            # get all questions
            questions_query = sa.select(QuizQuestion).where(QuizQuestion.quiz_id == quiz_id)
            questions = list(db.session.scalars(questions_query).all())
            
            if not questions:
                raise APIError("Quiz has no questions", 400)
            
            # shuffle questions if enabled
            if quiz.shuffle_questions:
                random.shuffle(questions)
            
            # format questions with answers handling
            question_list = []
            for q in questions:
                question_data = {
                    'id': q.id,
                    'questionType': q.question_type,
                    'points': q.points,
                }
                
                if q.question_type == 'video_mcq':
                    # parse incorrect options
                    incorrect_options = []
                    if q.incorrect_options:
                        try:
                            incorrect_options = json.loads(q.incorrect_options)
                        except:
                            incorrect_options = []
                    
                    # combine correct and incorrect for shuffle
                    all_options = [q.correct_answer] + incorrect_options
                    
                    # shuffle answers if enabled
                    if quiz.shuffle_answers:
                        random.shuffle(all_options)
                    
                    question_data['videoClipPath'] = q.video_clip_path
                    question_data['options'] = all_options
                    # don't send correct answer to client
                elif q.question_type == 'true_false':
                    question_data['questionText'] = q.question_text
                    # for true_false, options are always ['True', 'False']
                    if quiz.shuffle_answers:
                        tf_options = ['True', 'False']
                        random.shuffle(tf_options)
                        question_data['options'] = tf_options
                    else:
                        question_data['options'] = ['True', 'False']
                    # don't send correct answer to client
                
                question_list.append(question_data)
            
            # return quiz data without correct answers
            return ResponseService.success_response({
                'id': quiz.id,
                'publicId': quiz.public_id,
                'title': quiz.title,
                'description': quiz.description,
                'totalQuestions': len(question_list),
                'passingScore': quiz.passing_score,
                'estimatedDuration': quiz.estimated_duration,
                'questions': question_list
            })
            
        except APIError:
            raise
        except Exception as e:
            raise APIError(f"Failed to get quiz for taking: {str(e)}", 500)
    
    @staticmethod
    def submit_quiz(quiz_id: int, user_id: int, data: Dict[str, Any]):
        """submit quiz answers and grade"""
        try:
            import json
            from datetime import datetime
            
            # validate submission data
            schema = QuizSubmissionSchema()
            try:
                validated_data = schema.load(data)
                if not isinstance(validated_data, dict):
                    raise APIError("Invalid data format", 400)
            except Exception as e:
                raise APIError(f"Validation failed: {str(e)}", 400)
            
            # verify quiz exists
            quiz = db.session.scalar(
                sa.select(Quiz).where(Quiz.id == quiz_id)
                .where(Quiz.status == 'active')
            )
            if not quiz:
                raise APIError("Quiz not found", 404)
            
            # get all questions with correct answers for grading
            questions_query = sa.select(QuizQuestion).where(QuizQuestion.quiz_id == quiz_id)
            questions = list(db.session.scalars(questions_query).all())
            
            if not questions:
                raise APIError("Quiz has no questions", 400)
            
            # create question lookup
            question_map = {q.id: q for q in questions}
            user_answers = validated_data.get('answers', {})
            
            # grade the quiz
            total_points = sum(q.points for q in questions)
            earned_points = 0
            question_results = []
            
            for q in questions:
                user_answer = user_answers.get(str(q.id), '').strip()
                correct_answer = q.correct_answer.strip()
                
                # case-insensitive comparison for true/false
                if q.question_type == 'true_false':
                    is_correct = user_answer.lower() == correct_answer.lower()
                else:
                    is_correct = user_answer == correct_answer
                
                if is_correct:
                    earned_points += q.points
                
                question_result = {
                    'questionId': q.id,
                    'questionType': q.question_type,
                    'userAnswer': user_answer,
                    'correctAnswer': correct_answer,
                    'isCorrect': is_correct,
                    'points': q.points,
                    'earnedPoints': q.points if is_correct else 0,
                    'explanation': q.explanation
                }
                
                # add type-specific fields
                if q.question_type == 'video_mcq':
                    question_result['videoClipPath'] = q.video_clip_path
                    # parse incorrect options for display
                    incorrect_options = []
                    if q.incorrect_options:
                        try:
                            incorrect_options = json.loads(q.incorrect_options)
                        except:
                            incorrect_options = []
                    question_result['allOptions'] = [q.correct_answer] + incorrect_options
                elif q.question_type == 'true_false':
                    question_result['questionText'] = q.question_text
                
                question_results.append(question_result)
            
            # calculate score percentage
            score = (earned_points / total_points * 100) if total_points > 0 else 0
            passed = score >= quiz.passing_score
            
            # determine attempt number
            attempt_count = db.session.scalar(
                sa.select(sa.func.count()).select_from(QuizAttempt)
                .where(QuizAttempt.user_id == user_id)
                .where(QuizAttempt.quiz_id == quiz_id)
            )
            attempt_number = (attempt_count or 0) + 1
            
            # check attempt limits before saving
            if quiz.max_attempts > 0 and attempt_number > quiz.max_attempts:
                raise APIError(f"Maximum attempts ({quiz.max_attempts}) exceeded", 403)
            
            # save quiz attempt
            attempt_public_id = generate_public_id(QuizAttempt, "QAT")
            attempt = QuizAttempt()
            attempt.public_id = attempt_public_id
            attempt.user_id = user_id
            attempt.quiz_id = quiz_id
            attempt.attempt_number = attempt_number
            attempt.score = score
            attempt.passed = passed
            attempt.answers_json = json.dumps(user_answers)
            attempt.completion_date = datetime.utcnow()
            
            db.session.add(attempt)
            db.session.commit()
            
            # return results
            result_data = {
                'attemptId': attempt.id,
                'publicId': attempt.public_id,
                'attemptNumber': attempt_number,
                'score': round(score, 2),
                'earnedPoints': earned_points,
                'totalPoints': total_points,
                'passed': passed,
                'passingScore': quiz.passing_score,
                'showResultsImmediately': quiz.show_results_immediately,
                'questions': question_results
            }
            
            return ResponseService.success_response(result_data)
            
        except APIError:
            raise
        except Exception as e:
            db.session.rollback()
            raise APIError(f"Failed to submit quiz: {str(e)}", 500)
