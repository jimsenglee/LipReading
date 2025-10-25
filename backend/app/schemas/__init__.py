"""
Schemas package - Data validation schemas
Following README.txt separation of concerns
"""

from .tutorial_schemas import TutorialCreateSchema, TutorialUpdateSchema, TutorialQuerySchema
from .quiz_schemas import QuizCreateSchema, QuizUpdateSchema, QuizQuerySchema
from .category_schemas import CategoryCreateSchema, CategoryUpdateSchema, CategoryQuerySchema
from .user_schemas import UserCreateSchema, UserUpdateSchema, UserQuerySchema

__all__ = [
    'TutorialCreateSchema',
    'TutorialUpdateSchema', 
    'TutorialQuerySchema',
    'QuizCreateSchema',
    'QuizUpdateSchema',
    'QuizQuerySchema',
    'CategoryCreateSchema',
    'CategoryUpdateSchema',
    'CategoryQuerySchema',
    'UserCreateSchema',
    'UserUpdateSchema',
    'UserQuerySchema'
]
