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
            try:
                validated_params = schema.load(params)
                if not isinstance(validated_params, dict):
                    validated_params = {}
            except Exception:
                validated_params = {}
            
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
            
            # handle role filter (frontend sends 'role' but backend uses 'account_type')
            account_type = validated_params.get('account_type')
            if not account_type and params.get('role'):
                # map frontend role to backend account_type
                role_mapping = {
                    'admin': 'Administrator',
                    'user': 'Student'
                }
                role = params.get('role')
                if role and role != 'all' and role in role_mapping:
                    account_type = role_mapping[role]
            
            if account_type and account_type != 'all':
                query = query.where(Account.account_type == account_type)
            
            if validated_params.get('status') and validated_params['status'] != 'all':
                query = query.where(Account.status == validated_params['status'])
            
            # Apply sorting
            sort_by = validated_params.get('sort_by', 'id')
            sort_order = validated_params.get('sort_order', 'asc')
            
            # map frontend sort_by to backend column names
            sort_mapping = {
                'created_at': 'registration_date',
                'name': 'name',
                'email': 'email',
                'last_active': 'registration_date'  # TODO: implement last_active tracking
            }
            backend_sort_by = sort_mapping.get(sort_by, sort_by)
            
            sort_column = getattr(Account, backend_sort_by, Account.id)
            
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
            
            # Format response to match frontend expectations
            user_list = []
            for u in users:
                # map account_type to role for frontend
                role_mapping = {
                    'Administrator': 'admin',
                    'Student': 'user',
                    'User': 'user'
                }
                role = role_mapping.get(u.account_type, 'user')
                
                user_list.append({
                    'id': u.id,
                    'public_id': u.public_id,
                    'name': u.name,
                    'email': u.email,
                    'role': role,
                    'created_at': u.registration_date.isoformat() if u.registration_date else None,
                    'last_active': None,  # TODO: implement last active tracking
                    'profile_image_path': u.profile_image_path,
                    'is_active': u.status == 'active',
                })
            
            pagination = ResponseService.pagination_info(page, per_page, total or 0)
            return ResponseService.success_response(user_list, pagination=pagination)
            
        except Exception as e:
            raise APIError(f"Failed to retrieve users: {str(e)}", 500)
    
    @staticmethod
    def create_user(data: Dict[str, Any]):
        """Create new user"""
        try:
            # Validate input data
            schema = UserCreateSchema()
            try:
                validated_data = schema.load(data)
                if not isinstance(validated_data, dict):
                    raise APIError("Invalid data format", 400)
            except Exception as e:
                raise APIError(f"Validation failed: {str(e)}", 400)
            
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
            user = Account()
            user.public_id = public_id
            user.name = validated_data['name']
            user.email = validated_data['email']
            user.password_hash = password_hash
            user.account_type = validated_data.get('account_type', 'Student')
            user.status = 'active'
            
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
            try:
                validated_data = schema.load(data)
                if not isinstance(validated_data, dict):
                    validated_data = {}
            except Exception:
                validated_data = {}
            
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
