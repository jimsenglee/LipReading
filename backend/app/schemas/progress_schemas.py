"""
progress tracking validation schemas
Following README.txt separation of concerns
"""
from marshmallow import Schema, fields, validate


class ProgressUpdateSchema(Schema):
    """schema for updating progress"""
    progress_percentage = fields.Int(validate=validate.Range(min=0, max=100))
    last_watched_position = fields.Int(validate=validate.Range(min=0))
    total_watch_time = fields.Int(validate=validate.Range(min=0))
    is_completed = fields.Bool()


class QuizAttemptSchema(Schema):
    """schema for quiz attempt submission"""
    score = fields.Float(required=True, validate=validate.Range(min=0.0, max=100.0))
    answers = fields.List(fields.Dict(), missing=[])


class ProgressQuerySchema(Schema):
    """schema for progress query parameters"""
    page = fields.Int(validate=validate.Range(min=1), missing=1)
    per_page = fields.Int(validate=validate.Range(min=1, max=100), missing=10)
    status = fields.Str(validate=validate.OneOf(['all', 'completed', 'in-progress']), missing='all')
    category_id = fields.Int(validate=validate.Range(min=1))
    difficulty = fields.Str(validate=validate.OneOf(['beginner', 'intermediate', 'advanced']))
    sort_by = fields.Str(validate=validate.OneOf(['title', 'progress_percentage', 'enrolled_at', 'last_accessed', 'completed_at', 'score', 'quiz_title', 'completion_date']), missing='enrolled_at')
    sort_order = fields.Str(validate=validate.OneOf(['asc', 'desc']), missing='desc')
