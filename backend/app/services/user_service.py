"""
User business logic service
Following README.txt separation of concerns
"""
import sqlalchemy as sa
from typing import Dict, Any

from ..extensions import db
from ..models import Account
from ..schemas.user_schemas import UserCreateSchema, UserUpdateSchema, UserQuerySchema
from ..services.response_service import ResponseService
from ..services.error_service import APIError
from ..utils.id_generator import generate_public_id


class UserService:
    """User business logic service"""
    
    @staticmethod
    def get_users(params: Dict[str, Any]):
        """Get paginated list of users with filtering and sorting"""
        try:
            # Validate query parameters
            schema = UserQuerySchema()
            validated_params = schema.load(params)
            
            # Build base query
            query = sa.select(Account)
            query = query.where(Account.status != 'deleted')
            
            # Apply filters
            if validated_params.get('search'):
                search_term = validated_params['search']
                query = query.where(
                    sa.or_(
                        Account.name.ilike(f'%{search_term}%'),
                        Account.email.ilike(f'%{search_term}%')
                    )
                )
            
            if validated_params.get('account_type') and validated_params['account_type'] != 'all':
                query = query.where(Account.account_type == validated_params['account_type'])
            
            if validated_params.get('status') and validated_params['status'] != 'all':
                query = query.where(Account.status == validated_params['status'])
            
            # Apply sorting
            sort_by = validated_params.get('sort_by', 'id')
            sort_order = validated_params.get('sort_order', 'asc')
            
            sort_column = getattr(Account, sort_by, Account.id)
            
            if sort_order.lower() == 'desc':
                query = query.order_by(sa.desc(sort_column))
            else:
                query = query.order_by(sa.asc(sort_column))
            
            # Get total count
            count_query = sa.select(sa.func.count()).select_from(query.subquery())
            total = db.session.scalar(count_query)
            
            # Apply pagination
            page = validated_params.get('page', 1)
            per_page = validated_params.get('per_page', 10)
            offset = (page - 1) * per_page
            query = query.offset(offset).limit(per_page)
            
            # Execute query
            users = db.session.scalars(query).all()
            
            # Format response
            user_list = []
            for u in users:
                user_list.append({
                    'id': u.id,
                    'publicId': u.public_id,
                    'name': u.name,
                    'email': u.email,
                    'accountType': u.account_type,
                    'status': u.status,
                    'registrationDate': u.registration_date.isoformat() if u.registration_date else None,
                })
            
            pagination = ResponseService.pagination_info(page, per_page, total)
            return ResponseService.success_response(user_list, pagination=pagination)
            
        except Exception as e:
            raise APIError(f"Failed to retrieve users: {str(e)}", 500)
    
    @staticmethod
    def create_user(data: Dict[str, Any]):
        """Create new user"""
        try:
            # Validate input data
            schema = UserCreateSchema()
            validated_data = schema.load(data)
            
            # Check if email already exists
            existing_user = db.session.scalar(
                sa.select(Account).where(Account.email == validated_data['email'])
            )
            if existing_user:
                raise APIError("Email already exists", 400)
            
            # Generate public ID
            public_id = generate_public_id(Account, "USR")
            
            # Hash password (you'll need to implement this)
            # For now, storing plain text (NOT RECOMMENDED FOR PRODUCTION)
            password_hash = validated_data['password']  # TODO: Hash password
            
            # Create user
            user = Account(
                public_id=public_id,
                name=validated_data['name'],
                email=validated_data['email'],
                password_hash=password_hash,
                account_type=validated_data.get('account_type', 'Student'),
                status='active'
            )
            
            db.session.add(user)
            db.session.commit()
            
            return ResponseService.success_response({
                'id': user.id,
                'publicId': user.public_id,
                'message': 'User created successfully'
            })
            
        except APIError:
            raise
        except Exception as e:
            db.session.rollback()
            raise APIError(f"Failed to create user: {str(e)}", 500)
    
    @staticmethod
    def update_user(user_id: int, data: Dict[str, Any]):
        """Update existing user"""
        try:
            # Validate input data
            schema = UserUpdateSchema()
            validated_data = schema.load(data)
            
            user = db.session.scalar(
                sa.select(Account).where(Account.id == user_id)
            )
            if not user:
                raise APIError("User not found", 404)
            
            # Update fields
            for field, value in validated_data.items():
                if hasattr(user, field):
                    setattr(user, field, value)
            
            db.session.commit()
            
            return ResponseService.success_response({
                'id': user.id,
                'publicId': user.public_id,
                'message': 'User updated successfully'
            })
            
        except APIError:
            raise
        except Exception as e:
            db.session.rollback()
            raise APIError(f"Failed to update user: {str(e)}", 500)
    
    @staticmethod
    def delete_user(user_id: int):
        """Soft delete user"""
        try:
            user = db.session.scalar(
                sa.select(Account).where(Account.id == user_id)
            )
            if not user:
                raise APIError("User not found", 404)
            
            # Prevent deleting administrator accounts
            if user.account_type == 'Administrator':
                raise APIError("Cannot delete administrator account", 400)
            
            # Soft delete
            user.status = 'deleted'
            db.session.commit()
            
            return ResponseService.success_response({
                'message': 'User deleted successfully'
            })
            
        except APIError:
            raise
        except Exception as e:
            db.session.rollback()
            raise APIError(f"Failed to delete user: {str(e)}", 500)
