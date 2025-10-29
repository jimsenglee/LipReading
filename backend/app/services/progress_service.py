"""
progress tracking service for managing user progress across tutorials and quizzes
Following README.txt separation of concerns
"""
from flask import current_app
from sqlalchemy import select, insert, update, delete, func, and_, or_
from typing import Dict, Any, List
from datetime import datetime
from ..extensions import db
from ..models.user_bookmark import user_bookmarks
from ..models.tutorial import Tutorial
from ..models.quiz import Quiz
from ..models.quiz_attempt import QuizAttempt
from ..models.account import Account
from ..models.category import Category
from ..schemas.progress_schemas import ProgressUpdateSchema, QuizAttemptSchema, ProgressQuerySchema
from .error_service import APIError
from .response_service import ResponseService
from ..utils.id_generator import generate_public_id


class ProgressService:
    """service for managing user progress tracking across tutorials and quizzes"""

    @staticmethod
    def enroll_in_series(user_id: int, series_id: int):
        """enroll user in a tutorial series"""
        try:
            # check if series exists
            series = db.session.scalar(
                select(Tutorial).where(Tutorial.id == series_id)
                .where(Tutorial.status != 'deleted')
                .where(Tutorial.series_type == 'series')
            )
            if not series:
                raise APIError("series not found", 404)
            
            # check if already enrolled
            existing_bookmark = db.session.scalar(
                select(user_bookmarks).where(
                    user_bookmarks.c.user_id == user_id,
                    user_bookmarks.c.tutorial_id == series_id
                )
            )
            
            if existing_bookmark:
                raise APIError("already enrolled in this series", 409)
            
            # create enrollment
            db.session.execute(
                insert(user_bookmarks).values(
                    user_id=user_id,
                    tutorial_id=series_id,
                    progress_percentage=0,
                    last_watched_position=0,
                    total_watch_time=0,
                    is_completed=False,
                    completed_at=None,
                    enrolled_at=datetime.utcnow(),
                    last_accessed_at=datetime.utcnow()
                )
            )
            db.session.commit()
            
            return ResponseService.success_response({
                "message": "successfully enrolled in the series",
                "seriesId": series_id,
                "seriesTitle": series.title
            })
            
        except APIError:
            raise
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"enrollment error: {str(e)}")
            raise APIError("internal server error", 500)

    @staticmethod
    def unenroll_from_series(user_id: int, series_id: int):
        """unenroll user from a tutorial series"""
        try:
            # find enrollment
            bookmark = db.session.scalar(
                select(user_bookmarks).where(
                    user_bookmarks.c.user_id == user_id,
                    user_bookmarks.c.tutorial_id == series_id
                )
            )
            
            if not bookmark:
                raise APIError("not enrolled in this series", 404)
            
            # remove enrollment
            db.session.execute(
                delete(user_bookmarks).where(
                    user_bookmarks.c.user_id == user_id,
                    user_bookmarks.c.tutorial_id == series_id
                )
            )
            db.session.commit()
            
            return ResponseService.success_response({
                "message": "successfully unenrolled from the series",
                "seriesId": series_id
            })
            
        except APIError:
            raise
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"unenrollment error: {str(e)}")
            raise APIError("internal server error", 500)

    @staticmethod
    def get_series_progress(user_id: int, series_id: int):
        """get user's progress for a specific series"""
        try:
            # check if enrolled
            bookmark = db.session.scalar(
                select(user_bookmarks).where(
                    user_bookmarks.c.user_id == user_id,
                    user_bookmarks.c.tutorial_id == series_id
                )
            )
            
            if not bookmark:
                raise APIError("not enrolled in this series", 404)
            
            # get series info
            series = db.session.scalar(
                select(Tutorial).where(Tutorial.id == series_id)
            )
            
            # get all videos in the series
            videos = db.session.scalars(
                select(Tutorial).where(Tutorial.parent_series_id == series_id)
                .where(Tutorial.status != 'deleted')
                .order_by(Tutorial.video_order)
            ).all()
            
            # get video progress (for now, using basic progress from bookmark)
            # in a real implementation, you'd have individual video progress tracking
            completed_videos = []
            total_watch_time = bookmark.total_watch_time or 0
            
            # calculate progress based on videos watched
            if videos:
                videos_watched = min(len(videos), int(bookmark.progress_percentage / 100 * len(videos)))
                for i in range(videos_watched):
                    completed_videos.append({
                        'id': videos[i].id,
                        'title': videos[i].video_title or videos[i].title,
                        'order': videos[i].video_order,
                        'duration': videos[i].video_duration or 0
                    })
            
            progress = {
                'seriesId': series_id,
                'seriesTitle': series.title if series else None,
                'status': 'completed' if bookmark.is_completed else 'in-progress',
                'progressPercentage': bookmark.progress_percentage or 0,
                'enrolledAt': bookmark.enrolled_at.isoformat() if bookmark.enrolled_at else None,
                'completedAt': bookmark.completed_at.isoformat() if bookmark.completed_at else None,
                'lastAccessedAt': bookmark.last_accessed_at.isoformat() if bookmark.last_accessed_at else None,
                'completedVideos': completed_videos,
                'totalVideos': len(videos),
                'totalWatchTime': total_watch_time,
                'lastWatchedPosition': bookmark.last_watched_position or 0,
                'isCompleted': bookmark.is_completed or False
            }
            
            return ResponseService.success_response(progress)
            
        except APIError:
            raise
        except Exception as e:
            current_app.logger.error(f"progress retrieval error: {str(e)}")
            raise APIError("internal server error", 500)

    @staticmethod
    def update_video_progress(user_id: int, tutorial_id: int, progress_data: Dict[str, Any]):
        """update user's progress for a specific video/tutorial"""
        try:
            # validate input data
            schema = ProgressUpdateSchema()
            try:
                validated_data = schema.load(progress_data)
                if not isinstance(validated_data, dict):
                    validated_data = {}
            except Exception:
                validated_data = {}
            
            # check if tutorial exists
            tutorial = db.session.scalar(
                select(Tutorial).where(Tutorial.id == tutorial_id)
                .where(Tutorial.status != 'deleted')
            )
            if not tutorial:
                raise APIError("tutorial not found", 404)
            
            # check if enrolled/bookmarked
            bookmark = db.session.scalar(
                select(user_bookmarks).where(
                    user_bookmarks.c.user_id == user_id,
                    user_bookmarks.c.tutorial_id == tutorial_id
                )
            )
            
            if not bookmark:
                raise APIError("tutorial not bookmarked", 404)
            
            # update progress data
            update_data = {
                'last_accessed_at': datetime.utcnow()
            }
            
            if 'progress_percentage' in validated_data:
                update_data['progress_percentage'] = validated_data['progress_percentage']
            
            if 'last_watched_position' in validated_data:
                update_data['last_watched_position'] = validated_data['last_watched_position']
            
            if 'total_watch_time' in validated_data:
                update_data['total_watch_time'] = validated_data['total_watch_time']
            
            if 'is_completed' in validated_data:
                update_data['is_completed'] = validated_data['is_completed']
                if validated_data['is_completed']:
                    update_data['completed_at'] = datetime.utcnow()
            
            db.session.execute(
                update(user_bookmarks).where(
                    user_bookmarks.c.user_id == user_id,
                    user_bookmarks.c.tutorial_id == tutorial_id
                ).values(**update_data)
            )
            db.session.commit()
            
            return ResponseService.success_response({
                "message": "progress updated successfully",
                "tutorialId": tutorial_id,
                "progressPercentage": update_data.get('progress_percentage', bookmark.progress_percentage)
            })
            
        except APIError:
            raise
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"update progress error: {str(e)}")
            raise APIError("internal server error", 500)

    @staticmethod
    def get_user_progress(user_id: int, params: Dict[str, Any] | None = None):
        """get all user's progress across all series with filtering"""
        try:
            # validate query parameters
            if params:
                schema = ProgressQuerySchema()
                try:
                    validated_params = schema.load(params)
                    if not isinstance(validated_params, dict):
                        validated_params = {}
                except Exception:
                    validated_params = {}
            else:
                validated_params = {}
            
            # build base query
            progress_query = select(Tutorial, user_bookmarks, Category).join(
                user_bookmarks, Tutorial.id == user_bookmarks.c.tutorial_id
            ).join(
                Category, Tutorial.category_id == Category.id
            ).where(user_bookmarks.c.user_id == user_id)
            
            # apply filters
            if validated_params.get('status') and validated_params['status'] != 'all':
                if validated_params['status'] == 'completed':
                    progress_query = progress_query.where(user_bookmarks.c.is_completed == True)
                elif validated_params['status'] == 'in-progress':
                    progress_query = progress_query.where(user_bookmarks.c.is_completed == False)
            
            if validated_params.get('category_id'):
                progress_query = progress_query.where(Tutorial.category_id == validated_params['category_id'])
            
            if validated_params.get('difficulty'):
                progress_query = progress_query.where(Tutorial.difficulty == validated_params['difficulty'])
            
            # apply sorting
            sort_by = validated_params.get('sort_by', 'enrolled_at')
            sort_order = validated_params.get('sort_order', 'desc')
            
            if sort_by == 'title':
                sort_column = Tutorial.title
            elif sort_by == 'progress_percentage':
                sort_column = user_bookmarks.c.progress_percentage
            elif sort_by == 'last_accessed':
                sort_column = user_bookmarks.c.last_accessed_at
            elif sort_by == 'completed_at':
                sort_column = user_bookmarks.c.completed_at
            else:
                sort_column = user_bookmarks.c.enrolled_at
            
            if sort_order.lower() == 'desc':
                progress_query = progress_query.order_by(sort_column.desc())
            else:
                progress_query = progress_query.order_by(sort_column.asc())
            
            # get total count
            count_query = select(func.count()).select_from(progress_query.subquery())
            total = db.session.scalar(count_query)
            
            # apply pagination
            page = validated_params.get('page', 1)
            per_page = validated_params.get('per_page', 10)
            offset = (page - 1) * per_page
            progress_query = progress_query.offset(offset).limit(per_page)
            
            # execute query
            results = db.session.execute(progress_query).all()
            
            progress_list = []
            for tutorial, bookmark, category in results:
                progress_list.append({
                    'id': tutorial.id,
                    'publicId': tutorial.public_id,
                    'categoryId': tutorial.category_id,
                    'categoryName': category.category_name if category else None,
                    'title': tutorial.title,
                    'description': tutorial.description,
                    'videoPath': tutorial.video_path,
                    'subtitlePath': tutorial.subtitle_path,
                    'status': tutorial.status,
                    'difficulty': tutorial.difficulty,
                    'author': tutorial.author,
                    'thumbnailPath': tutorial.thumbnail_path,
                    'views': tutorial.views,
                    'rating': float(tutorial.rating) if tutorial.rating else 0.0,
                    'createdAt': tutorial.created_at.isoformat() if tutorial.created_at else None,
                    'updatedAt': tutorial.updated_at.isoformat() if tutorial.updated_at else None,
                    'videoDuration': tutorial.video_duration,
                    'tags': tutorial.tags,
                    # progress tracking data
                    'progressPercentage': bookmark.progress_percentage,
                    'lastWatchedPosition': bookmark.last_watched_position,
                    'totalWatchTime': bookmark.total_watch_time,
                    'isCompleted': bookmark.is_completed,
                    'completedAt': bookmark.completed_at.isoformat() if bookmark.completed_at else None,
                    'enrolledAt': bookmark.enrolled_at.isoformat() if bookmark.enrolled_at else None,
                    'lastAccessedAt': bookmark.last_accessed_at.isoformat() if bookmark.last_accessed_at else None,
                })
            
            pagination = ResponseService.pagination_info(page, per_page, total or 0)
            return ResponseService.success_response(progress_list, pagination=pagination)
            
        except Exception as e:
            current_app.logger.error(f"get user progress error: {str(e)}")
            raise APIError("internal server error", 500)

    @staticmethod
    def submit_quiz_attempt(user_id: int, quiz_id: int, attempt_data: Dict[str, Any]):
        """submit a quiz attempt"""
        try:
            # validate input data
            schema = QuizAttemptSchema()
            try:
                validated_data = schema.load(attempt_data)
                if not isinstance(validated_data, dict):
                    validated_data = {}
            except Exception:
                validated_data = {}
            
            # check if quiz exists
            quiz = db.session.scalar(
                select(Quiz).where(Quiz.id == quiz_id)
                .where(Quiz.status != 'deleted')
            )
            if not quiz:
                raise APIError("quiz not found", 404)
            
            # generate public ID for attempt
            attempt_public_id = generate_public_id(QuizAttempt, "QAT")
            
            # create quiz attempt
            attempt = QuizAttempt()
            attempt.public_id = attempt_public_id
            attempt.user_id = user_id
            attempt.quiz_id = quiz_id
            attempt.score = validated_data.get('score', 0.0)
            attempt.answers_json = str(validated_data.get('answers', []))
            attempt.completion_date = datetime.utcnow()
            
            db.session.add(attempt)
            db.session.commit()
            
            return ResponseService.success_response({
                'id': attempt.id,
                'publicId': attempt.public_id,
                'quizId': quiz_id,
                'score': attempt.score,
                'completionDate': attempt.completion_date.isoformat(),
                'message': 'quiz attempt submitted successfully'
            })
            
        except APIError:
            raise
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"submit quiz attempt error: {str(e)}")
            raise APIError("internal server error", 500)

    @staticmethod
    def get_quiz_attempts(user_id: int, quiz_id: int | None = None, params: Dict[str, Any] | None = None):
        """get user's quiz attempts"""
        try:
            # validate query parameters
            if params:
                schema = ProgressQuerySchema()
                try:
                    validated_params = schema.load(params)
                    if not isinstance(validated_params, dict):
                        validated_params = {}
                except Exception:
                    validated_params = {}
            else:
                validated_params = {}
            
            # build base query
            attempts_query = select(QuizAttempt, Quiz, Category).join(
                Quiz, QuizAttempt.quiz_id == Quiz.id
            ).join(
                Category, Quiz.category_id == Category.id
            ).where(QuizAttempt.user_id == user_id)
            
            # filter by specific quiz if provided
            if quiz_id:
                attempts_query = attempts_query.where(QuizAttempt.quiz_id == quiz_id)
            
            # apply sorting
            sort_by = validated_params.get('sort_by', 'completion_date')
            sort_order = validated_params.get('sort_order', 'desc')
            
            if sort_by == 'score':
                sort_column = QuizAttempt.score
            elif sort_by == 'quiz_title':
                sort_column = Quiz.title
            else:
                sort_column = QuizAttempt.completion_date
            
            if sort_order.lower() == 'desc':
                attempts_query = attempts_query.order_by(sort_column.desc())
            else:
                attempts_query = attempts_query.order_by(sort_column.asc())
            
            # get total count
            count_query = select(func.count()).select_from(attempts_query.subquery())
            total = db.session.scalar(count_query)
            
            # apply pagination
            page = validated_params.get('page', 1)
            per_page = validated_params.get('per_page', 10)
            offset = (page - 1) * per_page
            attempts_query = attempts_query.offset(offset).limit(per_page)
            
            # execute query
            results = db.session.execute(attempts_query).all()
            
            attempts_list = []
            for attempt, quiz, category in results:
                # parse answers JSON
                try:
                    import json
                    answers = json.loads(attempt.answers_json) if attempt.answers_json else []
                except:
                    answers = []
                
                attempts_list.append({
                    'id': attempt.id,
                    'publicId': attempt.public_id,
                    'quizId': quiz.id,
                    'quizTitle': quiz.title,
                    'categoryId': quiz.category_id,
                    'categoryName': category.category_name if category else None,
                    'score': attempt.score,
                    'answers': answers,
                    'completionDate': attempt.completion_date.isoformat(),
                })
            
            pagination = ResponseService.pagination_info(page, per_page, total or 0)
            return ResponseService.success_response(attempts_list, pagination=pagination)
            
        except Exception as e:
            current_app.logger.error(f"get quiz attempts error: {str(e)}")
            raise APIError("internal server error", 500)

    @staticmethod
    def get_progress_statistics(user_id: int):
        """get comprehensive progress statistics for a user"""
        try:
            # get tutorial progress statistics
            total_enrolled = db.session.scalar(
                select(func.count()).select_from(user_bookmarks)
                .where(user_bookmarks.c.user_id == user_id)
            )
            
            completed_tutorials = db.session.scalar(
                select(func.count()).select_from(user_bookmarks)
                .where(and_(
                    user_bookmarks.c.user_id == user_id,
                    user_bookmarks.c.is_completed == True
                ))
            )
            
            total_watch_time = db.session.scalar(
                select(func.sum(user_bookmarks.c.total_watch_time))
                .where(user_bookmarks.c.user_id == user_id)
            )
            
            avg_progress = db.session.scalar(
                select(func.avg(user_bookmarks.c.progress_percentage))
                .where(user_bookmarks.c.user_id == user_id)
            )
            
            # get quiz attempt statistics
            total_quiz_attempts = db.session.scalar(
                select(func.count()).select_from(QuizAttempt)
                .where(QuizAttempt.user_id == user_id)
            )
            
            avg_quiz_score = db.session.scalar(
                select(func.avg(QuizAttempt.score))
                .where(QuizAttempt.user_id == user_id)
            )
            
            # get unique quizzes attempted
            unique_quizzes = db.session.scalar(
                select(func.count(func.distinct(QuizAttempt.quiz_id)))
                .where(QuizAttempt.user_id == user_id)
            )
            
            return {
                'tutorialProgress': {
                    'totalEnrolled': total_enrolled or 0,
                    'completedTutorials': completed_tutorials or 0,
                    'inProgressTutorials': (total_enrolled or 0) - (completed_tutorials or 0),
                    'totalWatchTime': total_watch_time or 0,
                    'averageProgress': round(float(avg_progress), 2) if avg_progress else 0.0,
                    'completionRate': round(((completed_tutorials or 0) / (total_enrolled or 1) * 100), 2) if total_enrolled and total_enrolled > 0 else 0.0
                },
                'quizProgress': {
                    'totalAttempts': total_quiz_attempts or 0,
                    'uniqueQuizzesAttempted': unique_quizzes or 0,
                    'averageScore': round(float(avg_quiz_score), 2) if avg_quiz_score else 0.0
                },
                'overallProgress': {
                    'totalLearningTime': (total_watch_time or 0),
                    'totalActivities': (total_enrolled or 0) + (total_quiz_attempts or 0),
                    'completionRate': round(((completed_tutorials or 0) / (total_enrolled or 1) * 100), 2) if total_enrolled and total_enrolled > 0 else 0.0
                }
            }
            
        except Exception as e:
            current_app.logger.error(f"get progress statistics error: {str(e)}")
            raise APIError("internal server error", 500)
