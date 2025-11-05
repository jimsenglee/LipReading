"""
analytics service for calculating content interaction and feedback analytics
Following README.txt separation of concerns
"""
from flask import current_app
from sqlalchemy import select, func, and_, or_
from typing import Dict, Any, List
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
            
            print(f"[DEBUG] Content analytics calculated: tutorials={total_tutorials}, views={total_views}, bookmarks={total_bookmarks}, completion={avg_completion}")
            
            return ResponseService.success_response({
                "totalTutorials": total_tutorials,
                "totalViews": total_views,
                "totalBookmarks": total_bookmarks,
                "avgCompletionRate": round(avg_completion, 1)
            })
            
        except Exception as e:
            current_app.logger.error(f"get content analytics error: {str(e)}")
            import traceback
            traceback.print_exc()
            raise APIError("internal server error", 500)

    @staticmethod
    def _calculate_avg_completion_rate():
        """calculate average completion rate for all tutorial series"""
        try:
            # get all series (not individual videos)
            all_series = db.session.scalars(
                select(Tutorial)
                .where(Tutorial.status != 'deleted')
                .where(Tutorial.series_type == 'series')
            ).all()
            
            if not all_series:
                return 0.0
            
            series_completion_rates = []
            
            for series in all_series:
                # get all videos in this series
                series_videos = db.session.scalars(
                    select(Tutorial)
                    .where(Tutorial.parent_series_id == series.id)
                    .where(Tutorial.status != 'deleted')
                ).all()
                
                if not series_videos:
                    continue
                
                # get unique users who have bookmarked this series
                users_who_bookmarked = db.session.scalars(
                    select(user_bookmarks.c.user_id).distinct()
                    .where(user_bookmarks.c.tutorial_id == series.id)
                ).all()
                
                if not users_who_bookmarked:
                    continue
                
                completed_count = 0
                
                for user_id in users_who_bookmarked:
                    # check if user has completed all videos in series
                    videos_completed = db.session.scalar(
                        select(func.count(UserProgress.id))
                        .where(UserProgress.user_id == user_id)
                        .where(UserProgress.series_id == series.id)
                        .where(UserProgress.is_completed == True)
                    ) or 0
                    
                    # user completed series if they completed all videos
                    if videos_completed >= len(series_videos):
                        completed_count += 1
                
                # calculate completion rate for this series
                completion_rate = (completed_count / len(users_who_bookmarked)) * 100
                series_completion_rates.append(completion_rate)
            
            # return average completion rate across all series
            if series_completion_rates:
                return sum(series_completion_rates) / len(series_completion_rates)
            else:
                return 0.0
                
        except Exception as e:
            current_app.logger.error(f"calculate completion rate error: {str(e)}")
            return 0.0

    @staticmethod
    def get_tutorial_popularity():
        """get tutorial popularity data for chart"""
        try:
            print(f"[DEBUG] get_tutorial_popularity called")
            
            # get top tutorials ordered by views
            results = db.session.execute(
                select(Tutorial, Category)
                .join(Category, Tutorial.category_id == Category.id)
                .where(Tutorial.status != 'deleted')
                .where(Tutorial.series_type == 'series')  # only get series, not individual videos
                .order_by(Tutorial.views.desc())
                .limit(10)
            ).all()
            
            popularity_data = []
            
            for row in results:
                tutorial = row[0]
                category = row[1] if len(row) > 1 else None
                
                # get bookmark count for this tutorial
                bookmark_count = db.session.scalar(
                    select(func.count(user_bookmarks.c.tutorial_id))
                    .where(user_bookmarks.c.tutorial_id == tutorial.id)
                ) or 0
                
                popularity_data.append({
                    "id": tutorial.id,
                    "publicId": tutorial.public_id,
                    "title": tutorial.title,
                    "category": category.category_name if category else "Unknown",
                    "views": tutorial.views,
                    "bookmarks": bookmark_count
                })
            
            print(f"[DEBUG] Found {len(popularity_data)} tutorials for popularity chart")
            
            return ResponseService.success_response(popularity_data)
            
        except Exception as e:
            current_app.logger.error(f"get tutorial popularity error: {str(e)}")
            import traceback
            traceback.print_exc()
            raise APIError("internal server error", 500)

    @staticmethod
    def get_tutorial_interaction_details(params: Dict[str, Any] | None = None):
        """get detailed tutorial interaction data for table with pagination and filtering"""
        try:
            print(f"[DEBUG] get_tutorial_interaction_details called with params: {params}")
            
            # build base query
            query = select(Tutorial, Category)
            query = query.join(Category, Tutorial.category_id == Category.id)
            query = query.where(Tutorial.status != 'deleted')
            query = query.where(Tutorial.series_type == 'series')
            
            # apply filters if provided
            if params:
                if params.get('search'):
                    search_term = params['search']
                    query = query.where(
                        or_(
                            Tutorial.title.ilike(f'%{search_term}%'),
                            Category.category_name.ilike(f'%{search_term}%')
                        )
                    )
                
                if params.get('category') and params['category'] != 'all':
                    query = query.where(Category.category_name == params['category'])
            
            # get total count before pagination
            count_query = select(func.count()).select_from(query.subquery())
            total = db.session.scalar(count_query) or 0
            
            # apply sorting
            sort_by = params.get('sort_by', 'views') if params else 'views'
            sort_order = params.get('sort_order', 'desc') if params else 'desc'
            
            if sort_by == 'title':
                sort_column = Tutorial.title
            elif sort_by == 'category':
                sort_column = Category.category_name
            elif sort_by == 'views':
                sort_column = Tutorial.views
            elif sort_by == 'bookmarks':
                # will need to sort after fetching bookmark counts
                sort_column = Tutorial.id
            elif sort_by == 'completion_rate':
                # will need to sort after calculating completion rates
                sort_column = Tutorial.id
            else:
                sort_column = Tutorial.views
            
            if sort_order == 'desc':
                query = query.order_by(sort_column.desc())
            else:
                query = query.order_by(sort_column.asc())
            
            # apply pagination
            page = int(params.get('page', 1)) if params else 1
            per_page = int(params.get('per_page', 10)) if params else 10
            offset = (page - 1) * per_page
            query = query.offset(offset).limit(per_page)
            
            # execute query
            tutorials = db.session.execute(query).all()
            
            interaction_details = []
            
            for row in tutorials:
                tutorial = row[0]
                category = row[1] if len(row) > 1 else None
                
                # get bookmark count
                bookmark_count = db.session.scalar(
                    select(func.count(user_bookmarks.c.tutorial_id))
                    .where(user_bookmarks.c.tutorial_id == tutorial.id)
                ) or 0
                
                # calculate completion rate for this tutorial
                completion_rate = AnalyticsService._calculate_tutorial_completion_rate(tutorial.id)
                
                interaction_details.append({
                    "tutorialId": str(tutorial.id),
                    "title": tutorial.title,
                    "category": category.category_name if category else "Unknown",
                    "views": tutorial.views,
                    "bookmarks": bookmark_count,
                    "completionRate": round(completion_rate, 1)
                })
            
            # sort by bookmarks or completion_rate if needed (client-side for these)
            if sort_by == 'bookmarks':
                interaction_details.sort(key=lambda x: x['bookmarks'], reverse=(sort_order == 'desc'))
            elif sort_by == 'completion_rate':
                interaction_details.sort(key=lambda x: x['completionRate'], reverse=(sort_order == 'desc'))
            
            pagination = ResponseService.pagination_info(page, per_page, total)
            print(f"[DEBUG] Found {len(interaction_details)} tutorials for interaction table (page {page})")
            
            return ResponseService.success_response(interaction_details, pagination=pagination)
            
        except Exception as e:
            current_app.logger.error(f"get tutorial interaction details error: {str(e)}")
            import traceback
            traceback.print_exc()
            raise APIError("internal server error", 500)

    @staticmethod
    def _calculate_tutorial_completion_rate(tutorial_id: int):
        """calculate completion rate for a specific tutorial series"""
        try:
            # get all videos in this series
            series_videos = db.session.scalars(
                select(Tutorial)
                .where(Tutorial.parent_series_id == tutorial_id)
                .where(Tutorial.status != 'deleted')
            ).all()
            
            if not series_videos:
                return 0.0
            
            # get unique users who have bookmarked this series
            users_who_bookmarked = db.session.scalars(
                select(user_bookmarks.c.user_id).distinct()
                .where(user_bookmarks.c.tutorial_id == tutorial_id)
            ).all()
            
            if not users_who_bookmarked:
                return 0.0
            
            completed_count = 0
            
            for user_id in users_who_bookmarked:
                # check if user has completed all videos in series
                videos_completed = db.session.scalar(
                    select(func.count(UserProgress.id))
                    .where(UserProgress.user_id == user_id)
                    .where(UserProgress.series_id == tutorial_id)
                    .where(UserProgress.is_completed == True)
                ) or 0
                
                # user completed series if they completed all videos
                if videos_completed >= len(series_videos):
                    completed_count += 1
            
            # calculate completion rate
            return (completed_count / len(users_who_bookmarked)) * 100
            
        except Exception as e:
            current_app.logger.error(f"calculate tutorial completion rate error: {str(e)}")
            return 0.0

    @staticmethod
    def get_feedback_analytics():
        """get feedback management analytics"""
        try:
            print(f"[DEBUG] get_feedback_analytics called")
            
            # get total feedback count
            total_feedback = db.session.scalar(
                select(func.count(Feedback.id))
            ) or 0
            
            # get new items count (status = 'New')
            new_items = db.session.scalar(
                select(func.count(Feedback.id))
                .where(Feedback.status == 'New')
            ) or 0
            
            # get in progress count (status = 'In Progress')
            in_progress = db.session.scalar(
                select(func.count(Feedback.id))
                .where(Feedback.status == 'In Progress')
            ) or 0
            
            # get resolved count (status = 'Resolved')
            resolved = db.session.scalar(
                select(func.count(Feedback.id))
                .where(Feedback.status == 'Resolved')
            ) or 0
            
            print(f"[DEBUG] Feedback analytics calculated: total={total_feedback}, new={new_items}, in_progress={in_progress}, resolved={resolved}")
            
            return ResponseService.success_response({
                "totalFeedback": total_feedback,
                "newItems": new_items,
                "inProgress": in_progress,
                "resolved": resolved
            })
            
        except Exception as e:
            current_app.logger.error(f"get feedback analytics error: {str(e)}")
            import traceback
            traceback.print_exc()
            raise APIError("internal server error", 500)

    @staticmethod
    def get_feedback_distributions():
        """get feedback distribution data for charts"""
        try:
            print(f"[DEBUG] get_feedback_distributions called")
            
            # get distribution by status
            status_dist = db.session.execute(
                select(Feedback.status, func.count(Feedback.id))
                .group_by(Feedback.status)
            ).all()
            
            status_data = []
            status_colors = {
                'New': '#3B82F6',
                'In Progress': '#F59E0B',
                'Resolved': '#10B981',
                'Closed': '#6B7280'
            }
            
            for status, count in status_dist:
                status_data.append({
                    "name": status,
                    "value": count,
                    "color": status_colors.get(status, '#6B7280')
                })
            
            # get distribution by type
            type_dist = db.session.execute(
                select(Feedback.feedback_type, func.count(Feedback.id))
                .group_by(Feedback.feedback_type)
            ).all()
            
            type_data = []
            type_colors = {
                'bug': '#EF4444',
                'feature': '#3B82F6',
                'general': '#10B981'
            }
            
            for feedback_type, count in type_dist:
                # map database type to display name
                type_display_map = {
                    'bug': 'Bug Reports',
                    'feature': 'Feature Requests',
                    'general': 'General Feedback'
                }
                display_name = type_display_map.get(feedback_type, feedback_type.title())
                
                type_data.append({
                    "type": display_name,
                    "count": count,
                    "color": type_colors.get(feedback_type, '#6B7280')
                })
            
            print(f"[DEBUG] Feedback distributions calculated: status={len(status_data)}, type={len(type_data)}")
            
            return ResponseService.success_response({
                "byStatus": status_data,
                "byType": type_data
            })
            
        except Exception as e:
            current_app.logger.error(f"get feedback distributions error: {str(e)}")
            import traceback
            traceback.print_exc()
            raise APIError("internal server error", 500)

    @staticmethod
    def get_feedback_list(params: Dict[str, Any] | None = None):
        """get paginated and filtered feedback list for admin"""
        try:
            print(f"[DEBUG] get_feedback_list called with params: {params}")
            
            # build base query
            query = select(Feedback, Account)
            query = query.join(Account, Feedback.submitted_by_user_id == Account.id)
            
            # apply filters if provided
            if params:
                if params.get('search'):
                    search_term = params['search']
                    query = query.where(
                        or_(
                            Feedback.feedback_type.ilike(f'%{search_term}%'),
                            Feedback.description.ilike(f'%{search_term}%')
                        )
                    )
                
                if params.get('status') and params['status'] != 'all':
                    query = query.where(Feedback.status == params['status'])
                
                if params.get('feedback_type') and params['feedback_type'] != 'all':
                    query = query.where(Feedback.feedback_type == params['feedback_type'])
            
            # get total count
            count_query = select(func.count()).select_from(query.subquery())
            total = db.session.scalar(count_query) or 0
            
            # apply sorting
            sort_by = params.get('sort_by', 'submission_date') if params else 'submission_date'
            sort_order = params.get('sort_order', 'desc') if params else 'desc'
            
            if sort_by == 'id':
                sort_column = Feedback.id
            elif sort_by == 'submission_date':
                sort_column = Feedback.submission_date
            elif sort_by == 'status':
                sort_column = Feedback.status
            elif sort_by == 'feedback_type':
                sort_column = Feedback.feedback_type
            else:
                sort_column = Feedback.submission_date
            
            if sort_order == 'desc':
                query = query.order_by(sort_column.desc())
            else:
                query = query.order_by(sort_column.asc())
            
            # apply pagination
            page = int(params.get('page', 1)) if params else 1
            per_page = int(params.get('per_page', 10)) if params else 10
            offset = (page - 1) * per_page
            query = query.offset(offset).limit(per_page)
            
            # execute query
            results = db.session.execute(query).all()
            
            feedback_list = []
            for row in results:
                feedback = row[0]
                account = row[1] if len(row) > 1 else None
                
                # extract a title from description (first 50 chars)
                title = feedback.description[:50] if feedback.description else feedback.feedback_type
                
                feedback_list.append({
                    'id': str(feedback.id),
                    'userId': str(feedback.submitted_by_user_id),
                    'userName': account.name if account else 'Unknown',
                    'email': account.email if account else 'Unknown',
                    'type': feedback.feedback_type,
                    'category': 'General',  # feedback doesn't have category
                    'title': title,
                    'description': feedback.description,
                    'status': feedback.status,
                    'submittedAt': feedback.submission_date.isoformat() if feedback.submission_date else None,
                    'updatedAt': feedback.updated_at.isoformat() if feedback.updated_at else None,
                    'attachments': [feedback.attached_file_path] if feedback.attached_file_path else None,
                    'adminNotes': feedback.admin_response
                })
            
            pagination = ResponseService.pagination_info(page, per_page, total)
            return ResponseService.success_response(feedback_list, pagination=pagination)
            
        except Exception as e:
            current_app.logger.error(f"get feedback list error: {str(e)}")
            import traceback
            traceback.print_exc()
            raise APIError("internal server error", 500)

    @staticmethod
    def get_quiz_analytics():
        """get quiz analytics similar to tutorial analytics"""
        try:
            print(f"[DEBUG] get_quiz_analytics called")
            
            # get total quiz series count
            total_quizzes = db.session.scalar(
                select(func.count(Quiz.id))
                .where(Quiz.status != 'deleted')
                .where(Quiz.series_type == 'series')
            ) or 0
            
            # get total views
            total_views = db.session.scalar(
                select(func.sum(Quiz.views))
                .where(Quiz.status != 'deleted')
                .where(Quiz.series_type == 'series')
            ) or 0
            
            # get total quiz attempts
            from ..models.quiz_attempt import QuizAttempt
            total_attempts = db.session.scalar(
                select(func.count(QuizAttempt.id))
            ) or 0
            
            # get average quiz score
            avg_score = db.session.scalar(
                select(func.avg(QuizAttempt.score))
            ) or 0.0
            
            print(f"[DEBUG] Quiz analytics calculated: quizzes={total_quizzes}, views={total_views}, attempts={total_attempts}, avg_score={avg_score}")
            
            return ResponseService.success_response({
                "totalQuizzes": total_quizzes,
                "totalViews": total_views,
                "totalAttempts": total_attempts,
                "avgScore": round(avg_score, 1)
            })
            
        except Exception as e:
            current_app.logger.error(f"get quiz analytics error: {str(e)}")
            import traceback
            traceback.print_exc()
            raise APIError("internal server error", 500)

