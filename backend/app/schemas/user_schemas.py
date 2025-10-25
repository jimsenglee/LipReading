"""
User validation schemas
Following README.txt separation of concerns
"""
from marshmallow import Schema, fields, validate, validates_schema, ValidationError


class UserCreateSchema(Schema):
    """Schema for creating users"""
    name = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=6))
    account_type = fields.Str(validate=validate.OneOf(['User', 'Administrator']), load_default='User')


class UserUpdateSchema(Schema):
    """Schema for updating users"""
    name = fields.Str(validate=validate.Length(min=1, max=255))
    email = fields.Email()
    account_type = fields.Str(validate=validate.OneOf(['Student', 'Administrator']))
    status = fields.Str(validate=validate.OneOf(['active', 'inactive', 'deleted']))


class UserQuerySchema(Schema):
    """Schema for user query parameters"""
    page = fields.Int(load_default=1, validate=validate.Range(min=1))
    per_page = fields.Int(load_default=10, validate=validate.Range(min=1, max=100))
    search = fields.Str(validate=validate.Length(max=255))
    account_type = fields.Str(validate=validate.OneOf(['Student', 'Administrator', 'all']))
    status = fields.Str(validate=validate.OneOf(['active', 'inactive', 'deleted', 'all']))
    sort_by = fields.Str(validate=validate.OneOf(['id', 'name', 'email', 'created_at']))
    sort_order = fields.Str(validate=validate.OneOf(['asc', 'desc']))
