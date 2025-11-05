"""
Practice Word validation schemas
Following README.txt separation of concerns
"""
from marshmallow import Schema, fields, validate


class PracticeWordCreateSchema(Schema):
    """Schema for creating practice words"""
    word = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    category_id = fields.Int(required=True, validate=validate.Range(min=1))
    phonetics = fields.Str(validate=validate.Length(max=255))
    description = fields.Str(validate=validate.Length(max=1000))
    video_path = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    difficulty = fields.Str(validate=validate.OneOf(['beginner', 'intermediate', 'advanced']), load_default='beginner')
    status = fields.Str(validate=validate.OneOf(['active', 'inactive']), load_default='active')
    sort_order = fields.Int(validate=validate.Range(min=0), load_default=0)


class PracticeWordUpdateSchema(Schema):
    """Schema for updating practice words"""
    word = fields.Str(validate=validate.Length(min=1, max=255))
    category_id = fields.Int(validate=validate.Range(min=1))
    phonetics = fields.Str(validate=validate.Length(max=255))
    description = fields.Str(validate=validate.Length(max=1000))
    video_path = fields.Str(validate=validate.Length(min=1, max=255))
    difficulty = fields.Str(validate=validate.OneOf(['beginner', 'intermediate', 'advanced']))
    status = fields.Str(validate=validate.OneOf(['active', 'inactive']))
    sort_order = fields.Int(validate=validate.Range(min=0))


class PracticeWordQuerySchema(Schema):
    """Schema for practice word query parameters"""
    page = fields.Int(load_default=1, validate=validate.Range(min=1))
    per_page = fields.Int(load_default=10, validate=validate.Range(min=1, max=100))
    search = fields.Str(validate=validate.Length(max=255))
    category = fields.Int(validate=validate.Range(min=1))
    difficulty = fields.Str(validate=validate.OneOf(['beginner', 'intermediate', 'advanced', 'all']))
    status = fields.Str(validate=validate.OneOf(['active', 'inactive', 'all']))
    sort_by = fields.Str(validate=validate.OneOf(['id', 'word', 'difficulty', 'sort_order', 'created_at']))
    sort_order = fields.Str(validate=validate.OneOf(['asc', 'desc']))


class PracticeWordBulkUpdateSchema(Schema):
    """Schema for bulk practice word operations"""
    word_ids = fields.List(fields.Int(), required=True, validate=validate.Length(min=1))
    action = fields.Str(required=True, validate=validate.OneOf(['activate', 'deactivate', 'delete']))
    data = fields.Dict()  # additional data for the action

