"""
Error service - Consistent error handling
Following README.txt separation of concerns
"""
from typing import Any
from flask import jsonify, current_app


class APIError(Exception):
    """Custom API error class"""
    def __init__(self, message: str, status_code: int = 400, details: Any = None):
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(self.message)


def handle_api_error(error):
    """Global error handler for API errors"""
    current_app.logger.error(f"API Error: {error.message}")
    
    return jsonify({
        'success': False,
        'error': error.message,
        'details': error.details
    }), error.status_code


def handle_generic_error(error):
    """Global error handler for generic errors"""
    current_app.logger.error(f"Generic Error: {str(error)}")
    
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500
