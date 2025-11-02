"""
Feedback validation schemas
Following README.txt separation of concerns
"""
from marshmallow import Schema, fields, validate, validates_schema, ValidationError


class FeedbackCreateSchema(Schema):
    """Schema for creating feedback"""
    feedback_type = fields.Str(required=True, validate=validate.OneOf(['general', 'bug', 'feature']))
    description = fields.Str(required=True, validate=validate.Length(min=10, max=5000))
    attached_file_path = fields.Str(required=False, allow_none=True, validate=validate.Length(max=255))


class FeedbackQuerySchema(Schema):
    """Schema for feedback query parameters"""
    page = fields.Int(load_default=1, validate=validate.Range(min=1))
    per_page = fields.Int(load_default=10, validate=validate.Range(min=1, max=100))
    search = fields.Str(validate=validate.Length(max=255))
    feedback_type = fields.Str(validate=validate.OneOf(['general', 'bug', 'feature', 'all']))
    status = fields.Str(validate=validate.OneOf(['New', 'In Progress', 'Resolved', 'all']))
    sort_by = fields.Str(validate=validate.OneOf(['id', 'submission_date', 'feedback_type', 'status']))
    sort_order = fields.Str(validate=validate.OneOf(['asc', 'desc']))


class FeedbackUpdateSchema(Schema):
    """Schema for updating feedback (admin only)"""
    status = fields.Str(validate=validate.OneOf(['New', 'In Progress', 'Resolved']))
    reviewed_by_admin_id = fields.Int(required=False, allow_none=True)

