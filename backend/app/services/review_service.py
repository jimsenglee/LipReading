"""
review system service for managing user reviews and ratings
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
from ..models.feedback import Feedback
from ..models.review import Review
from ..schemas.review_schemas import ReviewSubmissionSchema, ReviewQuerySchema, ReviewModerationSchema
from .error_service import APIError
from .response_service import ResponseService
from ..utils.id_generator import generate_public_id


class ReviewService:
    """service for managing user reviews and ratings for tutorials and quizzes"""

    @staticmethod
    def submit_tutorial_review(user_id: int, tutorial_id: int, review_data: Dict[str, Any]):
        """submit a review for a tutorial"""
        try:
            # validate input data
            schema = ReviewSubmissionSchema()
            try:
                validated_data = schema.load(review_data)
                if not isinstance(validated_data, dict):
                    raise APIError("invalid review data", 400)
            except Exception:
                raise APIError("invalid review data", 400)
            
            # check if tutorial exists
            tutorial_obj = db.session.scalar(
                select(Tutorial).where(Tutorial.id == tutorial_id)
                .where(Tutorial.status != 'deleted')
            )
            
            if not tutorial_obj:
                raise APIError("tutorial not found", 404)
            
            # determine if this is a series or video
            series_id = tutorial_id
            if tutorial_obj.series_type != 'series':
                # this is a video, get its parent series
                series_id = tutorial_obj.parent_series_id
                if not series_id:
                    raise APIError("tutorial must be part of a series", 400)
            
            # check if user has bookmarked/enrolled in series
            bookmark = db.session.scalar(
                select(user_bookmarks).where(
                    user_bookmarks.c.user_id == user_id,
                    user_bookmarks.c.tutorial_id == series_id
                )
            )
            
            if not bookmark:
                raise APIError("must be enrolled in tutorial series to submit review", 403)
            
            # check if series is completed (all videos must be completed)
            if tutorial_obj.series_type == 'series':
                # get all videos in series
                all_videos = db.session.scalars(
                    select(Tutorial.id).where(
                        Tutorial.parent_series_id == series_id
                    ).where(Tutorial.status != 'deleted')
                ).all()
                
                if all_videos:
                    # get all completed videos from UserProgress
                    completed_videos = db.session.scalars(
                        select(UserProgress.tutorial_id).where(
                            UserProgress.user_id == user_id,
                            UserProgress.series_id == series_id,
                            UserProgress.is_completed == True
                        )
                    ).all()
                    
                    # check if all videos are completed
                    if len(completed_videos) < len(all_videos):
                        raise APIError("must complete all videos in series before submitting review", 403)
            else:
                # for individual videos (shouldn't happen, but handle it)
                # check if this specific video is completed
                video_progress = db.session.scalar(
                    select(UserProgress).where(
                        UserProgress.user_id == user_id,
                        UserProgress.tutorial_id == tutorial_id,
                        UserProgress.is_completed == True
                    )
                )
                
                if not video_progress:
                    raise APIError("must complete the video before submitting review", 403)
            
            # validate rating
            rating = validated_data.get('rating')
            if not rating or not (1 <= rating <= 5):
                raise APIError("rating must be between 1 and 5", 400)
            
            # check if review already exists (use series_id for reviews on series)
            existing_review = db.session.scalar(
                select(Review).where(
                    Review.user_id == user_id,
                    Review.target_type == 'tutorial',
                    Review.target_id == series_id  # reviews are for series, not individual videos
                )
            )
            
            if existing_review:
                # update existing review
                existing_review.rating = rating
                existing_review.review_text = validated_data.get('review_text')
                existing_review.updated_at = datetime.utcnow()
            else:
                # create new review (reviews are for series, not individual videos)
                public_id = generate_public_id(Review, "REV")
                review = Review()
                review.public_id = public_id
                review.user_id = user_id
                review.target_type = 'tutorial'
                review.target_id = series_id  # reviews are for series
                review.rating = rating
                review.review_text = validated_data.get('review_text')
                db.session.add(review)
            
            db.session.commit()
            
            return ResponseService.success_response({
                "message": "review submitted successfully",
                "tutorialId": series_id,  # return series_id for consistency
                "rating": rating,
                "reviewText": validated_data.get('review_text', '')
            })
            
        except APIError:
            raise
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"submit tutorial review error: {str(e)}")
            raise APIError("internal server error", 500)

    @staticmethod
    def submit_quiz_review(user_id: int, quiz_id: int, review_data: Dict[str, Any]):
        """submit a review for a quiz"""
        try:
            # validate input data
            schema = ReviewSubmissionSchema()
            try:
                validated_data = schema.load(review_data)
                if not isinstance(validated_data, dict):
                    raise APIError("invalid review data", 400)
            except Exception:
                raise APIError("invalid review data", 400)
            
            # check if quiz exists
            quiz = db.session.scalar(
                select(Quiz).where(Quiz.id == quiz_id)
                .where(Quiz.status != 'deleted')
            )
            if not quiz:
                raise APIError("quiz not found", 404)
            
            # check if user has attempted the quiz
            attempt = db.session.scalar(
                select(QuizAttempt).where(
                    QuizAttempt.user_id == user_id,
                    QuizAttempt.quiz_id == quiz_id
                )
            )
            
            if not attempt:
                raise APIError("must complete quiz to submit review", 403)
            
            # validate rating
            rating = validated_data.get('rating')
            if not rating or not (1 <= rating <= 5):
                raise APIError("rating must be between 1 and 5", 400)
            
            # check if review already exists
            existing_review = db.session.scalar(
                select(Review).where(
                    Review.user_id == user_id,
                    Review.target_type == 'quiz',
                    Review.target_id == quiz_id
                )
            )
            
            if existing_review:
                # update existing review
                existing_review.rating = rating
                existing_review.review_text = validated_data.get('review_text')
                existing_review.updated_at = datetime.utcnow()
            else:
                # create new review
                public_id = generate_public_id(Review, "REV")
                review = Review()
                review.public_id = public_id
                review.user_id = user_id
                review.target_type = 'quiz'
                review.target_id = quiz_id
                review.rating = rating
                review.review_text = validated_data.get('review_text')
                db.session.add(review)
            
            db.session.commit()
            
            return ResponseService.success_response({
                "message": "quiz review submitted successfully",
                "quizId": quiz_id,
                "rating": rating,
                "reviewText": validated_data.get('review_text', '')
            })
            
        except APIError:
            raise
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"submit quiz review error: {str(e)}")
            raise APIError("internal server error", 500)

    @staticmethod
    def get_tutorial_reviews(tutorial_id: int, params: Dict[str, Any] | None = None):
        """get all reviews for a tutorial with filtering and pagination"""
        try:
            current_app.logger.debug(f"[ReviewService] get_tutorial_reviews called with tutorial_id={tutorial_id}, params={params}")
            # validate query parameters
            if params:
                schema = ReviewQuerySchema()
                try:
                    validated_params = schema.load(params)
                    if not isinstance(validated_params, dict):
                        validated_params = {}
                except Exception:
                    validated_params = {}
            else:
                validated_params = {}
            
            # build base query using Review model
            reviews_query = select(Review, Account, Tutorial).join(
                Account, Review.user_id == Account.id
            ).join(
                Tutorial, (Review.target_type == 'tutorial') & (Review.target_id == Tutorial.id)
            ).where(
                Review.target_type == 'tutorial',
                Review.target_id == tutorial_id
            )
            
            # apply filters
            if validated_params.get('rating_min'):
                reviews_query = reviews_query.where(Review.rating >= validated_params['rating_min'])
            
            if validated_params.get('rating_max'):
                reviews_query = reviews_query.where(Review.rating <= validated_params['rating_max'])
            
            if validated_params.get('has_text'):
                if validated_params['has_text']:
                    reviews_query = reviews_query.where(Review.review_text.isnot(None))
                    reviews_query = reviews_query.where(Review.review_text != '')
            
            # apply sorting
            sort_by = validated_params.get('sort_by', 'created_at')
            sort_order = validated_params.get('sort_order', 'desc')
            
            if sort_by == 'rating':
                sort_column = Review.rating
            elif sort_by == 'created_at':
                sort_column = Review.created_at
            else:
                sort_column = Review.created_at
            
            if sort_order.lower() == 'desc':
                reviews_query = reviews_query.order_by(sort_column.desc())
            else:
                reviews_query = reviews_query.order_by(sort_column.asc())
            
            # get total count
            count_query = select(func.count()).select_from(reviews_query.subquery())
            total = db.session.scalar(count_query)
            
            # apply pagination
            page = validated_params.get('page', 1)
            per_page = validated_params.get('per_page', 10)
            offset = (page - 1) * per_page
            reviews_query = reviews_query.offset(offset).limit(per_page)
            
            # execute query
            results = db.session.execute(reviews_query).all()
            current_app.logger.debug(f"[ReviewService] Found {len(results)} reviews for tutorial_id={tutorial_id}")
            
            review_list = []
            for review, account, tutorial in results:
                current_app.logger.debug(f"[ReviewService] Processing review id={review.id}, user={account.name}, rating={review.rating}")
                review_list.append({
                    'id': review.id,
                    'userId': review.user_id,
                    'userName': account.name,
                    'userEmail': account.email,
                    'tutorialId': tutorial_id,
                    'tutorialTitle': tutorial.title,
                    'rating': review.rating,
                    'reviewText': review.review_text,
                    'reviewedAt': review.created_at.isoformat() if review.created_at else None,
                    'isVerified': True,
                    # include admin response fields
                    'adminResponse': review.admin_response,
                    'adminRespondedAt': review.admin_responded_at.isoformat() if review.admin_responded_at else None,
                    'reviewedByAdminId': review.reviewed_by_admin_id
                })
            
            # calculate average rating and total reviews
            avg_rating = db.session.scalar(
                select(func.avg(Review.rating))
                .where(Review.target_type == 'tutorial')
                .where(Review.target_id == tutorial_id)
            )
            
            total_reviews = db.session.scalar(
                select(func.count())
                .where(Review.target_type == 'tutorial')
                .where(Review.target_id == tutorial_id)
            )
            
            current_app.logger.debug(f"[ReviewService] Final stats: avg_rating={avg_rating}, total_reviews={total_reviews}, review_list_count={len(review_list)}")
            
            pagination = ResponseService.pagination_info(page, per_page, total or 0)
            result = ResponseService.success_response(
                {
                    'reviews': review_list,
                    'averageRating': round(float(avg_rating), 2) if avg_rating else 0.0,
                    'totalReviews': total_reviews or 0
                },
                pagination=pagination
            )
            current_app.logger.debug(f"[ReviewService] Returning response with {len(review_list)} reviews")
            return result
            
        except Exception as e:
            current_app.logger.error(f"get tutorial reviews error: {str(e)}")
            raise APIError("internal server error", 500)

    @staticmethod
    def get_quiz_reviews(quiz_id: int, params: Dict[str, Any] | None = None):
        """get all reviews for a quiz with filtering and pagination"""
        try:
            # validate query parameters
            if params:
                schema = ReviewQuerySchema()
                try:
                    validated_params = schema.load(params)
                    if not isinstance(validated_params, dict):
                        validated_params = {}
                except Exception:
                    validated_params = {}
            else:
                validated_params = {}
            
            # build base query using Review model
            reviews_query = select(Review, Account, Quiz).join(
                Account, Review.user_id == Account.id
            ).join(
                Quiz, (Review.target_type == 'quiz') & (Review.target_id == Quiz.id)
            ).where(
                Review.target_type == 'quiz',
                Review.target_id == quiz_id
            )
            
            # apply filters
            if validated_params.get('rating_min'):
                reviews_query = reviews_query.where(Review.rating >= validated_params['rating_min'])
            
            if validated_params.get('rating_max'):
                reviews_query = reviews_query.where(Review.rating <= validated_params['rating_max'])
            
            if validated_params.get('has_text'):
                if validated_params['has_text']:
                    reviews_query = reviews_query.where(Review.review_text.isnot(None))
                    reviews_query = reviews_query.where(Review.review_text != '')
            
            # apply sorting
            sort_by = validated_params.get('sort_by', 'created_at')
            sort_order = validated_params.get('sort_order', 'desc')
            
            if sort_by == 'rating':
                sort_column = Review.rating
            elif sort_by == 'created_at':
                sort_column = Review.created_at
            else:
                sort_column = Review.created_at
            
            if sort_order.lower() == 'desc':
                reviews_query = reviews_query.order_by(sort_column.desc())
            else:
                reviews_query = reviews_query.order_by(sort_column.asc())
            
            # get total count
            count_query = select(func.count()).select_from(reviews_query.subquery())
            total = db.session.scalar(count_query)
            
            # apply pagination
            page = validated_params.get('page', 1)
            per_page = validated_params.get('per_page', 10)
            offset = (page - 1) * per_page
            reviews_query = reviews_query.offset(offset).limit(per_page)
            
            # execute query
            results = db.session.execute(reviews_query).all()
            
            review_list = []
            for review, account, quiz in results:
                review_list.append({
                    'id': review.id,
                    'userId': review.user_id,
                    'userName': account.name,
                    'userEmail': account.email,
                    'quizId': quiz_id,
                    'quizTitle': quiz.title,
                    'rating': review.rating,
                    'reviewText': review.review_text,
                    'reviewedAt': review.created_at.isoformat() if review.created_at else None,
                    'isVerified': True,
                    # include admin response fields
                    'adminResponse': review.admin_response,
                    'adminRespondedAt': review.admin_responded_at.isoformat() if review.admin_responded_at else None,
                    'reviewedByAdminId': review.reviewed_by_admin_id
                })
            
            # calculate average rating and total reviews
            avg_rating = db.session.scalar(
                select(func.avg(Review.rating))
                .where(Review.target_type == 'quiz')
                .where(Review.target_id == quiz_id)
            )
            
            total_reviews = db.session.scalar(
                select(func.count())
                .where(Review.target_type == 'quiz')
                .where(Review.target_id == quiz_id)
            )
            
            pagination = ResponseService.pagination_info(page, per_page, total or 0)
            return ResponseService.success_response(
                {
                    'reviews': review_list,
                    'averageRating': round(float(avg_rating), 2) if avg_rating else 0.0,
                    'totalReviews': total_reviews or 0
                },
                pagination=pagination
            )
            
        except Exception as e:
            current_app.logger.error(f"get quiz reviews error: {str(e)}")
            raise APIError("internal server error", 500)

    @staticmethod
    def get_user_review(user_id: int, tutorial_id: int):
        """get user's review for a specific tutorial"""
        try:
            review = db.session.scalar(
                select(Review).where(
                    Review.user_id == user_id,
                    Review.target_type == 'tutorial',
                    Review.target_id == tutorial_id
                )
            )
            
            if not review:
                return ResponseService.success_response({
                    'hasReview': False,
                    'rating': None,
                    'reviewText': None,
                    'reviewedAt': None
                })
            
            return ResponseService.success_response({
                'hasReview': True,
                'rating': review.rating,
                'reviewText': review.review_text,
                'reviewedAt': review.created_at.isoformat() if review.created_at else None
            })
            
        except Exception as e:
            current_app.logger.error(f"get user review error: {str(e)}")
            raise APIError("internal server error", 500)

    @staticmethod
    def update_review(user_id: int, tutorial_id: int, review_data: Dict[str, Any]):
        """update user's existing review"""
        try:
            # validate input data
            schema = ReviewSubmissionSchema()
            try:
                validated_data = schema.load(review_data)
                if not isinstance(validated_data, dict):
                    raise APIError("invalid review data", 400)
            except Exception:
                raise APIError("invalid review data", 400)
            
            # check if review exists
            review = db.session.scalar(
                select(Review).where(
                    Review.user_id == user_id,
                    Review.target_type == 'tutorial',
                    Review.target_id == tutorial_id
                )
            )
            
            if not review:
                raise APIError("review not found", 404)
            
            # validate rating
            rating = validated_data.get('rating')
            if not rating or not (1 <= rating <= 5):
                raise APIError("rating must be between 1 and 5", 400)
            
            # update review data
            review.rating = rating
            review.review_text = validated_data.get('review_text')
            review.updated_at = datetime.utcnow()
            
            db.session.commit()
            
            return ResponseService.success_response({
                "message": "review updated successfully",
                "tutorialId": tutorial_id,
                "rating": rating,
                "reviewText": validated_data.get('review_text', '')
            })
            
        except APIError:
            raise
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"update review error: {str(e)}")
            raise APIError("internal server error", 500)

    @staticmethod
    def delete_review(user_id: int, tutorial_id: int):
        """delete user's review"""
        try:
            # check if review exists
            review = db.session.scalar(
                select(Review).where(
                    Review.user_id == user_id,
                    Review.target_type == 'tutorial',
                    Review.target_id == tutorial_id
                )
            )
            
            if not review:
                raise APIError("review not found", 404)
            
            # delete the review
            db.session.delete(review)
            db.session.commit()
            
            return ResponseService.success_response({
                "message": "review deleted successfully",
                "tutorialId": tutorial_id
            })
            
        except APIError:
            raise
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"delete review error: {str(e)}")
            raise APIError("internal server error", 500)

    @staticmethod
    def get_review_statistics(tutorial_id: int | None = None):
        """get review statistics for tutorials or specific tutorial"""
        try:
            if tutorial_id:
                # get statistics for specific tutorial
                total_reviews = db.session.scalar(
                    select(func.count())
                    .where(Review.target_type == 'tutorial')
                    .where(Review.target_id == tutorial_id)
                )
                
                avg_rating = db.session.scalar(
                    select(func.avg(Review.rating))
                    .where(Review.target_type == 'tutorial')
                    .where(Review.target_id == tutorial_id)
                )
                
                # get rating distribution
                rating_dist = {}
                for rating in range(1, 6):
                    count = db.session.scalar(
                        select(func.count())
                        .where(Review.target_type == 'tutorial')
                        .where(Review.target_id == tutorial_id)
                        .where(Review.rating == rating)
                    )
                    rating_dist[f'{rating}_star'] = count or 0
                
                return ResponseService.success_response({
                    'tutorialId': tutorial_id,
                    'totalReviews': total_reviews or 0,
                    'averageRating': round(float(avg_rating), 2) if avg_rating else 0.0,
                    'ratingDistribution': rating_dist
                })
            else:
                # get overall statistics
                total_reviews = db.session.scalar(
                    select(func.count())
                    .where(Review.target_type == 'tutorial')
                )
                
                avg_rating = db.session.scalar(
                    select(func.avg(Review.rating))
                    .where(Review.target_type == 'tutorial')
                )
                
                # get reviews by tutorial
                tutorial_stats = db.session.execute(
                    select(
                        Review.target_id,
                        Tutorial.title,
                        func.count().label('review_count'),
                        func.avg(Review.rating).label('avg_rating')
                    ).join(
                        Tutorial, (Review.target_type == 'tutorial') & (Review.target_id == Tutorial.id)
                    ).where(
                        Review.target_type == 'tutorial'
                    ).group_by(
                        Review.target_id, Tutorial.title
                    ).order_by(func.count().desc())
                ).all()
                
                tutorial_list = []
                for t_id, title, count, avg in tutorial_stats:
                    tutorial_list.append({
                        'tutorialId': t_id,
                        'tutorialTitle': title,
                        'reviewCount': count,
                        'averageRating': round(float(avg), 2) if avg else 0.0
                    })
                
                return ResponseService.success_response({
                    'totalReviews': total_reviews or 0,
                    'averageRating': round(float(avg_rating), 2) if avg_rating else 0.0,
                    'tutorialStats': tutorial_list
                })
            
        except Exception as e:
            current_app.logger.error(f"get review statistics error: {str(e)}")
            raise APIError("internal server error", 500)

    @staticmethod
    def submit_admin_response(admin_id: int, review_id: int, response_data: Dict[str, Any]):
        """submit or update admin response to a review"""
        try:
            # validate input data
            admin_response = response_data.get('admin_response', '').strip()
            if not admin_response:
                raise APIError("admin response is required", 400)
            
            if len(admin_response) > 5000:
                raise APIError("admin response must be 5000 characters or less", 400)
            
            # get review
            review = db.session.scalar(
                select(Review).where(Review.id == review_id)
            )
            
            if not review:
                raise APIError("review not found", 404)
            
            # update admin response fields
            review.admin_response = admin_response
            review.admin_responded_at = datetime.utcnow()
            review.reviewed_by_admin_id = admin_id
            
            db.session.commit()
            
            return ResponseService.success_response({
                "message": "admin response submitted successfully",
                "reviewId": review_id,
                "adminResponse": admin_response
            })
            
        except APIError:
            raise
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"submit admin response error: {str(e)}")
            import traceback
            traceback.print_exc()
            raise APIError("internal server error", 500)

    @staticmethod
    def moderate_review(review_id: int, moderation_data: Dict[str, Any]):
        """moderate a review (admin only)"""
        try:
            # validate input data
            schema = ReviewModerationSchema()
            try:
                validated_data = schema.load(moderation_data)
                if not isinstance(validated_data, dict):
                    raise APIError("invalid moderation data", 400)
            except Exception:
                raise APIError("invalid moderation data", 400)
            
            # for now, reviews are auto-approved
            # in a real implementation, you'd have a moderation system
            return ResponseService.success_response({
                "message": "review moderation not implemented yet",
                "reviewId": review_id
            })
            
        except Exception as e:
            current_app.logger.error(f"moderate review error: {str(e)}")
            raise APIError("internal server error", 500)

    @staticmethod
    def search_reviews(search_term: str, params: Dict[str, Any] | None = None):
        """search reviews with advanced filtering"""
        try:
            if not search_term:
                raise APIError("search term is required", 400)
            
            # validate query parameters
            if params:
                schema = ReviewQuerySchema()
                try:
                    validated_params = schema.load(params)
                    if not isinstance(validated_params, dict):
                        validated_params = {}
                except Exception:
                    validated_params = {}
            else:
                validated_params = {}
            
            # build search query
            search_query = select(Review, Account, Tutorial).join(
                Account, Review.user_id == Account.id
            ).join(
                Tutorial, (Review.target_type == 'tutorial') & (Review.target_id == Tutorial.id)
            ).where(
                Review.target_type == 'tutorial',
                or_(
                    Review.review_text.ilike(f'%{search_term}%'),
                    Tutorial.title.ilike(f'%{search_term}%'),
                    Account.name.ilike(f'%{search_term}%')
                )
            )
            
            # apply additional filters
            if validated_params.get('rating_min'):
                search_query = search_query.where(Review.rating >= validated_params['rating_min'])
            
            if validated_params.get('rating_max'):
                search_query = search_query.where(Review.rating <= validated_params['rating_max'])
            
            if validated_params.get('tutorial_id'):
                search_query = search_query.where(Review.target_id == validated_params['tutorial_id'])
            
            # apply sorting
            sort_by = validated_params.get('sort_by', 'created_at')
            sort_order = validated_params.get('sort_order', 'desc')
            
            if sort_by == 'rating':
                sort_column = Review.rating
            elif sort_by == 'created_at':
                sort_column = Review.created_at
            else:
                sort_column = Review.created_at
            
            if sort_order.lower() == 'desc':
                search_query = search_query.order_by(sort_column.desc())
            else:
                search_query = search_query.order_by(sort_column.asc())
            
            # get total count
            count_query = select(func.count()).select_from(search_query.subquery())
            total = db.session.scalar(count_query)
            
            # apply pagination
            page = validated_params.get('page', 1)
            per_page = validated_params.get('per_page', 10)
            offset = (page - 1) * per_page
            search_query = search_query.offset(offset).limit(per_page)
            
            # execute query
            results = db.session.execute(search_query).all()
            
            review_list = []
            for review, account, tutorial in results:
                review_list.append({
                    'id': review.id,
                    'userId': review.user_id,
                    'userName': account.name,
                    'userEmail': account.email,
                    'tutorialId': review.target_id,
                    'tutorialTitle': tutorial.title,
                    'rating': review.rating,
                    'reviewText': review.review_text,
                    'reviewedAt': review.created_at.isoformat() if review.created_at else None,
                    'isVerified': True,
                })
            
            pagination = ResponseService.pagination_info(page, per_page, total or 0)
            return ResponseService.success_response({
                'reviews': review_list,
                'pagination': pagination
            })
            
        except APIError:
            raise
        except Exception as e:
            current_app.logger.error(f"search reviews error: {str(e)}")
            raise APIError("internal server error", 500)
