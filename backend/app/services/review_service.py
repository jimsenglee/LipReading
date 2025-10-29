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
from ..models.tutorial import Tutorial
from ..models.quiz import Quiz
from ..models.quiz_attempt import QuizAttempt
from ..models.account import Account
from ..models.category import Category
from ..models.feedback import Feedback
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
            
            # check if user has bookmarked/enrolled in tutorial
            bookmark = db.session.scalar(
                select(user_bookmarks).where(
                    user_bookmarks.c.user_id == user_id,
                    user_bookmarks.c.tutorial_id == tutorial_id
                )
            )
            
            if not bookmark:
                raise APIError("must be enrolled in tutorial to submit review", 403)
            
            # validate rating
            rating = validated_data.get('rating')
            if not rating or not (1 <= rating <= 5):
                raise APIError("rating must be between 1 and 5", 400)
            
            # update review data in bookmark
            update_data = {
                'rating': rating,
                'review_text': validated_data.get('review_text', ''),
                'reviewed_at': datetime.utcnow(),
                'last_accessed_at': datetime.utcnow()
            }
            
            db.session.execute(
                update(user_bookmarks).where(
                    user_bookmarks.c.user_id == user_id,
                    user_bookmarks.c.tutorial_id == tutorial_id
                ).values(**update_data)
            )
            
            # update tutorial average rating
            ReviewService._update_tutorial_rating(tutorial_id)
            
            db.session.commit()
            
            return ResponseService.success_response({
                "message": "review submitted successfully",
                "tutorialId": tutorial_id,
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
            
            # for quiz reviews, we'll use the feedback table
            feedback_public_id = generate_public_id(Feedback, "REV")
            
            feedback = Feedback()
            feedback.public_id = feedback_public_id
            feedback.submitted_by_user_id = user_id
            feedback.feedback_type = 'quiz_review'
            feedback.description = f"Rating: {rating}/5\nReview: {validated_data.get('review_text', '')}"
            feedback.submission_date = datetime.utcnow()
            feedback.status = 'approved'  # auto-approve quiz reviews
            
            db.session.add(feedback)
            
            # update quiz average rating
            ReviewService._update_quiz_rating(quiz_id)
            
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
            
            # build base query
            reviews_query = select(user_bookmarks, Account, Tutorial).join(
                Account, user_bookmarks.c.user_id == Account.id
            ).join(
                Tutorial, user_bookmarks.c.tutorial_id == Tutorial.id
            ).where(
                and_(
                    user_bookmarks.c.tutorial_id == tutorial_id,
                    user_bookmarks.c.rating.isnot(None)
                )
            )
            
            # apply filters
            if validated_params.get('rating_min'):
                reviews_query = reviews_query.where(user_bookmarks.c.rating >= validated_params['rating_min'])
            
            if validated_params.get('rating_max'):
                reviews_query = reviews_query.where(user_bookmarks.c.rating <= validated_params['rating_max'])
            
            if validated_params.get('has_text'):
                if validated_params['has_text']:
                    reviews_query = reviews_query.where(user_bookmarks.c.review_text.isnot(None))
                    reviews_query = reviews_query.where(user_bookmarks.c.review_text != '')
            
            # apply sorting
            sort_by = validated_params.get('sort_by', 'reviewed_at')
            sort_order = validated_params.get('sort_order', 'desc')
            
            if sort_by == 'rating':
                sort_column = user_bookmarks.c.rating
            elif sort_by == 'reviewed_at':
                sort_column = user_bookmarks.c.reviewed_at
            else:
                sort_column = user_bookmarks.c.reviewed_at
            
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
            for bookmark, account, tutorial in results:
                review_list.append({
                    'id': bookmark.user_id,  # using user_id as unique identifier
                    'userId': bookmark.user_id,
                    'userName': account.name,
                    'userEmail': account.email,
                    'tutorialId': tutorial_id,
                    'tutorialTitle': tutorial.title,
                    'rating': bookmark.rating,
                    'reviewText': bookmark.review_text,
                    'reviewedAt': bookmark.reviewed_at.isoformat() if bookmark.reviewed_at else None,
                    'isVerified': True,  # all reviews are verified since they require enrollment
                })
            
            # calculate average rating and total reviews
            avg_rating = db.session.scalar(
                select(func.avg(user_bookmarks.c.rating))
                .where(
                    and_(
                        user_bookmarks.c.tutorial_id == tutorial_id,
                        user_bookmarks.c.rating.isnot(None)
                    )
                )
            )
            
            total_reviews = db.session.scalar(
                select(func.count())
                .where(
                    and_(
                        user_bookmarks.c.tutorial_id == tutorial_id,
                        user_bookmarks.c.rating.isnot(None)
                    )
                )
            )
            
            pagination = ResponseService.pagination_info(page, per_page, total or 0)
            return ResponseService.success_response({
                'reviews': review_list,
                'averageRating': round(float(avg_rating), 2) if avg_rating else 0.0,
                'totalReviews': total_reviews or 0,
                'pagination': pagination
            })
            
        except Exception as e:
            current_app.logger.error(f"get tutorial reviews error: {str(e)}")
            raise APIError("internal server error", 500)

    @staticmethod
    def get_user_review(user_id: int, tutorial_id: int):
        """get user's review for a specific tutorial"""
        try:
            bookmark = db.session.scalar(
                select(user_bookmarks).where(
                    user_bookmarks.c.user_id == user_id,
                    user_bookmarks.c.tutorial_id == tutorial_id
                )
            )
            
            if not bookmark:
                raise APIError("tutorial not bookmarked", 404)
            
            if not bookmark.rating:
                return ResponseService.success_response({
                    'hasReview': False,
                    'rating': None,
                    'reviewText': None,
                    'reviewedAt': None
                })
            
            return ResponseService.success_response({
                'hasReview': True,
                'rating': bookmark.rating,
                'reviewText': bookmark.review_text,
                'reviewedAt': bookmark.reviewed_at.isoformat() if bookmark.reviewed_at else None
            })
            
        except APIError:
            raise
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
                    validated_data = {}
            except Exception:
                validated_data = {}
            
            # check if review exists
            bookmark = db.session.scalar(
                select(user_bookmarks).where(
                    user_bookmarks.c.user_id == user_id,
                    user_bookmarks.c.tutorial_id == tutorial_id,
                    user_bookmarks.c.rating.isnot(None)
                )
            )
            
            if not bookmark:
                raise APIError("review not found", 404)
            
            # validate rating
            rating = validated_data.get('rating')
            if not rating or not (1 <= rating <= 5):
                raise APIError("rating must be between 1 and 5", 400)
            
            # update review data
            update_data = {
                'rating': rating,
                'review_text': validated_data.get('review_text', ''),
                'reviewed_at': datetime.utcnow(),
                'last_accessed_at': datetime.utcnow()
            }
            
            db.session.execute(
                update(user_bookmarks).where(
                    user_bookmarks.c.user_id == user_id,
                    user_bookmarks.c.tutorial_id == tutorial_id
                ).values(**update_data)
            )
            
            # update tutorial average rating
            ReviewService._update_tutorial_rating(tutorial_id)
            
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
            bookmark = db.session.scalar(
                select(user_bookmarks).where(
                    user_bookmarks.c.user_id == user_id,
                    user_bookmarks.c.tutorial_id == tutorial_id,
                    user_bookmarks.c.rating.isnot(None)
                )
            )
            
            if not bookmark:
                raise APIError("review not found", 404)
            
            # clear review data (keep bookmark)
            update_data = {
                'rating': None,
                'review_text': None,
                'reviewed_at': None,
                'last_accessed_at': datetime.utcnow()
            }
            
            db.session.execute(
                update(user_bookmarks).where(
                    user_bookmarks.c.user_id == user_id,
                    user_bookmarks.c.tutorial_id == tutorial_id
                ).values(**update_data)
            )
            
            # update tutorial average rating
            ReviewService._update_tutorial_rating(tutorial_id)
            
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
                    .where(
                        and_(
                            user_bookmarks.c.tutorial_id == tutorial_id,
                            user_bookmarks.c.rating.isnot(None)
                        )
                    )
                )
                
                avg_rating = db.session.scalar(
                    select(func.avg(user_bookmarks.c.rating))
                    .where(
                        and_(
                            user_bookmarks.c.tutorial_id == tutorial_id,
                            user_bookmarks.c.rating.isnot(None)
                        )
                    )
                )
                
                # get rating distribution
                rating_dist = {}
                for rating in range(1, 6):
                    count = db.session.scalar(
                        select(func.count())
                        .where(
                            and_(
                                user_bookmarks.c.tutorial_id == tutorial_id,
                                user_bookmarks.c.rating == rating
                            )
                        )
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
                    .where(user_bookmarks.c.rating.isnot(None))
                )
                
                avg_rating = db.session.scalar(
                    select(func.avg(user_bookmarks.c.rating))
                    .where(user_bookmarks.c.rating.isnot(None))
                )
                
                # get reviews by tutorial
                tutorial_stats = db.session.execute(
                    select(
                        user_bookmarks.c.tutorial_id,
                        Tutorial.title,
                        func.count().label('review_count'),
                        func.avg(user_bookmarks.c.rating).label('avg_rating')
                    ).join(
                        Tutorial, user_bookmarks.c.tutorial_id == Tutorial.id
                    ).where(
                        user_bookmarks.c.rating.isnot(None)
                    ).group_by(
                        user_bookmarks.c.tutorial_id, Tutorial.title
                    ).order_by(func.count().desc())
                ).all()
                
                tutorial_list = []
                for tutorial_id, title, count, avg in tutorial_stats:
                    tutorial_list.append({
                        'tutorialId': tutorial_id,
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
    def moderate_review(review_id: int, moderation_data: Dict[str, Any]):
        """moderate a review (admin only)"""
        try:
            # validate input data
            schema = ReviewModerationSchema()
            try:
                validated_data = schema.load(moderation_data)
                if not isinstance(validated_data, dict):
                    validated_data = {}
            except Exception:
                validated_data = {}
            
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
            search_query = select(user_bookmarks, Account, Tutorial).join(
                Account, user_bookmarks.c.user_id == Account.id
            ).join(
                Tutorial, user_bookmarks.c.tutorial_id == Tutorial.id
            ).where(
                and_(
                    user_bookmarks.c.rating.isnot(None),
                    or_(
                        user_bookmarks.c.review_text.ilike(f'%{search_term}%'),
                        Tutorial.title.ilike(f'%{search_term}%'),
                        Account.name.ilike(f'%{search_term}%')
                    )
                )
            )
            
            # apply additional filters
            if validated_params.get('rating_min'):
                search_query = search_query.where(user_bookmarks.c.rating >= validated_params['rating_min'])
            
            if validated_params.get('rating_max'):
                search_query = search_query.where(user_bookmarks.c.rating <= validated_params['rating_max'])
            
            if validated_params.get('tutorial_id'):
                search_query = search_query.where(user_bookmarks.c.tutorial_id == validated_params['tutorial_id'])
            
            # apply sorting
            sort_by = validated_params.get('sort_by', 'reviewed_at')
            sort_order = validated_params.get('sort_order', 'desc')
            
            if sort_by == 'rating':
                sort_column = user_bookmarks.c.rating
            elif sort_by == 'reviewed_at':
                sort_column = user_bookmarks.c.reviewed_at
            else:
                sort_column = user_bookmarks.c.reviewed_at
            
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
            for bookmark, account, tutorial in results:
                review_list.append({
                    'id': bookmark.user_id,
                    'userId': bookmark.user_id,
                    'userName': account.name,
                    'userEmail': account.email,
                    'tutorialId': bookmark.tutorial_id,
                    'tutorialTitle': tutorial.title,
                    'rating': bookmark.rating,
                    'reviewText': bookmark.review_text,
                    'reviewedAt': bookmark.reviewed_at.isoformat() if bookmark.reviewed_at else None,
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

    @staticmethod
    def _update_tutorial_rating(tutorial_id: int):
        """update tutorial average rating"""
        try:
            avg_rating = db.session.scalar(
                select(func.avg(user_bookmarks.c.rating))
                .where(
                    and_(
                        user_bookmarks.c.tutorial_id == tutorial_id,
                        user_bookmarks.c.rating.isnot(None)
                    )
                )
            )
            
            db.session.execute(
                update(Tutorial).where(Tutorial.id == tutorial_id)
                .values(rating=round(float(avg_rating), 2) if avg_rating else 0.0)
            )
            
        except Exception as e:
            current_app.logger.error(f"update tutorial rating error: {str(e)}")

    @staticmethod
    def _update_quiz_rating(quiz_id: int):
        """update quiz average rating"""
        try:
            # for quiz ratings, we'd need to implement a similar system
            # for now, this is a placeholder
            pass
            
        except Exception as e:
            current_app.logger.error(f"update quiz rating error: {str(e)}")
