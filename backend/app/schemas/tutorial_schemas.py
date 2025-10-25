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


class TutorialQuerySchema(Schema):
    """Schema for tutorial query parameters"""
    page = fields.Int(load_default=1, validate=validate.Range(min=1))
    per_page = fields.Int(load_default=10, validate=validate.Range(min=1, max=100))
    search = fields.Str(validate=validate.Length(max=255))
    category_id = fields.Int()
    status = fields.Str(validate=validate.OneOf(['draft', 'published', 'archived', 'all']))
    difficulty = fields.Str(validate=validate.OneOf(['beginner', 'intermediate', 'advanced']))
    sort_by = fields.Str(validate=validate.OneOf(['id', 'title', 'created_at', 'updated_at', 'views', 'rating', 'category']))
    sort_order = fields.Str(validate=validate.OneOf(['asc', 'desc']))
