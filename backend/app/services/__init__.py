"""
Services package - Business logic layer
Following README.txt separation of concerns
"""

from .auth_service import AuthService
from .tutorial_service import TutorialService
from .quiz_service import QuizService
from .category_service import CategoryService
from .user_service import UserService
from .transcription_service import TranscriptionService
from .colab_ai_service import ColabAIService
from .response_service import ResponseService
from .error_service import APIError, handle_api_error

__all__ = [
    'AuthService',
    'TutorialService', 
    'QuizService',
    'CategoryService',
    'UserService',
    'TranscriptionService',
    'ColabAIService',
    'ResponseService',
    'APIError',
    'handle_api_error'
]
