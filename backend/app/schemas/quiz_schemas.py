"""
Quiz validation schemas
Following README.txt separation of concerns
"""
from marshmallow import Schema, fields, validate


class QuizCreateSchema(Schema):
    """Schema for creating quizzes"""
    title = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    category_id = fields.Int(required=True)
    status = fields.Str(validate=validate.OneOf(['active', 'inactive']), load_default='active')


class QuizUpdateSchema(Schema):
    """Schema for updating quizzes"""
    title = fields.Str(validate=validate.Length(min=1, max=255))
    category_id = fields.Int()
    status = fields.Str(validate=validate.OneOf(['active', 'inactive']))


class QuizQuerySchema(Schema):
    """Schema for quiz query parameters"""
    page = fields.Int(load_default=1, validate=validate.Range(min=1))
    per_page = fields.Int(load_default=10, validate=validate.Range(min=1, max=100))
    search = fields.Str(validate=validate.Length(max=255))
    category_id = fields.Int()
    status = fields.Str(validate=validate.OneOf(['active', 'inactive', 'all']))
    sort_by = fields.Str(validate=validate.OneOf(['id', 'title', 'created_at']))
    sort_order = fields.Str(validate=validate.OneOf(['asc', 'desc']))
