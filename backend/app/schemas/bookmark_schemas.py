"""
bookmark validation schemas
Following README.txt separation of concerns
"""
from marshmallow import Schema, fields, validate


class BookmarkCreateSchema(Schema):
    """schema for creating bookmarks"""
    tutorial_id = fields.Int(required=True, validate=validate.Range(min=1))


class BookmarkProgressSchema(Schema):
    """schema for updating bookmark progress"""
    progress_percentage = fields.Int(validate=validate.Range(min=0, max=100))
    last_watched_position = fields.Int(validate=validate.Range(min=0))
    total_watch_time = fields.Int(validate=validate.Range(min=0))
    is_completed = fields.Bool()


class BookmarkReviewSchema(Schema):
    """schema for submitting bookmark reviews"""
    rating = fields.Int(required=True, validate=validate.Range(min=1, max=5))
    review_text = fields.Str(validate=validate.Length(max=1000))


class BookmarkQuerySchema(Schema):
    """schema for bookmark query parameters"""
    page = fields.Int(validate=validate.Range(min=1), missing=1)
    per_page = fields.Int(validate=validate.Range(min=1, max=100), missing=10)
    search = fields.Str(validate=validate.Length(max=255))
    category_id = fields.Int(validate=validate.Range(min=1))
    status = fields.Str(validate=validate.OneOf(['active', 'completed', 'in-progress', 'all']), missing='all')
    difficulty = fields.Str(validate=validate.OneOf(['beginner', 'intermediate', 'advanced']))
    sort_by = fields.Str(validate=validate.OneOf(['id', 'title', 'created_at', 'updated_at', 'progress_percentage', 'rating']), missing='created_at')
    sort_order = fields.Str(validate=validate.OneOf(['asc', 'desc']), missing='desc')
