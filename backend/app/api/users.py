from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import select, func, desc, asc
from sqlalchemy.orm import joinedload
from ..models.account import Account
from ..models.user import User
from ..models.administrator import Administrator
from .. import db
import math

users_bp = Blueprint('users', __name__)

@users_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    """
    get paginated list of users with filtering and sorting
    query parameters:
    - page: page number (default: 1)
    - per_page: items per page (default: 10)
    - search: search term for name or email
    - role: filter by role (admin, user, all)
    - sort_by: sort field (name, email, created_at, last_active)
    - sort_order: sort direction (asc, desc)
    """
    try:
        current_user = get_jwt_identity()
        # Get query parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        search = request.args.get('search', '').strip()
        role_filter = request.args.get('role', 'all')
        sort_by = request.args.get('sort_by', 'name')
        sort_order = request.args.get('sort_order', 'asc')
        
        # Validate parameters
        if page < 1:
            page = 1
        if per_page < 1 or per_page > 100:
            per_page = 10
            
        # Build base query
        query = select(Account)
        
        # exclude deleted records by default
        query = query.where(Account.status != 'deleted')
        
        # Apply search filter
        if search:
            search_term = f"%{search}%"
            query = query.where(
                (Account.name.ilike(search_term)) | 
                (Account.email.ilike(search_term))
            )
        
        # Apply role filter
        if role_filter != 'all':
            if role_filter == 'admin':
                query = query.where(Account.account_type == 'Administrator')
            elif role_filter == 'user':
                query = query.where(Account.account_type == 'User')
        
        # Apply sorting
        sort_column = getattr(Account, sort_by, Account.name)
        if sort_order == 'desc':
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))
        
        # Get total count for pagination
        count_query = select(func.count(Account.id))
        if search:
            search_term = f"%{search}%"
            count_query = count_query.where(
                (Account.name.ilike(search_term)) | 
                (Account.email.ilike(search_term))
            )
        if role_filter != 'all':
            if role_filter == 'admin':
                count_query = count_query.where(Account.account_type == 'Administrator')
            elif role_filter == 'user':
                count_query = count_query.where(Account.account_type == 'User')
        
        total_count = db.session.scalar(count_query)
        
        # Apply pagination
        offset = (page - 1) * per_page
        query = query.offset(offset).limit(per_page)
        
        # execute query
        accounts = db.session.scalars(query).all()
        
        # format response data
        users_data = []
        for account in accounts:
            user_data = {
                'id': account.id,
                'public_id': account.public_id,
                'name': account.name,
                'email': account.email,
                'role': 'admin' if account.account_type == 'Administrator' else 'user',
                'created_at': account.registration_date.isoformat() if account.registration_date else None,
                'last_active': None,  # field doesn't exist in model yet
                'profile_image_path': account.profile_image_path,
                'is_active': True,  # default to active since field doesn't exist
                'sessions_count': 0  # mock data for now
            }
            users_data.append(user_data)
        
        # Calculate pagination info
        total_pages = math.ceil(total_count / per_page) if total_count > 0 else 1
        
        response_data = {
            'success': True,
            'data': users_data,
            'pagination': {
                'current_page': page,
                'per_page': per_page,
                'total_count': total_count,
                'total_pages': total_pages,
                'has_next': page < total_pages,
                'has_prev': page > 1
            }
        }
        return jsonify(response_data), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching users: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch users',
            'message': str(e)
        }), 500

@users_bp.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Get specific user details"""
    try:
        account = db.session.scalar(select(Account).where(Account.id == user_id))
        
        if not account:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        user_data = {
            'id': account.id,
            'public_id': account.public_id,
            'name': account.name,
            'email': account.email,
            'role': 'admin' if account.account_type == 'Administrator' else 'user',
            'created_at': account.registration_date.isoformat() if account.registration_date else None,
            'last_active': None,  # field doesn't exist in model yet
            'profile_image_path': account.profile_image_path,
            'is_active': True,  # default to active since field doesn't exist
            'sessions_count': 0  # mock data for now
        }
        
        return jsonify({
            'success': True,
            'data': user_data
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching user {user_id}: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch user',
            'message': str(e)
        }), 500

@users_bp.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """Update user information"""
    try:
        data = request.get_json()
        
        account = db.session.scalar(select(Account).where(Account.id == user_id))
        if not account:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        # Update fields
        if 'name' in data:
            account.name = data['name']
        if 'email' in data:
            account.email = data['email']
        if 'is_active' in data:
            account.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'User updated successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating user {user_id}: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to update user',
            'message': str(e)
        }), 500

@users_bp.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Delete user account"""
    try:
        account = db.session.scalar(select(Account).where(Account.id == user_id))
        if not account:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        # Prevent deleting the current admin user
        if account.account_type == 'Administrator':
            return jsonify({
                'success': False,
                'error': 'Cannot delete administrator account'
            }), 400
        
        # soft delete user (change status to deleted)
        account.status = 'deleted'
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'User deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting user {user_id}: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to delete user',
            'message': str(e)
        }), 500
