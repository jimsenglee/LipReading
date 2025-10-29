"""
Quiz validation schemas
Following README.txt separation of concerns
"""
from marshmallow import Schema, fields, validate


class QuizCreateSchema(Schema):
    """Schema for creating quizzes"""
    title = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    description = fields.Str(validate=validate.Length(max=2000))
    category_id = fields.Int(required=True)
    status = fields.Str(validate=validate.OneOf(['active', 'inactive']), load_default='active')
    difficulty = fields.Str(validate=validate.OneOf(['beginner', 'intermediate', 'advanced']))
    author = fields.Str(validate=validate.Length(max=255))
    thumbnail_path = fields.Str(validate=validate.Length(max=500))
    total_questions = fields.Int(validate=validate.Range(min=0))
    estimated_duration = fields.Int(validate=validate.Range(min=0))
    tags = fields.List(fields.Str(), load_default=[])
    
    # quiz series fields for user education
    series_type = fields.Str(validate=validate.OneOf(['single', 'series']))
    parent_series_id = fields.Int()
    quiz_order = fields.Int(validate=validate.Range(min=1))
    quiz_title = fields.Str(validate=validate.Length(max=255))
    quiz_description = fields.Str(validate=validate.Length(max=2000))


class QuizUpdateSchema(Schema):
    """Schema for updating quizzes"""
    title = fields.Str(validate=validate.Length(min=1, max=255))
    description = fields.Str(validate=validate.Length(max=2000))
    category_id = fields.Int()
    status = fields.Str(validate=validate.OneOf(['active', 'inactive']))
    difficulty = fields.Str(validate=validate.OneOf(['beginner', 'intermediate', 'advanced']))
    author = fields.Str(validate=validate.Length(max=255))
    thumbnail_path = fields.Str(validate=validate.Length(max=500))
    total_questions = fields.Int(validate=validate.Range(min=0))
    estimated_duration = fields.Int(validate=validate.Range(min=0))
    tags = fields.List(fields.Str())
    
    # quiz series fields for user education
    series_type = fields.Str(validate=validate.OneOf(['single', 'series']))
    parent_series_id = fields.Int()
    quiz_order = fields.Int(validate=validate.Range(min=1))
    quiz_title = fields.Str(validate=validate.Length(max=255))
    quiz_description = fields.Str(validate=validate.Length(max=2000))


class QuizQuerySchema(Schema):
    """Schema for quiz query parameters"""
    page = fields.Int(load_default=1, validate=validate.Range(min=1))
    per_page = fields.Int(load_default=10, validate=validate.Range(min=1, max=100))
    search = fields.Str(validate=validate.Length(max=255))
    category_id = fields.Int()
    status = fields.Str(validate=validate.OneOf(['active', 'inactive', 'all']))
    difficulty = fields.Str(validate=validate.OneOf(['beginner', 'intermediate', 'advanced']))
    sort_by = fields.Str(validate=validate.OneOf(['id', 'title', 'created_at', 'updated_at', 'views', 'rating', 'quiz_order', 'estimated_duration']))
    sort_order = fields.Str(validate=validate.OneOf(['asc', 'desc']))
    
    # quiz series filtering for user education
    series_type = fields.Str(validate=validate.OneOf(['single', 'series', 'all']))
    parent_series_id = fields.Int()
    author = fields.Str(validate=validate.Length(max=255))
    tags = fields.Str(validate=validate.Length(max=255))  # comma-separated tags


class QuizSeriesSchema(Schema):
    """Schema for quiz series creation and management"""
    title = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    description = fields.Str(validate=validate.Length(max=2000))
    category_id = fields.Int(required=True)
    difficulty = fields.Str(validate=validate.OneOf(['beginner', 'intermediate', 'advanced']))
    status = fields.Str(validate=validate.OneOf(['active', 'inactive']))
    author = fields.Str(validate=validate.Length(max=255))
    thumbnail_path = fields.Str(validate=validate.Length(max=500))
    tags = fields.List(fields.Str(), load_default=[])
    
    # quiz series specific fields
    quizzes = fields.List(fields.Dict(), load_default=[])  # list of quiz data for series
    estimated_duration = fields.Int(validate=validate.Range(min=0))  # total estimated duration
    total_questions = fields.Int(validate=validate.Range(min=0))  # total questions across all quizzes


class QuizSeriesUpdateSchema(Schema):
    """Schema for updating quiz series"""
    title = fields.Str(validate=validate.Length(min=1, max=255))
    description = fields.Str(validate=validate.Length(max=2000))
    category_id = fields.Int()
    difficulty = fields.Str(validate=validate.OneOf(['beginner', 'intermediate', 'advanced']))
    status = fields.Str(validate=validate.OneOf(['active', 'inactive']))
    author = fields.Str(validate=validate.Length(max=255))
    thumbnail_path = fields.Str(validate=validate.Length(max=500))
    tags = fields.List(fields.Str())
    
    # quiz series specific fields
    quizzes = fields.List(fields.Dict())  # list of quiz data for series
    estimated_duration = fields.Int(validate=validate.Range(min=0))
    total_questions = fields.Int(validate=validate.Range(min=0))


class QuizQuestionSchema(Schema):
    """Schema for quiz question creation and management"""
    quiz_id = fields.Int(required=True)
    video_clip_path = fields.Str(required=True, validate=validate.Length(max=500))
    correct_answer = fields.Str(required=True, validate=validate.Length(max=255))
    incorrect_options = fields.List(fields.Str(), required=True, validate=validate.Length(min=1, max=10))


class QuizQuestionUpdateSchema(Schema):
    """Schema for updating quiz questions"""
    video_clip_path = fields.Str(validate=validate.Length(max=500))
    correct_answer = fields.Str(validate=validate.Length(max=255))
    incorrect_options = fields.List(fields.Str(), validate=validate.Length(min=1, max=10))
