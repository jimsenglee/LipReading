"""
Feedback validation schemas
Following README.txt separation of concerns
"""
from marshmallow import Schema, fields, validate, ValidationError


class FeedbackSubmissionSchema(Schema):
    """Schema for submitting feedback"""
    feedback_type = fields.Str(
        required=True, 
        validate=validate.OneOf(['general', 'bug', 'feature']),
        error_messages={'required': 'Feedback type is required'}
    )
    description = fields.Str(
        required=True, 
        validate=validate.Length(min=10, max=5000),
        error_messages={
            'required': 'Description is required',
            'invalid': 'Description must be between 10 and 5000 characters'
        }
    )
    attached_file_path = fields.Str(
        required=False,
        allow_none=True
    )


class FeedbackQuerySchema(Schema):
    """Schema for querying feedback with filtering and pagination"""
    page = fields.Int(load_default=1, validate=validate.Range(min=1))
    per_page = fields.Int(load_default=10, validate=validate.Range(min=1, max=100))
    search = fields.Str(validate=validate.Length(max=255))
    feedback_type = fields.Str(validate=validate.OneOf(['general', 'bug', 'feature', 'all']))
    status = fields.Str(validate=validate.OneOf(['New', 'In Progress', 'Resolved', 'Closed', 'all']))
    sort_by = fields.Str(validate=validate.OneOf(['id', 'submission_date', 'feedback_type', 'status']))
    sort_order = fields.Str(validate=validate.OneOf(['asc', 'desc']))


class FeedbackUpdateSchema(Schema):
    """Schema for admin feedback updates"""
    status = fields.Str(
        required=False,
        validate=validate.OneOf(['New', 'In Progress', 'Resolved', 'Closed'])
    )
    admin_response = fields.Str(
        required=False,
        validate=validate.Length(max=5000),
        allow_none=True
    )

