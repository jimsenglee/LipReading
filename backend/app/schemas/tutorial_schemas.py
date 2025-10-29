"""
Tutorial validation schemas
Following README.txt separation of concerns
"""
from marshmallow import Schema, fields, validate, validates_schema, ValidationError


class TutorialCreateSchema(Schema):
    """Schema for creating tutorials"""
    title = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    description = fields.Str(validate=validate.Length(max=2000))
    category_id = fields.Int(required=True)
    difficulty = fields.Str(validate=validate.OneOf(['beginner', 'intermediate', 'advanced']))
    status = fields.Str(validate=validate.OneOf(['draft', 'published', 'archived']))
    learning_objectives = fields.List(fields.Str(), load_default=[])
    prerequisites = fields.List(fields.Str(), load_default=[])
    tags = fields.List(fields.Str(), load_default=[])
    author = fields.Str(validate=validate.Length(max=255))
    thumbnail_path = fields.Str(validate=validate.Length(max=500))
    video_path = fields.Str(validate=validate.Length(max=500))
    subtitle_path = fields.Str(validate=validate.Length(max=500))  # subtitle support for educational video player
    
    # tutorial series fields for user education
    series_type = fields.Str(validate=validate.OneOf(['single', 'series']))
    parent_series_id = fields.Int()
    video_order = fields.Int(validate=validate.Range(min=1))
    video_title = fields.Str(validate=validate.Length(max=255))
    video_description = fields.Str(validate=validate.Length(max=2000))
    video_duration = fields.Int(validate=validate.Range(min=0))
    is_preview = fields.Bool()


class TutorialUpdateSchema(Schema):
    """Schema for updating tutorials"""
    title = fields.Str(validate=validate.Length(min=1, max=255))
    description = fields.Str(validate=validate.Length(max=2000))
    category_id = fields.Int()
    difficulty = fields.Str(validate=validate.OneOf(['beginner', 'intermediate', 'advanced']))
    status = fields.Str(validate=validate.OneOf(['draft', 'published', 'archived']))
    learning_objectives = fields.List(fields.Str())
    prerequisites = fields.List(fields.Str())
    tags = fields.List(fields.Str())
    author = fields.Str(validate=validate.Length(max=255))
    thumbnail_path = fields.Str(validate=validate.Length(max=500))
    video_path = fields.Str(validate=validate.Length(max=500))
    subtitle_path = fields.Str(validate=validate.Length(max=500))  # subtitle support for educational video player
    
    # tutorial series fields for user education
    series_type = fields.Str(validate=validate.OneOf(['single', 'series']))
    parent_series_id = fields.Int()
    video_order = fields.Int(validate=validate.Range(min=1))
    video_title = fields.Str(validate=validate.Length(max=255))
    video_description = fields.Str(validate=validate.Length(max=2000))
    video_duration = fields.Int(validate=validate.Range(min=0))
    is_preview = fields.Bool()


class TutorialQuerySchema(Schema):
    """Schema for tutorial query parameters"""
    page = fields.Int(load_default=1, validate=validate.Range(min=1))
    per_page = fields.Int(load_default=10, validate=validate.Range(min=1, max=100))
    search = fields.Str(validate=validate.Length(max=255))
    category_id = fields.Int()
    status = fields.Str(validate=validate.OneOf(['draft', 'published', 'archived', 'all']))
    difficulty = fields.Str(validate=validate.OneOf(['beginner', 'intermediate', 'advanced']))
    sort_by = fields.Str(validate=validate.OneOf(['id', 'title', 'created_at', 'updated_at', 'views', 'rating', 'category', 'video_order', 'video_duration']))
    sort_order = fields.Str(validate=validate.OneOf(['asc', 'desc']))
    
    # tutorial series filtering for user education
    series_type = fields.Str(validate=validate.OneOf(['single', 'series', 'all']))
    parent_series_id = fields.Int()
    is_preview = fields.Bool()
    author = fields.Str(validate=validate.Length(max=255))
    tags = fields.Str(validate=validate.Length(max=255))  # comma-separated tags


class TutorialSeriesSchema(Schema):
    """Schema for tutorial series creation and management"""
    title = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    description = fields.Str(validate=validate.Length(max=2000))
    category_id = fields.Int(required=True)
    difficulty = fields.Str(validate=validate.OneOf(['beginner', 'intermediate', 'advanced']))
    status = fields.Str(validate=validate.OneOf(['draft', 'published', 'archived']))
    learning_objectives = fields.List(fields.Str(), load_default=[])
    prerequisites = fields.List(fields.Str(), load_default=[])
    tags = fields.List(fields.Str(), load_default=[])
    author = fields.Str(validate=validate.Length(max=255))
    thumbnail_path = fields.Str(validate=validate.Length(max=500))
    
    # tutorial series specific fields
    videos = fields.List(fields.Dict(), load_default=[])  # list of video data for series
    estimated_duration = fields.Int(validate=validate.Range(min=0))  # total estimated duration
    total_videos = fields.Int(validate=validate.Range(min=1))


class TutorialSeriesUpdateSchema(Schema):
    """Schema for updating tutorial series"""
    title = fields.Str(validate=validate.Length(min=1, max=255))
    description = fields.Str(validate=validate.Length(max=2000))
    category_id = fields.Int()
    difficulty = fields.Str(validate=validate.OneOf(['beginner', 'intermediate', 'advanced']))
    status = fields.Str(validate=validate.OneOf(['draft', 'published', 'archived']))
    learning_objectives = fields.List(fields.Str())
    prerequisites = fields.List(fields.Str())
    tags = fields.List(fields.Str())
    author = fields.Str(validate=validate.Length(max=255))
    thumbnail_path = fields.Str(validate=validate.Length(max=500))
    
    # tutorial series specific fields
    videos = fields.List(fields.Dict())  # list of video data for series
    estimated_duration = fields.Int(validate=validate.Range(min=0))
    total_videos = fields.Int(validate=validate.Range(min=1))
