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
from ..models.user_progress import UserProgress
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
            existing_bookmark = db.session.execute(
                select(user_bookmarks).where(
                    user_bookmarks.c.user_id == user_id,
                    user_bookmarks.c.tutorial_id == series_id
                )
            ).first()
            
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
            bookmark = db.session.execute(
                select(user_bookmarks).where(
                    user_bookmarks.c.user_id == user_id,
                    user_bookmarks.c.tutorial_id == series_id
                )
            ).first()
            
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
            # check if enrolled - use first() to get the full row
            bookmark_row = db.session.execute(
                select(user_bookmarks).where(
                    user_bookmarks.c.user_id == user_id,
                    user_bookmarks.c.tutorial_id == series_id
                )
            ).first()
            
            if not bookmark_row:
                raise APIError("not enrolled in this series", 404)
            
            # extract bookmark data from row - access columns using _mapping (SQLAlchemy 2.0 style)
            bookmark = bookmark_row._mapping if hasattr(bookmark_row, '_mapping') else dict(bookmark_row)
            
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
            
            # get individual video progress from UserProgress table
            completed_video_ids = []
            completed_videos = []
            
            if videos:
                # get all completed videos for this user in this series
                video_progress_records = db.session.scalars(
                    select(UserProgress).where(
                        UserProgress.user_id == user_id,
                        UserProgress.series_id == series_id,
                        UserProgress.is_completed == True
                    )
                ).all()
                
                completed_video_ids = [vp.tutorial_id for vp in video_progress_records]
                
                # build completed videos list
                for video in videos:
                    if video.id in completed_video_ids:
                        completed_videos.append({
                            'id': video.id,
                            'title': video.video_title or video.title,
                            'order': video.video_order,
                            'duration': video.video_duration or 0
                        })
            
            # check if series is completed (all videos completed)
            is_series_completed = len(videos) > 0 and len(completed_videos) == len(videos)
            
            # calculate progress percentage
            progress_percentage = 0
            if videos and len(videos) > 0:
                progress_percentage = round((len(completed_videos) / len(videos)) * 100)
            
            # Access bookmark fields safely from dict-like object
            enrolled_at = bookmark.get('enrolled_at')
            completed_at = bookmark.get('completed_at')
            last_accessed_at = bookmark.get('last_accessed_at')
            total_watch_time = bookmark.get('total_watch_time', 0) or 0
            last_watched_position = bookmark.get('last_watched_position', 0) or 0
            
            progress = {
                'seriesId': series_id,
                'seriesTitle': series.title if series else None,
                'status': 'completed' if is_series_completed else 'in-progress',
                'progressPercentage': progress_percentage,
                'enrolledAt': enrolled_at.isoformat() if enrolled_at else None,
                'completedAt': completed_at.isoformat() if completed_at and is_series_completed else None,
                'lastAccessedAt': last_accessed_at.isoformat() if last_accessed_at else None,
                'completedVideos': [str(v['id']) for v in completed_videos],  # return as string IDs for frontend
                'totalVideos': len(videos),
                'totalWatchTime': total_watch_time or 0,
                'lastWatchedPosition': last_watched_position or 0,
                'isCompleted': is_series_completed
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
            
            # check if tutorial/video exists
            video = db.session.scalar(
                select(Tutorial).where(Tutorial.id == tutorial_id)
                .where(Tutorial.status != 'deleted')
            )
            if not video:
                raise APIError("video not found", 404)
            
            # get series_id (parent series)
            series_id = video.parent_series_id
            if not series_id:
                # if video is itself a series, use its own ID
                series_id = video.id if video.series_type == 'series' else None
                if not series_id:
                    raise APIError("video is not part of a series", 400)
            
            # check if enrolled in series (bookmark exists for series)
            bookmark_row = db.session.execute(
                select(user_bookmarks).where(
                    user_bookmarks.c.user_id == user_id,
                    user_bookmarks.c.tutorial_id == series_id
                )
            ).first()
            
            if not bookmark_row:
                raise APIError("must be enrolled in series to track video progress", 403)
            
            # extract bookmark data from row (not used in this method, but kept for consistency)
            bookmark = bookmark_row._mapping if hasattr(bookmark_row, '_mapping') else bookmark_row
            
            # check if UserProgress record exists for this video
            video_progress = db.session.scalar(
                select(UserProgress).where(
                    UserProgress.user_id == user_id,
                    UserProgress.tutorial_id == tutorial_id,
                    UserProgress.series_id == series_id
                )
            )
            
            if video_progress:
                # update existing progress
                if 'is_completed' in validated_data:
                    video_progress.is_completed = validated_data['is_completed']
                    video_progress.updated_at = datetime.utcnow()
            else:
                # create new progress record
                if validated_data.get('is_completed'):
                    public_id = generate_public_id(UserProgress, "UPG")
                    video_progress = UserProgress()
                    video_progress.public_id = public_id
                    video_progress.user_id = user_id
                    video_progress.tutorial_id = tutorial_id
                    video_progress.series_id = series_id
                    video_progress.is_completed = True
                    db.session.add(video_progress)
            
            # update bookmark last accessed
            db.session.execute(
                update(user_bookmarks).where(
                    user_bookmarks.c.user_id == user_id,
                    user_bookmarks.c.tutorial_id == series_id
                ).values(
                    last_accessed_at=datetime.utcnow()
                )
            )
            
            # check if all videos in series are completed
            if validated_data.get('is_completed'):
                # get all videos in series
                all_videos = db.session.scalars(
                    select(Tutorial.id).where(
                        Tutorial.parent_series_id == series_id
                    ).where(Tutorial.status != 'deleted')
                ).all()
                
                # get all completed videos
                completed_videos = db.session.scalars(
                    select(UserProgress.tutorial_id).where(
                        UserProgress.user_id == user_id,
                        UserProgress.series_id == series_id,
                        UserProgress.is_completed == True
                    )
                ).all()
                
                # check if series is completed
                if len(all_videos) > 0 and len(completed_videos) >= len(all_videos):
                    # mark series as completed in bookmark
                    db.session.execute(
                        update(user_bookmarks).where(
                            user_bookmarks.c.user_id == user_id,
                            user_bookmarks.c.tutorial_id == series_id
                        ).values(
                            is_completed=True,
                            completed_at=datetime.utcnow(),
                            progress_percentage=100
                        )
                    )
            
            db.session.commit()
            
            return ResponseService.success_response({
                "message": "progress updated successfully",
                "tutorialId": tutorial_id,
                "seriesId": series_id,
                "isCompleted": validated_data.get('is_completed', False)
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

    @staticmethod
    def get_progress_reports(user_id: int, params: Dict[str, Any] | None = None):
        """get comprehensive progress reports data for charts and analytics"""
        try:
            current_app.logger.debug(f"[DEBUG] get_progress_reports called for user_id: {user_id}")
            
            # get all quiz attempts with quiz and category info
            attempts_query = select(
                QuizAttempt,
                Quiz,
                Category
            ).join(
                Quiz, QuizAttempt.quiz_id == Quiz.id
            ).join(
                Category, Quiz.category_id == Category.id
            ).where(
                QuizAttempt.user_id == user_id
            ).order_by(
                QuizAttempt.completion_date.desc()
            )
            
            attempts_results = db.session.execute(attempts_query).all()
            
            # process quiz attempts data
            quiz_attempts_data = []
            category_stats = {}  # category_name -> {total: 0, sum_score: 0, count: 0, attempts: []}
            
            for attempt, quiz, category in attempts_results:
                category_name = category.category_name if category else 'Unknown'
                
                # initialize category stats if needed
                if category_name not in category_stats:
                    category_stats[category_name] = {
                        'total': 0,
                        'sum_score': 0,
                        'count': 0,
                        'attempts': []
                    }
                
                category_stats[category_name]['total'] += 1
                category_stats[category_name]['sum_score'] += attempt.score
                category_stats[category_name]['count'] += 1
                category_stats[category_name]['attempts'].append({
                    'id': attempt.id,
                    'publicId': attempt.public_id,
                    'quizId': quiz.id,
                    'quizTitle': quiz.title,
                    'categoryName': category_name,
                    'score': attempt.score,
                    'completionDate': attempt.completion_date.isoformat() if attempt.completion_date else None
                })
                
                quiz_attempts_data.append({
                    'id': attempt.id,
                    'publicId': attempt.public_id,
                    'quizId': quiz.id,
                    'quizTitle': quiz.title,
                    'categoryName': category_name,
                    'score': attempt.score,
                    'completionDate': attempt.completion_date.isoformat() if attempt.completion_date else None
                })
            
            # calculate category averages and build pie chart data
            category_performance = []
            total_quizzes = len(quiz_attempts_data)
            
            for cat_name, stats in category_stats.items():
                avg_score = round(stats['sum_score'] / stats['count'], 1) if stats['count'] > 0 else 0
                percentage = round((stats['count'] / total_quizzes * 100), 1) if total_quizzes > 0 else 0
                
                category_performance.append({
                    'category': cat_name,
                    'count': stats['count'],
                    'percentage': percentage,
                    'averageScore': avg_score
                })
            
            # sort by count descending
            category_performance.sort(key=lambda x: x['count'], reverse=True)
            
            # calculate overall statistics
            total_quiz_attempts = len(quiz_attempts_data)
            avg_score = round(sum(a['score'] for a in quiz_attempts_data) / total_quiz_attempts, 1) if total_quiz_attempts > 0 else 0
            
            # find best category (highest average score) - handle ties properly
            best_category = None
            best_category_name = 'N/A'
            if category_performance:
                # find the highest average score
                max_avg_score = max(cat['averageScore'] for cat in category_performance)
                # get all categories with this score
                best_categories = [cat for cat in category_performance if cat['averageScore'] == max_avg_score]
                
                if len(best_categories) == 1:
                    # single best category
                    best_category = best_categories[0]
                    best_category_name = best_category['category']
                elif len(best_categories) == len(category_performance):
                    # all categories have the same score - show "All Categories"
                    best_category_name = 'All Categories'
                    best_category = {'category': 'All Categories', 'averageScore': max_avg_score}
                else:
                    # multiple categories tied - show first one with count as tiebreaker, or "Multiple"
                    # sort by count descending to break ties
                    best_categories.sort(key=lambda x: x['count'], reverse=True)
                    best_category = best_categories[0]
                    if len(best_categories) > 1:
                        # indicate there are ties
                        best_category_name = f"{best_category['category']} (+{len(best_categories)-1} tied)"
                    else:
                        best_category_name = best_category['category']
            
            # build quiz trend data (last 20 attempts, grouped by date)
            from collections import defaultdict
            from datetime import datetime, timedelta
            
            # group attempts by date - sort by date descending first
            sorted_attempts = sorted(quiz_attempts_data, 
                                   key=lambda x: x['completionDate'] if x['completionDate'] else '', 
                                   reverse=True)
            
            trend_by_date = defaultdict(list)
            for attempt_data in sorted_attempts[:50]:  # last 50 attempts
                if attempt_data['completionDate']:
                    try:
                        date_obj = datetime.fromisoformat(attempt_data['completionDate'].replace('Z', '+00:00'))
                        date_key = date_obj.date().isoformat()
                        trend_by_date[date_key].append(attempt_data['score'])
                    except:
                        continue
            
            # calculate average score per date - sort dates descending (latest first)
            quiz_trend_data = []
            sorted_dates = sorted(trend_by_date.keys(), reverse=True)[:20]  # last 20 dates, latest first
            for date_str in sorted_dates:
                scores = trend_by_date[date_str]
                avg_score_for_date = round(sum(scores) / len(scores), 1)
                quiz_trend_data.append({
                    'date': date_str,
                    'score': avg_score_for_date,
                    'count': len(scores)
                })
            # reverse to show oldest to newest for chart (left to right)
            quiz_trend_data.reverse()
            
            # get recent tutorials (from user_bookmarks)
            recent_tutorials_query = select(
                Tutorial,
                user_bookmarks,
                Category
            ).join(
                user_bookmarks, Tutorial.id == user_bookmarks.c.tutorial_id
            ).join(
                Category, Tutorial.category_id == Category.id
            ).where(
                user_bookmarks.c.user_id == user_id
            ).order_by(
                user_bookmarks.c.last_accessed_at.desc()
            ).limit(5)
            
            recent_tutorials_results = db.session.execute(recent_tutorials_query).all()
            
            current_app.logger.debug(f"[DEBUG] recent_tutorials_results count: {len(recent_tutorials_results)}")
            if recent_tutorials_results:
                current_app.logger.debug(f"[DEBUG] First row length: {len(recent_tutorials_results[0])}")
            
            recent_tutorials = []
            for row in recent_tutorials_results:
                try:
                    # when selecting Tutorial, user_bookmarks (Table), Category
                    # SQLAlchemy returns: (Tutorial, user_id, tutorial_id, created_at, progress_percentage,
                    # last_watched_position, total_watch_time, is_completed, completed_at, enrolled_at,
                    # last_accessed_at, Category)
                    tutorial = row[0]  # Tutorial object
                    
                    # access user_bookmarks columns by index
                    # row structure: [Tutorial, user_id, tutorial_id, created_at, progress_percentage,
                    # last_watched_position, total_watch_time, is_completed, completed_at, enrolled_at,
                    # last_accessed_at, Category]
                    progress_percentage = row[4] if len(row) > 4 else 0
                    last_accessed_at = row[10] if len(row) > 10 else None
                    is_completed = row[7] if len(row) > 7 else False
                    category = row[11] if len(row) > 11 else None  # Category object
                    
                    # safely format last_accessed_at
                    last_accessed_str = None
                    if last_accessed_at is not None:
                        try:
                            last_accessed_str = last_accessed_at.isoformat()
                        except (AttributeError, TypeError):
                            pass
                    
                    recent_tutorials.append({
                        'id': tutorial.id,
                        'publicId': tutorial.public_id,
                        'title': tutorial.title,
                        'categoryName': category.category_name if category else 'Unknown',
                        'progressPercentage': progress_percentage or 0,
                        'lastAccessedAt': last_accessed_str,
                        'isCompleted': is_completed or False
                    })
                except Exception as e:
                    current_app.logger.error(f"[DEBUG] Error processing recent tutorial row: {str(e)}")
                    current_app.logger.error(f"[DEBUG] Row structure: {[type(item).__name__ for item in row] if row else 'empty'}")
                    continue  # skip this row and continue with next
            
            # calculate improvement (compare last week vs previous week)
            now = datetime.utcnow()
            week_ago = now - timedelta(days=7)
            two_weeks_ago = now - timedelta(days=14)
            
            recent_scores = [a['score'] for a in quiz_attempts_data if a['completionDate'] and 
                           datetime.fromisoformat(a['completionDate'].replace('Z', '+00:00')) >= week_ago]
            previous_scores = [a['score'] for a in quiz_attempts_data if a['completionDate'] and 
                              two_weeks_ago <= datetime.fromisoformat(a['completionDate'].replace('Z', '+00:00')) < week_ago]
            
            recent_avg = round(sum(recent_scores) / len(recent_scores), 1) if recent_scores else 0
            previous_avg = round(sum(previous_scores) / len(previous_scores), 1) if previous_scores else 0
            improvement = round(recent_avg - previous_avg, 1) if previous_avg > 0 else 0
            
            # find most improved category (compare recent vs previous period per category)
            most_improved_category = None
            most_improved_name = 'N/A'
            max_improvement = float('-inf')
            
            if category_performance:
                # calculate improvement per category
                category_improvements = []
                for cat_name, stats in category_stats.items():
                    # get recent attempts for this category (last week)
                    recent_cat_attempts = [
                        a for a in quiz_attempts_data 
                        if a['categoryName'] == cat_name and a['completionDate'] and
                        datetime.fromisoformat(a['completionDate'].replace('Z', '+00:00')) >= week_ago
                    ]
                    # get previous attempts for this category (week before)
                    previous_cat_attempts = [
                        a for a in quiz_attempts_data 
                        if a['categoryName'] == cat_name and a['completionDate'] and
                        two_weeks_ago <= datetime.fromisoformat(a['completionDate'].replace('Z', '+00:00')) < week_ago
                    ]
                    
                    if recent_cat_attempts and previous_cat_attempts:
                        recent_cat_avg = sum(a['score'] for a in recent_cat_attempts) / len(recent_cat_attempts)
                        previous_cat_avg = sum(a['score'] for a in previous_cat_attempts) / len(previous_cat_attempts)
                        cat_improvement = recent_cat_avg - previous_cat_avg
                        category_improvements.append({
                            'category': cat_name,
                            'improvement': cat_improvement,
                            'recentAvg': recent_cat_avg,
                            'previousAvg': previous_cat_avg
                        })
                
                if category_improvements:
                    # find category with highest improvement
                    max_improvement = max(cat['improvement'] for cat in category_improvements)
                    best_improved = [cat for cat in category_improvements if cat['improvement'] == max_improvement]
                    
                    if best_improved:
                        # if multiple tied, use the one with highest recent average
                        best_improved.sort(key=lambda x: x['recentAvg'], reverse=True)
                        most_improved_category = best_improved[0]
                        most_improved_name = most_improved_category['category']
                        if len(best_improved) > 1:
                            most_improved_name = f"{most_improved_name} (+{len(best_improved)-1} tied)"
                
                # if no category has improvement data, fallback to best category
                if not most_improved_category:
                    most_improved_name = best_category_name
                    most_improved_category = best_category
            
            # build response
            reports_data = {
                'kpiCards': {
                    'totalQuizzes': total_quiz_attempts,
                    'averageScore': avg_score,
                    'bestCategory': best_category_name,
                    'mostImproved': most_improved_name,
                    'improvement': improvement
                },
                'quizTrend': quiz_trend_data,
                'categoryPerformance': category_performance,
                'recentQuizzes': sorted_attempts[:20],  # last 20 attempts, already sorted by latest date
                'recentTutorials': recent_tutorials,
                'summary': {
                    'totalQuizAttempts': total_quiz_attempts,
                    'averageScore': avg_score,
                    'totalCategories': len(category_performance),
                    'thisWeekQuizzes': len(recent_scores),
                    'improvement': improvement
                }
            }
            
            current_app.logger.debug(f"[DEBUG] get_progress_reports returning data: {len(quiz_attempts_data)} attempts, {len(category_performance)} categories")
            
            return ResponseService.success_response(reports_data)
            
        except Exception as e:
            current_app.logger.error(f"get progress reports error: {str(e)}", exc_info=True)
            raise APIError("internal server error", 500)
