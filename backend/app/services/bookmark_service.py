"""
bookmark service for managing user bookmarks and progress tracking
Following README.txt separation of concerns
"""
from flask import current_app
from sqlalchemy import select, delete, insert, update, func, and_, or_
from typing import Dict, Any
from ..extensions import db
from ..models.user_bookmark import user_bookmarks
from ..models.tutorial import Tutorial
from ..models.account import Account
from ..models.category import Category
from ..schemas.bookmark_schemas import BookmarkCreateSchema, BookmarkProgressSchema, BookmarkReviewSchema, BookmarkQuerySchema
from .error_service import APIError, BookmarkError, ProgressError, create_bookmark_error, create_progress_error
from .response_service import ResponseService


class BookmarkService:
    """service for managing user bookmarks and progress tracking"""

    @staticmethod
    def get_user_bookmarks(user_id: int, params: Dict[str, Any] | None = None):
        """get all bookmarks for a user with progress data and filtering"""
        try:
            # validate query parameters
            if params:
                schema = BookmarkQuerySchema()
                try:
                    validated_params = schema.load(params)
                    if not isinstance(validated_params, dict):
                        validated_params = {}
                except Exception:
                    validated_params = {}
            else:
                validated_params = {}
            
            # build base query
            bookmarks_query = select(Tutorial, user_bookmarks, Category).join(
                user_bookmarks, Tutorial.id == user_bookmarks.c.tutorial_id
            ).join(
                Category, Tutorial.category_id == Category.id
            ).where(user_bookmarks.c.user_id == user_id)
            
            # apply filters
            if validated_params.get('search'):
                search_term = validated_params['search']
                bookmarks_query = bookmarks_query.where(
                    or_(
                        Tutorial.title.ilike(f'%{search_term}%'),
                        Tutorial.description.ilike(f'%{search_term}%'),
                        Category.category_name.ilike(f'%{search_term}%')
                    )
                )
            
            if validated_params.get('category_id'):
                bookmarks_query = bookmarks_query.where(Tutorial.category_id == validated_params['category_id'])
            
            if validated_params.get('difficulty'):
                bookmarks_query = bookmarks_query.where(Tutorial.difficulty == validated_params['difficulty'])
            
            if validated_params.get('status') and validated_params['status'] != 'all':
                if validated_params['status'] == 'completed':
                    bookmarks_query = bookmarks_query.where(user_bookmarks.c.is_completed == True)
                elif validated_params['status'] == 'in-progress':
                    bookmarks_query = bookmarks_query.where(user_bookmarks.c.is_completed == False)
            
            # apply sorting
            sort_by = validated_params.get('sort_by', 'created_at')
            sort_order = validated_params.get('sort_order', 'desc')
            
            if sort_by == 'id':
                sort_column = Tutorial.id
            elif sort_by == 'title':
                sort_column = Tutorial.title
            elif sort_by == 'created_at':
                sort_column = user_bookmarks.c.enrolled_at
            elif sort_by == 'updated_at':
                sort_column = user_bookmarks.c.last_accessed_at
            elif sort_by == 'progress_percentage':
                sort_column = user_bookmarks.c.progress_percentage
            elif sort_by == 'rating':
                sort_column = user_bookmarks.c.rating
            else:
                sort_column = user_bookmarks.c.enrolled_at
            
            if sort_order.lower() == 'desc':
                bookmarks_query = bookmarks_query.order_by(sort_column.desc())
            else:
                bookmarks_query = bookmarks_query.order_by(sort_column.asc())
            
            # get total count
            count_query = select(func.count()).select_from(bookmarks_query.subquery())
            total = db.session.scalar(count_query)
            
            # apply pagination
            page = validated_params.get('page', 1)
            per_page = validated_params.get('per_page', 10)
            offset = (page - 1) * per_page
            bookmarks_query = bookmarks_query.offset(offset).limit(per_page)
            
            # execute query
            results = db.session.execute(bookmarks_query).all()
            
            bookmark_list = []
            for tutorial, bookmark, category in results:
                bookmark_list.append({
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
                    # review system data
                    'userRating': bookmark.rating,
                    'userReview': bookmark.review_text,
                    'reviewedAt': bookmark.reviewed_at.isoformat() if bookmark.reviewed_at else None,
                })
            
            pagination = ResponseService.pagination_info(page, per_page, total or 0)
            return ResponseService.success_response(bookmark_list, pagination=pagination)
            
        except Exception as e:
            current_app.logger.error(f"get user bookmarks error: {str(e)}")
            raise APIError("internal server error", 500)

    @staticmethod
    def add_bookmark(user_id: int, tutorial_id: int):
        """add a tutorial to user's bookmarks"""
        try:
            # check if tutorial exists
            tutorial = db.session.scalar(
                select(Tutorial).where(Tutorial.id == tutorial_id)
            )
            if not tutorial:
                raise APIError("tutorial not found", 404)
            
            # check if already bookmarked
            existing_bookmark = db.session.scalar(
                select(user_bookmarks).where(
                    user_bookmarks.c.user_id == user_id,
                    user_bookmarks.c.tutorial_id == tutorial_id
                )
            )
            
            if existing_bookmark:
                raise APIError("tutorial already bookmarked", 409)
            
            # add bookmark with default progress values
            db.session.execute(
                insert(user_bookmarks).values(
                    user_id=user_id,
                    tutorial_id=tutorial_id,
                    progress_percentage=0,
                    last_watched_position=0,
                    total_watch_time=0,
                    is_completed=False,
                    completed_at=None,
                )
            )
            db.session.commit()
            
            return {"message": "tutorial bookmarked successfully"}
            
        except APIError:
            raise
        except Exception as e:
            current_app.logger.error(f"add bookmark error: {str(e)}")
            raise APIError("internal server error", 500)

    @staticmethod
    def remove_bookmark(user_id: int, tutorial_id: int):
        """remove a tutorial from user's bookmarks"""
        try:
            # check if bookmark exists
            existing_bookmark = db.session.scalar(
                select(user_bookmarks).where(
                    user_bookmarks.c.user_id == user_id,
                    user_bookmarks.c.tutorial_id == tutorial_id
                )
            )
            
            if not existing_bookmark:
                raise APIError("bookmark not found", 404)
            
            # remove bookmark
            db.session.execute(
                delete(user_bookmarks).where(
                    user_bookmarks.c.user_id == user_id,
                    user_bookmarks.c.tutorial_id == tutorial_id
                )
            )
            db.session.commit()
            
            return {"message": "bookmark removed successfully"}
            
        except APIError:
            raise
        except Exception as e:
            current_app.logger.error(f"remove bookmark error: {str(e)}")
            raise APIError("internal server error", 500)

    @staticmethod
    def is_bookmarked(user_id: int, tutorial_id: int):
        """check if a tutorial is bookmarked by user"""
        try:
            bookmark = db.session.scalar(
                select(user_bookmarks).where(
                    user_bookmarks.c.user_id == user_id,
                    user_bookmarks.c.tutorial_id == tutorial_id
                )
            )
            
            return bookmark is not None
            
        except Exception as e:
            current_app.logger.error(f"check bookmark error: {str(e)}")
            raise APIError("internal server error", 500)

    @staticmethod
    def update_progress(user_id: int, tutorial_id: int, progress_data: dict):
        """update user's progress for a tutorial"""
        try:
            # check if bookmark exists
            existing_bookmark = db.session.scalar(
                select(user_bookmarks).where(
                    user_bookmarks.c.user_id == user_id,
                    user_bookmarks.c.tutorial_id == tutorial_id
                )
            )
            
            if not existing_bookmark:
                raise APIError("tutorial not bookmarked", 404)
            
            # update progress data
            update_data = {
                'last_accessed_at': db.func.now()
            }
            
            if 'progress_percentage' in progress_data:
                update_data['progress_percentage'] = progress_data['progress_percentage']
            
            if 'last_watched_position' in progress_data:
                update_data['last_watched_position'] = progress_data['last_watched_position']
            
            if 'total_watch_time' in progress_data:
                update_data['total_watch_time'] = progress_data['total_watch_time']
            
            if 'is_completed' in progress_data:
                update_data['is_completed'] = progress_data['is_completed']
                if progress_data['is_completed']:
                    update_data['completed_at'] = db.func.now()
            
            db.session.execute(
                update(user_bookmarks).where(
                    user_bookmarks.c.user_id == user_id,
                    user_bookmarks.c.tutorial_id == tutorial_id
                ).values(**update_data)
            )
            db.session.commit()
            
            return {"message": "progress updated successfully"}
            
        except APIError:
            raise
        except Exception as e:
            current_app.logger.error(f"update progress error: {str(e)}")
            raise APIError("internal server error", 500)

    @staticmethod
    def get_progress(user_id: int, tutorial_id: int):
        """get user's progress for a specific tutorial"""
        try:
            bookmark = db.session.scalar(
                select(user_bookmarks).where(
                    user_bookmarks.c.user_id == user_id,
                    user_bookmarks.c.tutorial_id == tutorial_id
                )
            )
            
            if not bookmark:
                raise APIError("tutorial not bookmarked", 404)
            
            return {
                'progressPercentage': bookmark.progress_percentage,
                'lastWatchedPosition': bookmark.last_watched_position,
                'totalWatchTime': bookmark.total_watch_time,
                'isCompleted': bookmark.is_completed,
                'completedAt': bookmark.completed_at.isoformat() if bookmark.completed_at else None,
                'enrolledAt': bookmark.enrolled_at.isoformat() if bookmark.enrolled_at else None,
                'lastAccessedAt': bookmark.last_accessed_at.isoformat() if bookmark.last_accessed_at else None,
            }
            
        except APIError:
            raise
        except Exception as e:
            current_app.logger.error(f"get progress error: {str(e)}")
            raise APIError("internal server error", 500)

    @staticmethod
    def submit_review(user_id: int, tutorial_id: int, rating: int, review_text: str | None = None):
        """submit a review for a tutorial"""
        try:
            # check if bookmark exists
            existing_bookmark = db.session.scalar(
                select(user_bookmarks).where(
                    user_bookmarks.c.user_id == user_id,
                    user_bookmarks.c.tutorial_id == tutorial_id
                )
            )
            
            if not existing_bookmark:
                raise APIError("tutorial not bookmarked", 404)
            
            # validate rating
            if not (1 <= rating <= 5):
                raise APIError("rating must be between 1 and 5", 400)
            
            # update review data
            update_data = {
                'rating': rating,
                'review_text': review_text,
                'reviewed_at': db.func.now(),
                'last_accessed_at': db.func.now()
            }
            
            db.session.execute(
                update(user_bookmarks).where(
                    user_bookmarks.c.user_id == user_id,
                    user_bookmarks.c.tutorial_id == tutorial_id
                ).values(**update_data)
            )
            db.session.commit()
            
            return {"message": "review submitted successfully"}
            
        except APIError:
            raise
        except Exception as e:
            current_app.logger.error(f"submit review error: {str(e)}")
            raise APIError("internal server error", 500)

    @staticmethod
    def get_tutorial_reviews(tutorial_id: int):
        """get all reviews for a tutorial"""
        try:
            # get all reviews for the tutorial
            reviews_query = select(user_bookmarks).where(
                user_bookmarks.c.tutorial_id == tutorial_id,
                user_bookmarks.c.rating.isnot(None)
            )
            
            reviews = db.session.scalars(reviews_query).all()
            
            review_list = []
            for review in reviews:
                # get user info
                user = db.session.scalar(
                    select(Account).where(Account.id == review.user_id)
                )
                
                if user:
                    review_list.append({
                        'userId': review.user_id,
                        'userName': user.name,
                        'userEmail': user.email,
                        'rating': review.rating,
                        'reviewText': review.review_text,
                        'reviewedAt': review.reviewed_at.isoformat() if review.reviewed_at else None,
                    })
            
            return review_list
            
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
            
            return {
                'rating': bookmark.rating,
                'reviewText': bookmark.review_text,
                'reviewedAt': bookmark.reviewed_at.isoformat() if bookmark.reviewed_at else None,
            }
            
        except APIError:
            raise
        except Exception as e:
            current_app.logger.error(f"get user review error: {str(e)}")
            raise APIError("internal server error", 500)
    
    @staticmethod
    def get_bookmark_statistics(user_id: int):
        """get bookmark statistics for a user"""
        try:
            # get total bookmarks
            total_bookmarks = db.session.scalar(
                select(func.count()).select_from(user_bookmarks)
                .where(user_bookmarks.c.user_id == user_id)
            )
            
            # get completed bookmarks
            completed_bookmarks = db.session.scalar(
                select(func.count()).select_from(user_bookmarks)
                .where(and_(
                    user_bookmarks.c.user_id == user_id,
                    user_bookmarks.c.is_completed == True
                ))
            )
            
            # get in-progress bookmarks
            in_progress_bookmarks = db.session.scalar(
                select(func.count()).select_from(user_bookmarks)
                .where(and_(
                    user_bookmarks.c.user_id == user_id,
                    user_bookmarks.c.is_completed == False
                ))
            )
            
            # get total watch time
            total_watch_time = db.session.scalar(
                select(func.sum(user_bookmarks.c.total_watch_time))
                .where(user_bookmarks.c.user_id == user_id)
            )
            
            # get average progress
            avg_progress = db.session.scalar(
                select(func.avg(user_bookmarks.c.progress_percentage))
                .where(user_bookmarks.c.user_id == user_id)
            )
            
            # get reviews submitted
            reviews_submitted = db.session.scalar(
                select(func.count()).select_from(user_bookmarks)
                .where(and_(
                    user_bookmarks.c.user_id == user_id,
                    user_bookmarks.c.rating.isnot(None)
                ))
            )
            
            return {
                'totalBookmarks': total_bookmarks or 0,
                'completedBookmarks': completed_bookmarks or 0,
                'inProgressBookmarks': in_progress_bookmarks or 0,
                'totalWatchTime': total_watch_time or 0,
                'averageProgress': round(float(avg_progress), 2) if avg_progress else 0.0,
                'reviewsSubmitted': reviews_submitted or 0,
                'completionRate': round(((completed_bookmarks or 0) / (total_bookmarks or 1) * 100), 2) if (total_bookmarks or 0) > 0 else 0.0
            }
            
        except Exception as e:
            current_app.logger.error(f"get bookmark statistics error: {str(e)}")
            raise APIError("internal server error", 500)
    
    @staticmethod
    def bulk_add_bookmarks(user_id: int, tutorial_ids: list):
        """add multiple tutorials to user's bookmarks"""
        try:
            if not tutorial_ids:
                raise APIError("tutorial IDs list cannot be empty", 400)
            
            # validate all tutorials exist
            existing_tutorials = db.session.scalars(
                select(Tutorial.id).where(Tutorial.id.in_(tutorial_ids))
            ).all()
            
            if len(existing_tutorials) != len(tutorial_ids):
                raise APIError("one or more tutorials not found", 404)
            
            # check which are already bookmarked
            existing_bookmarks = db.session.scalars(
                select(user_bookmarks.c.tutorial_id).where(
                    and_(
                        user_bookmarks.c.user_id == user_id,
                        user_bookmarks.c.tutorial_id.in_(tutorial_ids)
                    )
                )
            ).all()
            
            # filter out already bookmarked tutorials
            new_tutorial_ids = [tid for tid in tutorial_ids if tid not in existing_bookmarks]
            
            if not new_tutorial_ids:
                return {"message": "all tutorials already bookmarked", "addedCount": 0}
            
            # bulk insert new bookmarks
            bookmark_data = []
            for tutorial_id in new_tutorial_ids:
                bookmark_data.append({
                    'user_id': user_id,
                    'tutorial_id': tutorial_id,
                    'progress_percentage': 0,
                    'last_watched_position': 0,
                    'total_watch_time': 0,
                    'is_completed': False,
                    'completed_at': None,
                })
            
            db.session.execute(insert(user_bookmarks), bookmark_data)
            db.session.commit()
            
            return {
                "message": f"successfully bookmarked {len(new_tutorial_ids)} tutorials",
                "addedCount": len(new_tutorial_ids),
                "alreadyBookmarked": len(existing_bookmarks)
            }
            
        except APIError:
            raise
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"bulk add bookmarks error: {str(e)}")
            raise APIError("internal server error", 500)
    
    @staticmethod
    def bulk_remove_bookmarks(user_id: int, tutorial_ids: list):
        """remove multiple tutorials from user's bookmarks"""
        try:
            if not tutorial_ids:
                raise APIError("tutorial IDs list cannot be empty", 400)
            
            # delete bookmarks
            result = db.session.execute(
                delete(user_bookmarks).where(
                    and_(
                        user_bookmarks.c.user_id == user_id,
                        user_bookmarks.c.tutorial_id.in_(tutorial_ids)
                    )
                )
            )
            
            db.session.commit()
            
            return {
                "message": f"successfully removed {result.rowcount} bookmarks",
                "removedCount": result.rowcount
            }
            
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"bulk remove bookmarks error: {str(e)}")
            raise APIError("internal server error", 500)
    
    @staticmethod
    def search_bookmarks(user_id: int, search_term: str, params: Dict[str, Any] | None = None):
        """search bookmarks with advanced filtering"""
        try:
            if not search_term:
                raise APIError("search term is required", 400)
            
            # validate query parameters
            if params:
                schema = BookmarkQuerySchema()
                try:
                    validated_params = schema.load(params)
                    if not isinstance(validated_params, dict):
                        validated_params = {}
                except Exception:
                    validated_params = {}
            else:
                validated_params = {}
            
            # build search query
            search_query = select(Tutorial, user_bookmarks, Category).join(
                user_bookmarks, Tutorial.id == user_bookmarks.c.tutorial_id
            ).join(
                Category, Tutorial.category_id == Category.id
            ).where(
                and_(
                    user_bookmarks.c.user_id == user_id,
                    or_(
                        Tutorial.title.ilike(f'%{search_term}%'),
                        Tutorial.description.ilike(f'%{search_term}%'),
                        Category.category_name.ilike(f'%{search_term}%'),
                        Tutorial.author.ilike(f'%{search_term}%'),
                        Tutorial.tags.ilike(f'%{search_term}%')
                    )
                )
            )
            
            # apply additional filters
            if validated_params.get('category_id'):
                search_query = search_query.where(Tutorial.category_id == validated_params['category_id'])
            
            if validated_params.get('difficulty'):
                search_query = search_query.where(Tutorial.difficulty == validated_params['difficulty'])
            
            if validated_params.get('status') and validated_params['status'] != 'all':
                if validated_params['status'] == 'completed':
                    search_query = search_query.where(user_bookmarks.c.is_completed == True)
                elif validated_params['status'] == 'in-progress':
                    search_query = search_query.where(user_bookmarks.c.is_completed == False)
            
            # apply sorting
            sort_by = validated_params.get('sort_by', 'created_at')
            sort_order = validated_params.get('sort_order', 'desc')
            
            if sort_by == 'id':
                sort_column = Tutorial.id
            elif sort_by == 'title':
                sort_column = Tutorial.title
            elif sort_by == 'created_at':
                sort_column = user_bookmarks.c.enrolled_at
            elif sort_by == 'updated_at':
                sort_column = user_bookmarks.c.last_accessed_at
            elif sort_by == 'progress_percentage':
                sort_column = user_bookmarks.c.progress_percentage
            elif sort_by == 'rating':
                sort_column = user_bookmarks.c.rating
            else:
                sort_column = user_bookmarks.c.enrolled_at
            
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
            
            bookmark_list = []
            for tutorial, bookmark, category in results:
                bookmark_list.append({
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
                    # review system data
                    'userRating': bookmark.rating,
                    'userReview': bookmark.review_text,
                    'reviewedAt': bookmark.reviewed_at.isoformat() if bookmark.reviewed_at else None,
                })
            
            pagination = ResponseService.pagination_info(page, per_page, total or 0)
            return ResponseService.success_response(bookmark_list, pagination=pagination)
            
        except APIError:
            raise
        except Exception as e:
            current_app.logger.error(f"search bookmarks error: {str(e)}")
            raise APIError("internal server error", 500)
