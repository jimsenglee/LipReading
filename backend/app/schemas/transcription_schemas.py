"""
Transcription validation schemas
Following README.txt separation of concerns
"""
from marshmallow import Schema, fields, validate


class TranscriptionCreateSchema(Schema):
    """Schema for creating transcriptions"""
    title = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    video_source_path = fields.Str(validate=validate.Length(max=500))
    duration_seconds = fields.Int(validate=validate.Range(min=0))


class TranscriptionUpdateSchema(Schema):
    """Schema for updating transcriptions"""
    title = fields.Str(validate=validate.Length(min=1, max=255))
    content_text = fields.Str()
    timestamps_json = fields.Str()
    processing_status = fields.Str(validate=validate.OneOf(['pending', 'processing', 'completed', 'failed']))
    gdrive_file_id = fields.Str(validate=validate.Length(max=255))
    colab_job_id = fields.Str(validate=validate.Length(max=255))
    duration_seconds = fields.Int(validate=validate.Range(min=0))


class TranscriptionQuerySchema(Schema):
    """Schema for querying transcriptions with filtering and pagination"""
    page = fields.Int(validate=validate.Range(min=1), load_default=1)
    per_page = fields.Int(validate=validate.Range(min=1, max=100), load_default=10)
    search = fields.Str(validate=validate.Length(max=200))
    status = fields.Str(validate=validate.OneOf(['pending', 'processing', 'completed', 'failed']))
    sort_by = fields.Str(validate=validate.OneOf(['creation_date', 'title', 'processed_at']), load_default='creation_date')
    sort_order = fields.Str(validate=validate.OneOf(['asc', 'desc']), load_default='desc')

