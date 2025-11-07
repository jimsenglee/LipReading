"""
analytics service for calculating content interaction and feedback analytics
Following README.txt separation of concerns
"""
from flask import current_app
from sqlalchemy import select, func, and_, or_, case, desc, asc
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from ..extensions import db
from ..models.tutorial import Tutorial
from ..models.quiz import Quiz
from ..models.user_bookmark import user_bookmarks
from ..models.user_progress import UserProgress
from ..models.feedback import Feedback
from ..models.category import Category
from ..models.account import Account
from .error_service import APIError
from .response_service import ResponseService


class AnalyticsService:
    """service for calculating analytics data for admin dashboard"""

    @staticmethod
    def get_content_analytics():
        """get content interaction analytics for tutorials and quizzes"""
        try:
            print(f"[DEBUG] get_content_analytics called")
            
            # get total tutorials count
            total_tutorials = db.session.scalar(
                select(func.count(Tutorial.id))
                .where(Tutorial.status != 'deleted')
            ) or 0
            
            # get total views (sum of all tutorial views)
            total_views = db.session.scalar(
                select(func.sum(Tutorial.views))
                .where(Tutorial.status != 'deleted')
            ) or 0
            
            # get total bookmarks count
            total_bookmarks = db.session.scalar(
                select(func.count(user_bookmarks.c.tutorial_id))
            ) or 0
            
            # calculate average completion rate
            # a series is completed when user has completed all videos in that series
            avg_completion = AnalyticsService._calculate_avg_completion_rate()
            
            print(f"[DEBUG] Content analytics: tutorials={total_tutorials}, views={total_views}, bookmarks={total_bookmarks}, avg_completion={avg_completion}")
            
            return ResponseService.success_response({
                "totalTutorials": total_tutorials,
                "totalViews": total_views,
                "totalBookmarks": total_bookmarks,
                "avgCompletion": round(avg_completion, 1)
            })
            
        except Exception as e:
            current_app.logger.error(f"get content analytics error: {str(e)}")
            import traceback
            traceback.print_exc()
            raise APIError("internal server error", 500)

    @staticmethod
    def _calculate_avg_completion_rate():
        """calculate average completion rate for tutorial series"""
        try:
            # get all tutorial series (parent tutorials with series_type='series')
            series_tutorials = db.session.scalars(
                select(Tutorial.id)
                .where(Tutorial.series_type == 'series')
                .where(Tutorial.parent_series_id == None)
            ).all()
            
            if not series_tutorials:
                return 0.0
            
            total_completion_rates = []
            
            for series_id in series_tutorials:
                # get all videos in this series
                series_videos = db.session.scalars(
                    select(Tutorial.id)
                    .where(Tutorial.parent_series_id == series_id)
                ).all()
                
                if not series_videos:
                    continue
                
                # get all users who bookmarked this series (enrolled)
                enrolled_users = db.session.scalars(
                    select(user_bookmarks.c.user_id).distinct()
                    .where(user_bookmarks.c.tutorial_id == series_id)
                ).all()
                
                if not enrolled_users:
                    continue
                
                # for each enrolled user, check if they completed all videos
                completed_count = 0
                for user_id in enrolled_users:
                    # count completed videos for this user in this series
                    completed_videos = db.session.scalar(
                        select(func.count(UserProgress.id))
                        .where(UserProgress.user_id == user_id)
                        .where(UserProgress.series_id == series_id)
                        .where(UserProgress.is_completed == True)
                    ) or 0
                    
                    # user completed the series if they completed all videos
                    if completed_videos >= len(series_videos):
                        completed_count += 1
                
                # calculate completion rate for this series
                if len(enrolled_users) > 0:
                    series_completion_rate = (completed_count / len(enrolled_users)) * 100
                    total_completion_rates.append(series_completion_rate)
            
            # return average completion rate across all series
            if total_completion_rates:
                return sum(total_completion_rates) / len(total_completion_rates)
            return 0.0
            
        except Exception as e:
            current_app.logger.error(f"calculate avg completion rate error: {str(e)}")
            return 0.0

    @staticmethod
    def get_feedback_analytics():
        """get feedback analytics for admin dashboard"""
        try:
            print(f"[DEBUG] get_feedback_analytics called")
            
            # get total feedback count
            total_feedback = db.session.scalar(
                select(func.count(Feedback.id))
            ) or 0
            
            # get feedback by status
            new_feedback = db.session.scalar(
                select(func.count(Feedback.id))
                .where(Feedback.status == 'new')
            ) or 0
            
            in_progress_feedback = db.session.scalar(
                select(func.count(Feedback.id))
                .where(Feedback.status == 'in_progress')
            ) or 0
            
            resolved_feedback = db.session.scalar(
                select(func.count(Feedback.id))
                .where(Feedback.status == 'resolved')
            ) or 0
            
            print(f"[DEBUG] Feedback analytics: total={total_feedback}, new={new_feedback}, in_progress={in_progress_feedback}, resolved={resolved_feedback}")
            
            return ResponseService.success_response({
                "total": total_feedback,
                "new": new_feedback,
                "inProgress": in_progress_feedback,
                "resolved": resolved_feedback
            })
            
        except Exception as e:
            current_app.logger.error(f"get feedback analytics error: {str(e)}")
            import traceback
            traceback.print_exc()
            raise APIError("internal server error", 500)
    
    @staticmethod
    def get_user_learning_analytics(params: Optional[dict] = None):
        """get comprehensive admin-focused analytics for dashboard"""
        try:
            from ..models.quiz_attempt import QuizAttempt
            from ..models.user import User
            from ..models.review import Review
            
            print(f"[DEBUG] get_user_learning_analytics called with params: {params}")
            
            # ============================================================================
            # OVERALL STATISTICS - ADMIN FOCUSED
            # ============================================================================
            
            # total users
            total_users = db.session.scalar(select(func.count(User.id))) or 0
            
            # total tutorials (series only, not individual videos)
            total_tutorials = db.session.scalar(
                select(func.count(Tutorial.id))
                .where(Tutorial.series_type == 'series')
                .where(Tutorial.parent_series_id == None)
            ) or 0
            
            # total quizzes (series only)
            total_quizzes = db.session.scalar(
                select(func.count(Quiz.id))
                .where(Quiz.series_type == 'series')
                .where(Quiz.parent_series_id == None)
            ) or 0
            
            # total tutorial enrollments (bookmarks)
            total_tutorial_enrollments = db.session.scalar(
                select(func.count(user_bookmarks.c.tutorial_id))
            ) or 0
            
            # total quiz attempts (enrollments)
            total_quiz_attempts = db.session.scalar(
                select(func.count(QuizAttempt.id))
            ) or 0
            
            # average quiz score
            avg_quiz_score = db.session.scalar(
                select(func.avg(QuizAttempt.score))
            ) or 0.0
            
            # total categories
            total_categories = db.session.scalar(select(func.count(Category.id))) or 0
            
            print(f"[DEBUG] Overall: users={total_users}, tutorials={total_tutorials}, quizzes={total_quizzes}, enrollments={total_tutorial_enrollments}, attempts={total_quiz_attempts}")
            
            # ============================================================================
            # TUTORIAL ENROLLMENT STATS
            # ============================================================================
            
            tutorial_enrollment_query = (
                select(
                    Tutorial.id,
                    Tutorial.public_id,
                    Tutorial.title,
                    Category.category_name,
                    func.count(user_bookmarks.c.user_id).label('enrollments'),
                    func.sum(Tutorial.views).label('total_views')
                )
                .join(Category, Category.id == Tutorial.category_id)
                .outerjoin(user_bookmarks, user_bookmarks.c.tutorial_id == Tutorial.id)
                .where(Tutorial.series_type == 'series')
                .where(Tutorial.parent_series_id == None)
                .group_by(Tutorial.id, Tutorial.public_id, Tutorial.title, Category.category_name)
                .order_by(func.count(user_bookmarks.c.user_id).desc())
                .limit(10)
            )
            
            tutorial_enrollments = []
            for row in db.session.execute(tutorial_enrollment_query).all():
                tutorial_enrollments.append({
                    "tutorialId": row.public_id,
                    "title": row.title,
                    "category": row.category_name,
                    "enrollments": row.enrollments or 0,
                    "views": row.total_views or 0
                })
            
            print(f"[DEBUG] Found {len(tutorial_enrollments)} tutorial enrollments")
            
            # ============================================================================
            # QUIZ ENROLLMENT STATS
            # ============================================================================
            
            quiz_enrollment_query = (
                select(
                    Quiz.id,
                    Quiz.public_id,
                    Quiz.title,
                    Category.category_name,
                    func.count(QuizAttempt.id).label('attempts'),
                    func.sum(Quiz.views).label('total_views')
                )
                .join(Category, Category.id == Quiz.category_id)
                .outerjoin(QuizAttempt, QuizAttempt.quiz_id == Quiz.id)
                .where(Quiz.series_type == 'series')
                .where(Quiz.parent_series_id == None)
                .group_by(Quiz.id, Quiz.public_id, Quiz.title, Category.category_name)
                .order_by(func.count(QuizAttempt.id).desc())
                .limit(10)
            )
            
            quiz_enrollments = []
            for row in db.session.execute(quiz_enrollment_query).all():
                quiz_enrollments.append({
                    "quizId": row.public_id,
                    "title": row.title,
                    "category": row.category_name,
                    "attempts": row.attempts or 0,
                    "views": row.total_views or 0
                })
            
            print(f"[DEBUG] Found {len(quiz_enrollments)} quiz enrollments")
            
            # ============================================================================
            # RATINGS & REVIEWS COMPARISON
            # ============================================================================
            
            # tutorial ratings
            tutorial_ratings_query = (
                select(
                    Tutorial.id,
                    Tutorial.public_id,
                    Tutorial.title,
                    Category.category_name,
                    func.avg(Review.rating).label('avg_rating'),
                    func.count(Review.id).label('total_reviews')
                )
                .join(Category, Category.id == Tutorial.category_id)
                .outerjoin(Review, and_(
                    Review.target_type == 'tutorial',
                    Review.target_id == Tutorial.id
                ))
                .where(Tutorial.series_type == 'series')
                .where(Tutorial.parent_series_id == None)
                .group_by(Tutorial.id, Tutorial.public_id, Tutorial.title, Category.category_name)
                .having(func.count(Review.id) > 0)
                .order_by(func.avg(Review.rating).desc())
                .limit(10)
            )
            
            tutorial_ratings = []
            for row in db.session.execute(tutorial_ratings_query).all():
                tutorial_ratings.append({
                    "contentId": row.public_id,
                    "title": row.title,
                    "category": row.category_name,
                    "type": "tutorial",
                    "avgRating": round(float(row.avg_rating), 1),
                    "totalReviews": row.total_reviews
                })
            
            # quiz ratings
            quiz_ratings_query = (
                select(
                    Quiz.id,
                    Quiz.public_id,
                    Quiz.title,
                    Category.category_name,
                    func.avg(Review.rating).label('avg_rating'),
                    func.count(Review.id).label('total_reviews')
                )
                .join(Category, Category.id == Quiz.category_id)
                .outerjoin(Review, and_(
                    Review.target_type == 'quiz',
                    Review.target_id == Quiz.id
                ))
                .where(Quiz.series_type == 'series')
                .where(Quiz.parent_series_id == None)
                .group_by(Quiz.id, Quiz.public_id, Quiz.title, Category.category_name)
                .having(func.count(Review.id) > 0)
                .order_by(func.avg(Review.rating).desc())
                .limit(10)
            )
            
            quiz_ratings = []
            for row in db.session.execute(quiz_ratings_query).all():
                quiz_ratings.append({
                    "contentId": row.public_id,
                    "title": row.title,
                    "category": row.category_name,
                    "type": "quiz",
                    "avgRating": round(float(row.avg_rating), 1),
                    "totalReviews": row.total_reviews
                })
            
            # combine and sort by rating
            all_ratings = tutorial_ratings + quiz_ratings
            all_ratings.sort(key=lambda x: x['avgRating'], reverse=True)
            
            print(f"[DEBUG] Found {len(all_ratings)} content items with ratings")
            
            # ============================================================================
            # SERIES COMPLETION RATES
            # ============================================================================
            
            # get tutorial series completion rates
            series_completion_query = (
                select(
                    Tutorial.id,
                    Tutorial.public_id,
                    Tutorial.title,
                    Category.category_name,
                    func.count(user_bookmarks.c.user_id.distinct()).label('enrolled_users')
                )
                .join(Category, Category.id == Tutorial.category_id)
                .outerjoin(user_bookmarks, user_bookmarks.c.tutorial_id == Tutorial.id)
                .where(Tutorial.series_type == 'series')
                .where(Tutorial.parent_series_id == None)
                .group_by(Tutorial.id, Tutorial.public_id, Tutorial.title, Category.category_name)
            )
            
            series_completions = []
            for row in db.session.execute(series_completion_query).all():
                series_id = row.id
                enrolled_count = row.enrolled_users or 0
                
                if enrolled_count == 0:
                    continue
                
                # get all videos in this series
                series_videos = db.session.scalars(
                    select(Tutorial.id)
                    .where(Tutorial.parent_series_id == series_id)
                ).all()
                
                if not series_videos:
                    continue
                
                # get enrolled users
                enrolled_users = db.session.scalars(
                    select(user_bookmarks.c.user_id).distinct()
                    .where(user_bookmarks.c.tutorial_id == series_id)
                ).all()
                
                # count users who completed all videos
                completed_count = 0
                for user_id in enrolled_users:
                    completed_videos = db.session.scalar(
                        select(func.count(UserProgress.id))
                        .where(UserProgress.user_id == user_id)
                        .where(UserProgress.series_id == series_id)
                        .where(UserProgress.is_completed == True)
                    ) or 0
                    
                    if completed_videos >= len(series_videos):
                        completed_count += 1
                
                completion_rate = (completed_count / enrolled_count * 100) if enrolled_count > 0 else 0.0
                
                series_completions.append({
                    "seriesId": row.public_id,
                    "title": row.title,
                    "category": row.category_name,
                    "enrolledUsers": enrolled_count,
                    "completedUsers": completed_count,
                    "completionRate": round(completion_rate, 1),
                    "totalVideos": len(series_videos)
                })
            
            series_completions.sort(key=lambda x: x['completionRate'], reverse=True)
            print(f"[DEBUG] Found {len(series_completions)} series with completion data")
            
            # ============================================================================
            # TOP PERFORMERS
            # ============================================================================
            
            top_performers_query = (
                select(
                    QuizAttempt.user_id,
                    func.avg(QuizAttempt.score).label('avg_score'),
                    func.count(QuizAttempt.id).label('total_quizzes'),
                    func.max(QuizAttempt.completion_date).label('last_activity')
                )
                .group_by(QuizAttempt.user_id)
                .order_by(func.avg(QuizAttempt.score).desc())
                .limit(10)
            )
            
            top_performers = []
            for rank, (user_id, avg_score, total_quizzes, last_activity) in enumerate(db.session.execute(top_performers_query).all(), 1):
                user = db.session.scalar(select(User).where(User.id == user_id))
                if user:
                    top_performers.append({
                        "rank": rank,
                        "userId": user_id,
                        "name": user.name,
                        "email": user.email,
                        "averageScore": round(float(avg_score), 1),
                        "totalQuizzes": int(total_quizzes),
                        "lastActivity": last_activity.strftime("%Y-%m-%d") if last_activity else "N/A"
                    })
            
            print(f"[DEBUG] Found {len(top_performers)} top performers")
            
            # ============================================================================
            # CATEGORY PERFORMANCE - Include ALL categories even if no attempts
            # ============================================================================
            
            categories = db.session.scalars(select(Category).where(Category.status != 'deleted')).all()
            category_performance = []
            
            for category in categories:
                # get quizzes in this category
                quizzes_in_category = db.session.scalars(
                    select(Quiz.id)
                    .where(Quiz.category_id == category.id)
                    .where(Quiz.series_type == 'series')
                    .where(Quiz.parent_series_id == None)
                ).all()
                
                # get attempts for quizzes in this category (even if no quizzes exist)
                category_attempts = None
                if quizzes_in_category:
                    category_attempts = db.session.execute(
                        select(
                            func.count(QuizAttempt.id).label('total_attempts'),
                            func.avg(QuizAttempt.score).label('avg_score'),
                            func.count(QuizAttempt.user_id.distinct()).label('unique_users')
                        )
                        .where(QuizAttempt.quiz_id.in_(quizzes_in_category))
                    ).first()
                
                # include ALL categories, even if no attempts or no quizzes
                category_performance.append({
                    "category": category.category_name,
                    "averageScore": round(float(category_attempts.avg_score or 0), 1) if category_attempts and category_attempts.total_attempts and category_attempts.total_attempts > 0 else 0.0,
                    "totalAttempts": int(category_attempts.total_attempts or 0) if category_attempts else 0,
                    "uniqueUsers": int(category_attempts.unique_users or 0) if category_attempts else 0,
                    "hasQuizzes": len(quizzes_in_category) > 0
                })
            
            # sort by average score and total attempts (descending)
            category_performance.sort(key=lambda x: (x['averageScore'], x['totalAttempts']), reverse=True)
            print(f"[DEBUG] Category performance calculated for {len(category_performance)} categories (all categories included)")
            
            # ============================================================================
            # RETURN COMPREHENSIVE DATA
            # ============================================================================
            
            result = {
                "overall": {
                    "totalUsers": total_users,
                    "totalTutorials": total_tutorials,
                    "totalQuizzes": total_quizzes,
                    "totalTutorialEnrollments": total_tutorial_enrollments,
                    "totalQuizAttempts": total_quiz_attempts,
                    "averageQuizScore": round(float(avg_quiz_score), 1),
                    "totalCategories": total_categories
                },
                "tutorialEnrollments": tutorial_enrollments,
                "quizEnrollments": quiz_enrollments,
                "ratingsAndReviews": all_ratings,
                "seriesCompletions": series_completions,
                "topPerformers": top_performers,
                "categoryPerformance": category_performance
            }
            
            print(f"[DEBUG] Admin analytics calculated successfully")
            
            return ResponseService.success_response(result)
            
        except Exception as e:
            current_app.logger.error(f"get user learning analytics error: {str(e)}")
            import traceback
            traceback.print_exc()
            raise APIError("internal server error", 500)

    @staticmethod
    def get_tutorial_popularity():
        """get top 10 most popular tutorials by views"""
        try:
            from ..models.user import User
            
            print(f"[DEBUG] get_tutorial_popularity called")
            
            tutorials = db.session.execute(
                select(
                    Tutorial.public_id.label('id'),
                    Tutorial.title,
                    Tutorial.views,
                    Category.category_name.label('category')
                )
                .join(Category, Tutorial.category_id == Category.id)
                .where(Tutorial.status != 'deleted')
                .order_by(desc(Tutorial.views))
                .limit(10)
            ).mappings().all()
            
            result = [dict(row) for row in tutorials]
            print(f"[DEBUG] Tutorial popularity: found {len(result)} tutorials")
            return ResponseService.success_response(result)
        except Exception as e:
            current_app.logger.error(f"get_tutorial_popularity error: {str(e)}")
            import traceback
            traceback.print_exc()
            raise APIError("internal server error", 500)

    @staticmethod
    def get_tutorial_interaction_details(params: Optional[dict] = None):
        """get detailed tutorial interaction data with pagination and filtering"""
        try:
            from ..models.user import User
            
            print(f"[DEBUG] get_tutorial_interaction_details called with params: {params}")
            
            if params is None:
                params = {}
            
            page = int(params.get('page', 1))
            per_page = int(params.get('per_page', 10))
            category = params.get('category')
            
            # build base query
            query = select(
                Tutorial.public_id.label('tutorialId'),
                Tutorial.title,
                Category.category_name.label('category'),
                Tutorial.views,
                func.count(user_bookmarks.c.user_id.distinct()).label('bookmarks'),
                func.round(
                    func.cast(
                        func.count(
                            func.distinct(
                                case((user_bookmarks.c.is_completed == True, user_bookmarks.c.user_id))
                            )
                        ), 
                        db.Float
                    ) / 
                    func.cast(
                        func.count(func.distinct(user_bookmarks.c.user_id)), 
                        db.Float
                    ) * 100, 
                    1
                ).label('completionRate')
            ).join(Category, Tutorial.category_id == Category.id)\
            .outerjoin(user_bookmarks, user_bookmarks.c.tutorial_id == Tutorial.id)\
            .where(Tutorial.status != 'deleted')\
            .group_by(Tutorial.public_id, Tutorial.title, Category.category_name, Tutorial.views)
            
            # apply category filter
            if category and category != 'all':
                query = query.where(Category.category_name == category)
            
            # get total count for pagination
            count_query = select(func.count()).select_from(query.subquery())
            total_count = db.session.scalar(count_query) or 0
            
            # apply pagination
            offset = (page - 1) * per_page
            query = query.limit(per_page).offset(offset)
            
            # execute query
            results = db.session.execute(query).mappings().all()
            
            items = [dict(row) for row in results]
            total_pages = (total_count + per_page - 1) // per_page if total_count > 0 else 0
            
            result = {
                "data": items,
                "pagination": {
                    "current_page": page,
                    "per_page": per_page,
                    "total_count": total_count,
                    "total_pages": total_pages
                }
            }
            
            print(f"[DEBUG] Tutorial interaction details: found {len(items)} items, total={total_count}")
            return ResponseService.success_response(result)
        except Exception as e:
            current_app.logger.error(f"get_tutorial_interaction_details error: {str(e)}")
            import traceback
            traceback.print_exc()
            raise APIError("internal server error", 500)

    @staticmethod
    def get_feedback_distributions():
        """get feedback distribution by type and status"""
        try:
            print(f"[DEBUG] get_feedback_distributions called")
            
            # feedback by status
            status_data = db.session.execute(
                select(Feedback.status, func.count(Feedback.id).label('value'))
                .group_by(Feedback.status)
            ).mappings().all()
            
            # feedback by type
            type_data = db.session.execute(
                select(Feedback.feedback_type.label('type'), func.count(Feedback.id).label('count'))
                .group_by(Feedback.feedback_type)
            ).mappings().all()
            
            # format status data for pie chart
            status_colors = {
                'new': '#3B82F6',
                'in_progress': '#F59E0B',
                'resolved': '#10B981',
                'closed': '#6B7280'
            }
            
            by_status = []
            for row in status_data:
                by_status.append({
                    "name": row.status.replace('_', ' ').title(),
                    "value": row.value,
                    "color": status_colors.get(row.status, '#7E57C2')
                })
            
            # format type data for pie chart
            type_colors = {
                'bug': '#EF4444',
                'feature': '#3B82F6',
                'general': '#6B7280'
            }
            
            by_type = []
            for row in type_data:
                by_type.append({
                    "type": row.type.replace('_', ' ').title(),
                    "count": row.count,
                    "color": type_colors.get(row.type, '#7E57C2')
                })
            
            print(f"[DEBUG] Feedback distributions: by_status={len(by_status)}, by_type={len(by_type)}")
            
            return ResponseService.success_response({
                "byStatus": by_status,
                "byType": by_type
            })
        except Exception as e:
            current_app.logger.error(f"get_feedback_distributions error: {str(e)}")
            import traceback
            traceback.print_exc()
            raise APIError("internal server error", 500)

    @staticmethod
    def get_feedback_list(params: Optional[dict] = None):
        """get paginated and filterable list of feedback items"""
        try:
            from ..models.user import User
            
            print(f"[DEBUG] get_feedback_list called with params: {params}")
            
            if params is None:
                params = {}
            
            page = int(params.get('page', 1))
            per_page = int(params.get('per_page', 10))
            search = params.get('search', '')
            status = params.get('status')
            feedback_type = params.get('feedback_type')
            sort_by = params.get('sort_by', 'submission_date')
            sort_order = params.get('sort_order', 'desc')
            
            # build base query - use Account model for user info
            from ..models.account import Account
            
            query = select(
                Feedback.id,
                Feedback.public_id,
                Feedback.submitted_by_user_id,
                Account.name.label('userName'),
                Account.email,
                Feedback.feedback_type,
                Feedback.description,
                Feedback.status,
                Feedback.submission_date,
                Feedback.admin_response,
                Feedback.updated_at
            ).join(Account, Feedback.submitted_by_user_id == Account.id)
            
            # apply filters
            if search:
                query = query.where(or_(
                    Feedback.description.ilike(f'%{search}%'),
                    Feedback.feedback_type.ilike(f'%{search}%'),
                    Account.name.ilike(f'%{search}%'),
                    Account.email.ilike(f'%{search}%')
                ))
            
            if status and status != 'all':
                query = query.where(Feedback.status == status)
            
            if feedback_type and feedback_type != 'all':
                query = query.where(Feedback.feedback_type == feedback_type)
            
            # apply sorting
            if sort_by == 'submission_date':
                query = query.order_by(desc(Feedback.submission_date) if sort_order == 'desc' else asc(Feedback.submission_date))
            elif sort_by == 'status':
                query = query.order_by(desc(Feedback.status) if sort_order == 'desc' else asc(Feedback.status))
            elif sort_by == 'type':
                query = query.order_by(desc(Feedback.feedback_type) if sort_order == 'desc' else asc(Feedback.feedback_type))
            
            # get total count for pagination
            count_query = select(func.count()).select_from(query.subquery())
            total_count = db.session.scalar(count_query) or 0
            
            # apply pagination
            offset = (page - 1) * per_page
            query = query.limit(per_page).offset(offset)
            
            # execute query
            results = db.session.execute(query).mappings().all()
            
            items = []
            for row in results:
                items.append({
                    "id": str(row.public_id),
                    "userId": str(row.submitted_by_user_id),
                    "userName": row.userName,
                    "email": row.email,
                    "type": row.feedback_type,
                    "category": row.feedback_type,  # using feedback_type as category
                    "title": row.description[:50] + '...' if len(row.description) > 50 else row.description,
                    "description": row.description,
                    "status": row.status,
                    "submittedAt": row.submission_date.isoformat() if row.submission_date else None,
                    "updatedAt": row.updated_at.isoformat() if row.updated_at else (row.submission_date.isoformat() if row.submission_date else None),
                    "adminNotes": row.admin_response
                })
            
            total_pages = (total_count + per_page - 1) // per_page if total_count > 0 else 0
            
            result = {
                "data": items,
                "pagination": {
                    "current_page": page,
                    "per_page": per_page,
                    "total_count": total_count,
                    "total_pages": total_pages
                }
            }
            
            print(f"[DEBUG] Feedback list: found {len(items)} items, total={total_count}")
            return ResponseService.success_response(result)
        except Exception as e:
            current_app.logger.error(f"get_feedback_list error: {str(e)}")
            import traceback
            traceback.print_exc()
            raise APIError("internal server error", 500)

    @staticmethod
    def get_quiz_analytics():
        """get overall quiz analytics (total quizzes, views, attempts, avg score)"""
        try:
            from ..models.quiz_attempt import QuizAttempt
            
            print(f"[DEBUG] get_quiz_analytics called")
            
            total_quizzes = db.session.scalar(
                select(func.count(Quiz.id))
                .where(Quiz.status != 'deleted')
            ) or 0
            
            total_views = db.session.scalar(
                select(func.sum(Quiz.views))
                .where(Quiz.status != 'deleted')
            ) or 0
            
            total_attempts = db.session.scalar(
                select(func.count(QuizAttempt.id))
            ) or 0
            
            avg_score = db.session.scalar(
                select(func.avg(QuizAttempt.score))
            ) or 0.0
            avg_score = round(float(avg_score), 1)
            
            print(f"[DEBUG] Quiz analytics: total_quizzes={total_quizzes}, total_views={total_views}, total_attempts={total_attempts}, avg_score={avg_score}")
            
            return ResponseService.success_response({
                "totalQuizzes": total_quizzes,
                "totalViews": total_views,
                "totalAttempts": total_attempts,
                "avgScore": avg_score
            })
        except Exception as e:
            current_app.logger.error(f"get_quiz_analytics error: {str(e)}")
            import traceback
            traceback.print_exc()
            raise APIError("internal server error", 500)
