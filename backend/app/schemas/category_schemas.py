"""
Category validation schemas
Following README.txt separation of concerns
"""
from marshmallow import Schema, fields, validate


class CategoryCreateSchema(Schema):
    """Schema for creating categories"""
    name = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    status = fields.Str(validate=validate.OneOf(['active', 'inactive']), load_default='active')


class CategoryUpdateSchema(Schema):
    """Schema for updating categories"""
    name = fields.Str(validate=validate.Length(min=1, max=255))
    status = fields.Str(validate=validate.OneOf(['active', 'inactive']))


class CategoryQuerySchema(Schema):
    """Schema for category query parameters"""
    page = fields.Int(load_default=1, validate=validate.Range(min=1))
    per_page = fields.Int(load_default=10, validate=validate.Range(min=1, max=100))
    search = fields.Str(validate=validate.Length(max=255))
    status = fields.Str(validate=validate.OneOf(['active', 'inactive', 'all']))
    sort_by = fields.Str(validate=validate.OneOf(['id', 'name', 'created_at']))
    sort_order = fields.Str(validate=validate.OneOf(['asc', 'desc']))
