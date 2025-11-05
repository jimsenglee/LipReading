"""
Schemas package - Data validation schemas
Following README.txt separation of concerns
"""

from .tutorial_schemas import TutorialCreateSchema, TutorialUpdateSchema, TutorialQuerySchema
from .quiz_schemas import (
    QuizCreateSchema, QuizUpdateSchema, QuizQuerySchema,
    QuizQuestionSchema, QuizQuestionUpdateSchema, QuizSubmissionSchema
)
from .category_schemas import CategoryCreateSchema, CategoryUpdateSchema, CategoryQuerySchema
from .user_schemas import UserCreateSchema, UserUpdateSchema, UserQuerySchema
from .feedback_schemas import FeedbackSubmissionSchema, FeedbackQuerySchema
from .practice_word_schemas import (
    PracticeWordCreateSchema, PracticeWordUpdateSchema, PracticeWordQuerySchema,
    PracticeWordBulkUpdateSchema
)

__all__ = [
    'TutorialCreateSchema',
    'TutorialUpdateSchema', 
    'TutorialQuerySchema',
    'QuizCreateSchema',
    'QuizUpdateSchema',
    'QuizQuerySchema',
    'QuizQuestionSchema',
    'QuizQuestionUpdateSchema',
    'QuizSubmissionSchema',
    'CategoryCreateSchema',
    'CategoryUpdateSchema',
    'CategoryQuerySchema',
    'UserCreateSchema',
    'UserUpdateSchema',
    'UserQuerySchema',
    'FeedbackSubmissionSchema',
    'FeedbackQuerySchema',
    'PracticeWordCreateSchema',
    'PracticeWordUpdateSchema',
    'PracticeWordQuerySchema',
    'PracticeWordBulkUpdateSchema'
]
