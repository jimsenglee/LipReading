"""
bookmark service for managing user bookmarks
Following README.txt separation of concerns
"""
from flask import current_app
from sqlalchemy import select, delete, insert, func, and_, or_
from typing import Dict, Any
from ..extensions import db
from ..models.user_bookmark import user_bookmarks
from ..models.tutorial import Tutorial
from ..models.account import Account
from ..models.category import Category
from .error_service import APIError
from .response_service import ResponseService


class BookmarkService:
    """service for managing user bookmarks"""

    @staticmethod
    def get_user_bookmarks(user_id: int, params: Dict[str, Any] | None = None):
        """get all bookmarks for a user with filtering"""
        try:
            print(f"🔍 [DEBUG] get_user_bookmarks called for user_id: {user_id}")
            
            # build base query
            bookmarks_query = select(Tutorial, user_bookmarks, Category).join(
                user_bookmarks, Tutorial.id == user_bookmarks.c.tutorial_id
            ).join(
                Category, Tutorial.category_id == Category.id
            ).where(user_bookmarks.c.user_id == user_id)
            
            # apply filters if provided
            if params and params.get('search'):
                search_term = params['search']
                bookmarks_query = bookmarks_query.where(
                    or_(
                        Tutorial.title.ilike(f'%{search_term}%'),
                        Tutorial.description.ilike(f'%{search_term}%'),
                        Category.category_name.ilike(f'%{search_term}%')
                    )
                )
            
            # apply sorting - default to created_at
            sort_by = params.get('sort_by', 'created_at') if params else 'created_at'
            sort_order = params.get('sort_order', 'desc') if params else 'desc'
            
            if sort_by == 'id':
                sort_column = Tutorial.id
            elif sort_by == 'title':
                sort_column = Tutorial.title
            elif sort_by == 'created_at':
                sort_column = user_bookmarks.c.created_at
            else:
                sort_column = user_bookmarks.c.created_at
            
            if sort_order.lower() == 'desc':
                bookmarks_query = bookmarks_query.order_by(sort_column.desc())
            else:
                bookmarks_query = bookmarks_query.order_by(sort_column.asc())
            
            # get total count
            count_query = select(func.count()).select_from(bookmarks_query.subquery())
            total = db.session.scalar(count_query)
            
            # apply pagination
            page = params.get('page', 1) if params else 1
            per_page = params.get('per_page', 10) if params else 10
            offset = (page - 1) * per_page
            bookmarks_query = bookmarks_query.offset(offset).limit(per_page)
            
            # execute query
            results = db.session.execute(bookmarks_query).all()
            
            print(f"🔍 [DEBUG] Found {len(results)} bookmarks")
            
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
                    'bookmarkedAt': bookmark.created_at.isoformat() if bookmark.created_at else None,
                })
            
            pagination = ResponseService.pagination_info(page, per_page, total or 0)
            return ResponseService.success_response(bookmark_list, pagination=pagination)
            
        except Exception as e:
            current_app.logger.error(f"get user bookmarks error: {str(e)}")
            import traceback
            traceback.print_exc()
            raise APIError("internal server error", 500)

    @staticmethod
    def add_bookmark(user_id: int, tutorial_id: int):
        """add a tutorial to user's bookmarks"""
        try:
            print(f"🔍 [DEBUG] add_bookmark called for user_id: {user_id}, tutorial_id: {tutorial_id}")
            
            # check if tutorial exists
            tutorial = db.session.scalar(
                select(Tutorial).where(Tutorial.id == tutorial_id)
            )
            if not tutorial:
                print(f"❌ [DEBUG] Tutorial {tutorial_id} not found")
                raise APIError("tutorial not found", 404)
            
            # check if already bookmarked
            existing_bookmark = db.session.scalar(
                select(user_bookmarks).where(
                    user_bookmarks.c.user_id == user_id,
                    user_bookmarks.c.tutorial_id == tutorial_id
                )
            )
            
            if existing_bookmark:
                print(f"⚠️ [DEBUG] Tutorial {tutorial_id} already bookmarked by user {user_id}")
                raise APIError("tutorial already bookmarked", 409)
            
            # add bookmark
            db.session.execute(
                insert(user_bookmarks).values(
                    user_id=user_id,
                    tutorial_id=tutorial_id,
                )
            )
            db.session.commit()
            
            print(f"✅ [DEBUG] Successfully bookmarked tutorial {tutorial_id}")
            return {"message": "tutorial bookmarked successfully"}
            
        except APIError:
            raise
        except Exception as e:
            current_app.logger.error(f"add bookmark error: {str(e)}")
            import traceback
            traceback.print_exc()
            raise APIError("internal server error", 500)

    @staticmethod
    def remove_bookmark(user_id: int, tutorial_id: int):
        """remove a tutorial from user's bookmarks"""
        try:
            print(f"🔍 [DEBUG] remove_bookmark called for user_id: {user_id}, tutorial_id: {tutorial_id}")
            
            # check if bookmark exists
            existing_bookmark = db.session.scalar(
                select(user_bookmarks).where(
                    user_bookmarks.c.user_id == user_id,
                    user_bookmarks.c.tutorial_id == tutorial_id
                )
            )
            
            if not existing_bookmark:
                print(f"❌ [DEBUG] Bookmark not found for user {user_id}, tutorial {tutorial_id}")
                raise APIError("bookmark not found", 404)
            
            # remove bookmark
            result = db.session.execute(
                delete(user_bookmarks).where(
                    user_bookmarks.c.user_id == user_id,
                    user_bookmarks.c.tutorial_id == tutorial_id
                )
            )
            db.session.commit()
            
            print(f"✅ [DEBUG] Successfully removed bookmark")
            return {"message": "bookmark removed successfully"}
            
        except APIError:
            raise
        except Exception as e:
            current_app.logger.error(f"remove bookmark error: {str(e)}")
            import traceback
            traceback.print_exc()
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
            import traceback
            traceback.print_exc()
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
            
            return {
                'totalBookmarks': total_bookmarks or 0,
            }
            
        except Exception as e:
            current_app.logger.error(f"get bookmark statistics error: {str(e)}")
            import traceback
            traceback.print_exc()
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
                    user_bookmarks.c.user_id == user_id,
                    user_bookmarks.c.tutorial_id.in_(tutorial_ids)
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
            import traceback
            traceback.print_exc()
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
                    user_bookmarks.c.user_id == user_id,
                    user_bookmarks.c.tutorial_id.in_(tutorial_ids)
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
            import traceback
            traceback.print_exc()
            raise APIError("internal server error", 500)
    
    @staticmethod
    def search_bookmarks(user_id: int, search_term: str, params: Dict[str, Any] | None = None):
        """search bookmarks with advanced filtering"""
        try:
            if not search_term:
                raise APIError("search term is required", 400)
            
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
            
            # apply sorting
            sort_by = params.get('sort_by', 'created_at') if params else 'created_at'
            sort_order = params.get('sort_order', 'desc') if params else 'desc'
            
            if sort_by == 'id':
                sort_column = Tutorial.id
            elif sort_by == 'title':
                sort_column = Tutorial.title
            elif sort_by == 'created_at':
                sort_column = user_bookmarks.c.created_at
            else:
                sort_column = user_bookmarks.c.created_at
            
            if sort_order.lower() == 'desc':
                search_query = search_query.order_by(sort_column.desc())
            else:
                search_query = search_query.order_by(sort_column.asc())
            
            # get total count
            count_query = select(func.count()).select_from(search_query.subquery())
            total = db.session.scalar(count_query)
            
            # apply pagination
            page = params.get('page', 1) if params else 1
            per_page = params.get('per_page', 10) if params else 10
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
                    'bookmarkedAt': bookmark.created_at.isoformat() if bookmark.created_at else None,
                })
            
            pagination = ResponseService.pagination_info(page, per_page, total or 0)
            return ResponseService.success_response(bookmark_list, pagination=pagination)
            
        except APIError:
            raise
        except Exception as e:
            current_app.logger.error(f"search bookmarks error: {str(e)}")
            import traceback
            traceback.print_exc()
            raise APIError("internal server error", 500)
