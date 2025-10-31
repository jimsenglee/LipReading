"""
Quiz validation schemas
Following README.txt separation of concerns
"""
from marshmallow import Schema, fields, validate, validates_schema, ValidationError


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
    
    # quiz settings for user experience
    passing_score = fields.Int(validate=validate.Range(min=0, max=100), load_default=70)
    max_attempts = fields.Int(validate=validate.Range(min=0), load_default=3)  # 0 means unlimited
    shuffle_questions = fields.Bool(load_default=False)
    shuffle_answers = fields.Bool(load_default=False)
    show_results_immediately = fields.Bool(load_default=True)
    
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
    
    # quiz settings for user experience
    passing_score = fields.Int(validate=validate.Range(min=0, max=100))
    max_attempts = fields.Int(validate=validate.Range(min=0))
    shuffle_questions = fields.Bool()
    shuffle_answers = fields.Bool()
    show_results_immediately = fields.Bool()
    
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
    """Schema for quiz question creation and management with polymorphic support"""
    quiz_id = fields.Int(required=True)
    question_type = fields.Str(required=True, validate=validate.OneOf(['video_mcq', 'true_false']))
    question_text = fields.Str(validate=validate.Length(max=2000))  # required for true_false
    points = fields.Int(validate=validate.Range(min=1), load_default=1)
    explanation = fields.Str(validate=validate.Length(max=2000))
    
    # video_mcq specific fields (required only for video_mcq)
    video_clip_path = fields.Str(validate=validate.Length(max=500))
    correct_answer = fields.Str(required=True, validate=validate.Length(max=255))
    incorrect_options = fields.List(fields.Str(), validate=validate.Length(min=1, max=10))
    
    @validates_schema
    def validate_polymorphic_fields(self, data, **kwargs):
        """validate fields based on question_type"""
        question_type = data.get('question_type')
        
        if question_type == 'video_mcq':
            # video_mcq requires video_clip_path and incorrect_options
            if not data.get('video_clip_path'):
                raise ValidationError("video_clip_path is required for video_mcq questions", field_name='video_clip_path')
            if not data.get('incorrect_options') or len(data.get('incorrect_options', [])) < 1:
                raise ValidationError("incorrect_options (at least 1) is required for video_mcq questions", field_name='incorrect_options')
        elif question_type == 'true_false':
            # true_false requires question_text
            if not data.get('question_text'):
                raise ValidationError("question_text is required for true_false questions", field_name='question_text')
            # correct_answer must be 'True' or 'False'
            correct_answer = data.get('correct_answer', '').strip()
            if correct_answer.lower() not in ['true', 'false']:
                raise ValidationError("correct_answer must be 'True' or 'False' for true_false questions", field_name='correct_answer')
            data['correct_answer'] = 'True' if correct_answer.lower() == 'true' else 'False'


class QuizQuestionUpdateSchema(Schema):
    """Schema for updating quiz questions with polymorphic support"""
    question_type = fields.Str(validate=validate.OneOf(['video_mcq', 'true_false']))
    question_text = fields.Str(validate=validate.Length(max=2000))
    points = fields.Int(validate=validate.Range(min=1))
    explanation = fields.Str(validate=validate.Length(max=2000))
    
    # video_mcq specific fields
    video_clip_path = fields.Str(validate=validate.Length(max=500))
    correct_answer = fields.Str(validate=validate.Length(max=255))
    incorrect_options = fields.List(fields.Str(), validate=validate.Length(min=1, max=10))
    
    @validates_schema
    def validate_polymorphic_fields(self, data, **kwargs):
        """validate fields based on question_type if provided"""
        question_type = data.get('question_type')
        if not question_type:
            return  # if question_type not provided, skip polymorphic validation
        
        if question_type == 'video_mcq':
            # if updating to video_mcq, require video_clip_path and incorrect_options
            if 'video_clip_path' in data and not data.get('video_clip_path'):
                raise ValidationError("video_clip_path is required for video_mcq questions", field_name='video_clip_path')
            if 'incorrect_options' in data and (not data.get('incorrect_options') or len(data.get('incorrect_options', [])) < 1):
                raise ValidationError("incorrect_options (at least 1) is required for video_mcq questions", field_name='incorrect_options')
        elif question_type == 'true_false':
            # if updating to true_false, require question_text
            if 'question_text' in data and not data.get('question_text'):
                raise ValidationError("question_text is required for true_false questions", field_name='question_text')
            # correct_answer must be 'True' or 'False'
            if 'correct_answer' in data:
                correct_answer = data.get('correct_answer', '').strip()
                if correct_answer.lower() not in ['true', 'false']:
                    raise ValidationError("correct_answer must be 'True' or 'False' for true_false questions", field_name='correct_answer')
                data['correct_answer'] = 'True' if correct_answer.lower() == 'true' else 'False'


class QuizSubmissionSchema(Schema):
    """Schema for submitting quiz answers (user-side)"""
    answers = fields.Dict(required=True)  # {question_id: answer} mapping
    
    @validates_schema
    def validate_answers(self, data, **kwargs):
        """validate answers dictionary structure"""
        answers = data.get('answers', {})
        if not isinstance(answers, dict):
            raise ValidationError("answers must be a dictionary mapping question_id to answer", field_name='answers')
        if len(answers) == 0:
            raise ValidationError("answers cannot be empty", field_name='answers')
