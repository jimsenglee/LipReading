"""
review system validation schemas
Following README.txt separation of concerns
"""
from marshmallow import Schema, fields, validate


class ReviewSubmissionSchema(Schema):
    """schema for review submission"""
    rating = fields.Int(required=True, validate=validate.Range(min=1, max=5))
    review_text = fields.Str(validate=validate.Length(max=1000))


class ReviewQuerySchema(Schema):
    """schema for review query parameters"""
    page = fields.Int(validate=validate.Range(min=1), missing=1)
    per_page = fields.Int(validate=validate.Range(min=1, max=100), missing=10)
    rating_min = fields.Int(validate=validate.Range(min=1, max=5))
    rating_max = fields.Int(validate=validate.Range(min=1, max=5))
    has_text = fields.Bool()
    tutorial_id = fields.Int(validate=validate.Range(min=1))
    sort_by = fields.Str(validate=validate.OneOf(['rating', 'reviewed_at']), missing='reviewed_at')
    sort_order = fields.Str(validate=validate.OneOf(['asc', 'desc']), missing='desc')


class ReviewModerationSchema(Schema):
    """schema for review moderation"""
    action = fields.Str(required=True, validate=validate.OneOf(['approve', 'reject', 'flag']))
    reason = fields.Str(validate=validate.Length(max=500))
    admin_notes = fields.Str(validate=validate.Length(max=1000))
