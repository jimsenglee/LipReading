"""
Category validation schemas
Following README.txt separation of concerns
"""
from marshmallow import Schema, fields, validate


class CategoryCreateSchema(Schema):
    """Schema for creating categories"""
    name = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    status = fields.Str(validate=validate.OneOf(['active', 'inactive']), load_default='active')
    
    # additional fields for user education
    description = fields.Str(validate=validate.Length(max=1000))
    icon = fields.Str(validate=validate.Length(max=100))  # icon class or path
    color = fields.Str(validate=validate.Length(max=7))  # hex color code
    sort_order = fields.Int(validate=validate.Range(min=0))


class CategoryUpdateSchema(Schema):
    """Schema for updating categories"""
    name = fields.Str(validate=validate.Length(min=1, max=255))
    status = fields.Str(validate=validate.OneOf(['active', 'inactive']))
    
    # additional fields for user education
    description = fields.Str(validate=validate.Length(max=1000))
    icon = fields.Str(validate=validate.Length(max=100))  # icon class or path
    color = fields.Str(validate=validate.Length(max=7))  # hex color code
    sort_order = fields.Int(validate=validate.Range(min=0))


class CategoryQuerySchema(Schema):
    """Schema for category query parameters"""
    page = fields.Int(load_default=1, validate=validate.Range(min=1))
    per_page = fields.Int(load_default=10, validate=validate.Range(min=1, max=100))
    search = fields.Str(validate=validate.Length(max=255))
    status = fields.Str(validate=validate.OneOf(['active', 'inactive', 'all']))
    sort_by = fields.Str(validate=validate.OneOf(['id', 'name', 'created_at', 'sort_order', 'tutorial_count', 'quiz_count']))
    sort_order = fields.Str(validate=validate.OneOf(['asc', 'desc']))
    
    # additional filtering for user education
    include_stats = fields.Bool(load_default=False)  # include tutorial/quiz counts
    with_content = fields.Bool(load_default=False)  # only categories with content


class CategoryStatsSchema(Schema):
    """Schema for category statistics and analytics"""
    category_id = fields.Int(required=True)
    tutorial_count = fields.Int(validate=validate.Range(min=0))
    quiz_count = fields.Int(validate=validate.Range(min=0))
    total_views = fields.Int(validate=validate.Range(min=0))
    average_rating = fields.Float(validate=validate.Range(min=0.0, max=5.0))
    last_updated = fields.DateTime()


class CategoryBulkUpdateSchema(Schema):
    """Schema for bulk category operations"""
    category_ids = fields.List(fields.Int(), required=True, validate=validate.Length(min=1))
    action = fields.Str(required=True, validate=validate.OneOf(['activate', 'deactivate', 'delete']))
    data = fields.Dict()  # additional data for the action
