"""
Response service - Consistent API response formatting
Following README.txt separation of concerns
"""
from flask import jsonify
from typing import List, Dict, Any, Optional


class ResponseService:
    """Consistent API response formatting service"""
    
    @staticmethod
    def success_response(data: Any | None = None, message: str | None = None, pagination: Dict[str, Any] | None = None):
        """Standard success response format"""
        response: Dict[str, Any] = {'success': True}
        
        if data is not None:
            response['data'] = data
        if message:
            response['message'] = message
        if pagination:
            response['pagination'] = pagination
            
        return jsonify(response)
    
    @staticmethod
    def error_response(message: str, status_code: int = 400, details: Any = None):
        """Standard error response format"""
        response = {
            'success': False,
            'error': message
        }
        
        if details:
            response['details'] = details
            
        return jsonify(response), status_code
    
    @staticmethod
    def validation_error_response(errors: Dict):
        """Validation error response format"""
        return jsonify({
            'success': False,
            'error': 'Validation failed',
            'details': errors
        }), 400
    
    @staticmethod
    def pagination_info(page: int, per_page: int, total: int):
        """Generate pagination info"""
        total_pages = (total + per_page - 1) // per_page if total > 0 else 0
        
        return {
            'current_page': page,
            'per_page': per_page,
            'total_count': total,
            'total_pages': total_pages,
            'has_next': page < total_pages,
            'has_prev': page > 1
        }
