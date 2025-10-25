from flask import jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import sqlalchemy as sa
from sqlalchemy.orm import joinedload
from datetime import datetime
import os
import uuid
import json
from werkzeug.utils import secure_filename

from ..extensions import db
from ..models import Tutorial, Category, Account
from . import bp


@bp.get('/tutorials')
def list_tutorials():
    """
    get paginated list of tutorials with filtering and sorting
    query parameters:
    - page: page number (default: 1)
    - per_page: items per page (default: 10)
    - search: search term for title or description
    - category_id: filter by category
    - status: filter by status (published/draft/archived)
    - difficulty: filter by difficulty (beginner/intermediate/advanced)
    - sort_by: sort field (title, created_at, views, rating)
    - sort_order: sort direction (asc, desc)
    """
    try:
        # get query parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        search = request.args.get('search', '').strip()
        category_id = request.args.get('category_id', type=int)
        status = request.args.get('status', '').strip()
        difficulty = request.args.get('difficulty', '').strip()
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        
        # validate parameters
        if page < 1:
            page = 1
        if per_page < 1 or per_page > 100:
            per_page = 10
            
        # build base query with category join
        query = sa.select(Tutorial).options(joinedload(Tutorial.category))
        
        # exclude deleted records by default
        query = query.where(Tutorial.status != 'deleted')
        
        # apply filters
        if search:
            query = query.where(
                sa.or_(
                    Tutorial.title.ilike(f'%{search}%'),
                    Tutorial.description.ilike(f'%{search}%')
                )
            )
        
        if category_id:
            query = query.where(Tutorial.category_id == category_id)
            
        if status:
            query = query.where(Tutorial.status == status)
            
        if difficulty:
            query = query.where(Tutorial.difficulty == difficulty)
        
        # apply sorting
        sort_column = getattr(Tutorial, sort_by, Tutorial.created_at)
        if sort_order.lower() == 'desc':
            query = query.order_by(sa.desc(sort_column))
        else:
            query = query.order_by(sa.asc(sort_column))
        
        # get total count for pagination
        count_query = sa.select(sa.func.count()).select_from(query.subquery())
        total = db.session.scalar(count_query)
        
        # apply pagination
        offset = (page - 1) * per_page
        query = query.offset(offset).limit(per_page)
        
        # execute query
        tutorials = db.session.scalars(query).unique().all()
        
        # format response
        tutorial_list = []
        for t in tutorials:
            tutorial_list.append({
                'id': t.id,
                'publicId': t.public_id,
                'categoryId': t.category_id,
                'categoryName': t.category.category_name if t.category else None,
                'title': t.title,
                'description': t.description,
                'videoPath': t.video_path,
                'status': t.status,
                'difficulty': t.difficulty,
                'author': t.author,
                'thumbnailPath': t.thumbnail_path,
                'views': t.views,
                'rating': float(t.rating) if t.rating else 0.0,
                'createdAt': t.created_at.isoformat() if t.created_at else None,
                'updatedAt': t.updated_at.isoformat() if t.updated_at else None,
            })
        
        return jsonify({
            'success': True,
            'data': tutorial_list,
            'pagination': {
                'current_page': page,
                'per_page': per_page,
                'total_count': total,
                'total_pages': (total + per_page - 1) // per_page,
                'has_next': page < (total + per_page - 1) // per_page,
                'has_prev': page > 1
            }
        })
        
    except Exception as e:
        current_app.logger.error(f"Error listing tutorials: {str(e)}")
        return jsonify({'error': 'Failed to retrieve tutorials'}), 500


@bp.get('/tutorials/<int:tutorial_id>')
def get_tutorial(tutorial_id):
    """get single tutorial by id"""
    try:
        tutorial = db.session.scalar(
            sa.select(Tutorial).options(joinedload(Tutorial.category))
            .where(Tutorial.id == tutorial_id)
            .where(Tutorial.status != 'deleted')
        )
        
        if not tutorial:
            return jsonify({'error': 'Tutorial not found'}), 404
        
        # increment view count
        tutorial.views += 1
        db.session.commit()
        
        return jsonify({
            'id': tutorial.id,
            'publicId': tutorial.public_id,
            'categoryId': tutorial.category_id,
            'categoryName': tutorial.category.category_name if tutorial.category else None,
            'title': tutorial.title,
            'description': tutorial.description,
            'videoPath': tutorial.video_path,
            'status': tutorial.status,
            'difficulty': tutorial.difficulty,
            'author': tutorial.author,
            'thumbnailPath': tutorial.thumbnail_path,
            'duration': tutorial.video_duration,
            'learningObjectives': tutorial.learning_objectives,
            'prerequisites': tutorial.prerequisites,
            'tags': tutorial.tags,
            'isPreview': tutorial.is_preview,
            'seriesId': tutorial.parent_series_id,
            'seriesTitle': tutorial.video_title,
            'orderInSeries': tutorial.video_order,
            'totalVideosInSeries': None,  # This field doesn't exist in the model
            'views': tutorial.views,
            'rating': float(tutorial.rating) if tutorial.rating else 0.0,
            'createdAt': tutorial.created_at.isoformat() if tutorial.created_at else None,
            'updatedAt': tutorial.updated_at.isoformat() if tutorial.updated_at else None,
        })
        
    except Exception as e:
        current_app.logger.error(f"Error getting tutorial {tutorial_id}: {str(e)}")
        return jsonify({'error': 'Failed to retrieve tutorial'}), 500


@bp.post('/tutorials')
@jwt_required()
def create_tutorial():
    """create new tutorial (admin only)"""
    try:
        current_user_id = get_jwt_identity()
        
        # check if user is admin
        user = db.session.scalar(
            sa.select(Account).where(Account.id == current_user_id)
        )
        if not user or user.account_type != 'Administrator':
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # validate required fields
        required_fields = ['title', 'category_id', 'video_path']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # validate category exists
        category = db.session.scalar(
            sa.select(Category).where(Category.id == data['category_id'])
        )
        if not category:
            return jsonify({'error': 'Category not found'}), 400
        
        # generate public id
        public_id = f"TUT-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:4].upper()}"
        
        # create tutorial
        tutorial = Tutorial(
            public_id=public_id,
            category_id=data['category_id'],
            title=data['title'],
            description=data.get('description', ''),
            video_path=data['video_path'],
            status=data.get('status', 'draft'),
            difficulty=data.get('difficulty', 'beginner'),
            author=user.name,
            thumbnail_path=data.get('thumbnail_path'),
            views=0,
            rating=0.0
        )
        
        db.session.add(tutorial)
        db.session.commit()
        
        return jsonify({
            'id': tutorial.id,
            'publicId': tutorial.public_id,
            'message': 'Tutorial created successfully'
        }), 201
        
    except Exception as e:
        current_app.logger.error(f"Error creating tutorial: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to create tutorial'}), 500


@bp.delete('/tutorials/<int:tutorial_id>')
@jwt_required()
def delete_tutorial(tutorial_id):
    """delete tutorial (admin only)"""
    try:
        current_user_id = get_jwt_identity()
        
        # check if user is admin
        user = db.session.scalar(
            sa.select(Account).where(Account.id == current_user_id)
        )
        if not user or user.account_type != 'Administrator':
            return jsonify({'error': 'Admin access required'}), 403
        
        tutorial = db.session.scalar(
            sa.select(Tutorial).where(Tutorial.id == tutorial_id)
        )
        if not tutorial:
            return jsonify({'error': 'Tutorial not found'}), 404
        
        # soft delete tutorial (change status to deleted)
        tutorial.status = 'deleted'
        tutorial.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Tutorial deleted successfully'
        })
        
    except Exception as e:
        current_app.logger.error(f"Error deleting tutorial {tutorial_id}: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': 'Failed to delete tutorial',
            'message': str(e)
        }), 500


@bp.put('/tutorials/<int:tutorial_id>')
@jwt_required()
def update_tutorial(tutorial_id):
    """Update tutorial (including draft updates)"""
    try:
        current_user_id = get_jwt_identity()
        
        # Check if user is admin
        user = db.session.scalar(
            sa.select(Account).where(Account.id == current_user_id)
        )
        if not user or user.account_type != 'Administrator':
            return jsonify({'error': 'Admin access required'}), 403
        
        tutorial = db.session.scalar(
            sa.select(Tutorial).where(Tutorial.id == tutorial_id)
        )
        if not tutorial:
            return jsonify({'error': 'Tutorial not found'}), 404
        
        # Get form data
        title = request.form.get('title', '').strip()
        description = request.form.get('description', '').strip()
        category_id = request.form.get('categoryId', type=int)
        difficulty = request.form.get('difficulty', 'beginner')
        status = request.form.get('status', 'draft')
        learning_objectives = request.form.get('learningObjectives', '[]')
        prerequisites = request.form.get('prerequisites', '[]')
        tags = request.form.get('tags', '[]')
        
        # Validate required fields
        if not title:
            return jsonify({'error': 'Title is required'}), 400
        if not description:
            return jsonify({'error': 'Description is required'}), 400
        if not category_id:
            return jsonify({'error': 'Category is required'}), 400
        
        # Check if category exists
        category = Category.query.get(category_id)
        if not category:
            return jsonify({'error': 'Category not found'}), 404
        
        # Parse JSON fields
        try:
            learning_objectives_list = json.loads(learning_objectives) if learning_objectives else []
            prerequisites_list = json.loads(prerequisites) if prerequisites else []
            tags_list = json.loads(tags) if tags else []
        except json.JSONDecodeError:
            return jsonify({'error': 'Invalid JSON in learning objectives, prerequisites, or tags'}), 400
        
        # Handle thumbnail upload
        if 'thumbnail' in request.files:
            thumbnail_file = request.files['thumbnail']
            if thumbnail_file and thumbnail_file.filename:
                # Generate unique filename
                file_extension = os.path.splitext(thumbnail_file.filename)[1]
                filename = f"series_thumb_{uuid.uuid4().hex}{file_extension}"
                thumbnail_path = os.path.join('uploads/series/thumbnails', filename)
                
                # Create directory if it doesn't exist
                os.makedirs(os.path.dirname(thumbnail_path), exist_ok=True)
                thumbnail_file.save(thumbnail_path)
                tutorial.thumbnail_path = thumbnail_path
        
        # Update tutorial fields
        tutorial.title = title
        tutorial.description = description
        tutorial.category_id = category_id
        tutorial.difficulty = difficulty
        tutorial.status = status
        tutorial.learning_objectives = json.dumps(learning_objectives_list)
        tutorial.prerequisites = json.dumps(prerequisites_list)
        tutorial.tags = json.dumps(tags_list)
        tutorial.updated_at = datetime.utcnow()
        
        # Handle video data updates
        videos_data = []
        video_index = 0
        
        while f'videos[{video_index}][title]' in request.form:
            video_title = request.form.get(f'videos[{video_index}][title]', '').strip()
            video_description = request.form.get(f'videos[{video_index}][description]', '').strip()
            is_preview = request.form.get(f'videos[{video_index}][isPreview]', 'false').lower() == 'true'
            duration = request.form.get(f'videos[{video_index}][duration]', type=int)
            
            if not video_title:
                video_index += 1
                continue
            
            # Handle video file upload
            video_file_path = None
            if f'videos[{video_index}][videoFile]' in request.files:
                video_file = request.files[f'videos[{video_index}][videoFile]']
                if video_file and video_file.filename:
                    # Generate unique filename
                    file_extension = os.path.splitext(video_file.filename)[1]
                    filename = f"series_video_{uuid.uuid4().hex}{file_extension}"
                    video_file_path = os.path.join('uploads/series/videos', filename)
                    
                    # Create directory if it doesn't exist
                    os.makedirs(os.path.dirname(video_file_path), exist_ok=True)
                    video_file.save(video_file_path)
            
            # Store video data as JSON
            videos_data.append({
                'title': video_title,
                'description': video_description,
                'duration': duration,
                'file_path': video_file_path,
                'is_preview': is_preview,
                'order': video_index + 1
            })
            video_index += 1
        
        # Update video data
        tutorial.video_data = json.dumps(videos_data)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Tutorial {status} successfully',
            'tutorial': {
                'id': tutorial.id,
                'public_id': tutorial.public_id,
                'title': tutorial.title,
                'description': tutorial.description,
                'category_id': tutorial.category_id,
                'difficulty': tutorial.difficulty,
                'status': tutorial.status,
                'learning_objectives': learning_objectives_list,
                'prerequisites': prerequisites_list,
                'tags': tags_list,
                'thumbnail_path': tutorial.thumbnail_path,
                'updated_at': tutorial.updated_at.isoformat(),
                'videos_count': len(videos_data)
            }
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating tutorial {tutorial_id}: {str(e)}")
        return jsonify({'error': 'Failed to update tutorial'}), 500


@bp.post('/tutorials/<int:tutorial_id>/upload-thumbnail')
@jwt_required()
def upload_thumbnail(tutorial_id):
    """upload thumbnail for tutorial (admin only)"""
    try:
        current_user_id = get_jwt_identity()
        
        # check if user is admin
        user = db.session.scalar(
            sa.select(Account).where(Account.id == current_user_id)
        )
        if not user or user.account_type != 'Administrator':
            return jsonify({'error': 'Admin access required'}), 403
        
        tutorial = db.session.scalar(
            sa.select(Tutorial).where(Tutorial.id == tutorial_id)
        )
        if not tutorial:
            return jsonify({'error': 'Tutorial not found'}), 404
        
        if 'thumbnail' not in request.files:
            return jsonify({'error': 'No thumbnail file provided'}), 400
        
        file = request.files['thumbnail']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if file:
            # secure filename and add timestamp
            filename = secure_filename(file.filename)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"{timestamp}_{filename}"
            
            # create upload directory if it doesn't exist
            upload_dir = os.path.join(current_app.root_path, '..', 'uploads', 'tutorials', 'thumbnails')
            os.makedirs(upload_dir, exist_ok=True)
            
            # save file
            file_path = os.path.join(upload_dir, filename)
            file.save(file_path)
            
            # update tutorial with thumbnail path
            relative_path = f"tutorials/thumbnails/{filename}"
            tutorial.thumbnail_path = relative_path
            tutorial.updated_at = datetime.utcnow()
            db.session.commit()
            
            return jsonify({
                'thumbnailPath': relative_path,
                'message': 'Thumbnail uploaded successfully'
            })
        
    except Exception as e:
        current_app.logger.error(f"Error uploading thumbnail for tutorial {tutorial_id}: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to upload thumbnail'}), 500


@bp.post('/tutorials/series')
@jwt_required()
def create_tutorial_series():
    """
    Create a new tutorial series with multiple videos
    """
    try:
        # Get current user
        current_user_id = get_jwt_identity()
        current_user = Account.query.get(current_user_id)
        if not current_user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get form data
        title = request.form.get('title', '').strip()
        description = request.form.get('description', '').strip()
        category_id = request.form.get('categoryId', type=int)
        difficulty = request.form.get('difficulty', 'beginner')
        learning_objectives = request.form.get('learningObjectives', '[]')
        prerequisites = request.form.get('prerequisites', '[]')
        tags = request.form.get('tags', '[]')
        
        # Validate required fields
        if not title:
            return jsonify({'error': 'Title is required'}), 400
        if not description:
            return jsonify({'error': 'Description is required'}), 400
        if not category_id:
            return jsonify({'error': 'Category is required'}), 400
        
        # Check if category exists
        category = Category.query.get(category_id)
        if not category:
            return jsonify({'error': 'Category not found'}), 404
        
        # Parse JSON fields
        try:
            learning_objectives_list = json.loads(learning_objectives) if learning_objectives else []
            prerequisites_list = json.loads(prerequisites) if prerequisites else []
            tags_list = json.loads(tags) if tags else []
        except json.JSONDecodeError:
            return jsonify({'error': 'Invalid JSON in learning objectives, prerequisites, or tags'}), 400
        
        # Handle thumbnail upload
        thumbnail_path = None
        if 'thumbnail' in request.files:
            thumbnail_file = request.files['thumbnail']
            if thumbnail_file and thumbnail_file.filename:
                # Generate unique filename
                file_extension = os.path.splitext(thumbnail_file.filename)[1]
                filename = f"series_thumb_{uuid.uuid4().hex}{file_extension}"
                thumbnail_path = os.path.join('uploads/series/thumbnails', filename)
                
                # Create directory if it doesn't exist
                os.makedirs(os.path.dirname(thumbnail_path), exist_ok=True)
                thumbnail_file.save(thumbnail_path)
        
        # Create ONLY ONE tutorial record for the series
        # Store video information as JSON in the main tutorial record
        videos_data = []
        video_index = 0
        
        while f'videos[{video_index}][title]' in request.form:
            video_title = request.form.get(f'videos[{video_index}][title]', '').strip()
            video_description = request.form.get(f'videos[{video_index}][description]', '').strip()
            is_preview = request.form.get(f'videos[{video_index}][isPreview]', 'false').lower() == 'true'
            duration = request.form.get(f'videos[{video_index}][duration]', type=int)
            
            if not video_title:
                video_index += 1
                continue
            
            # Handle video file upload
            video_file_path = None
            if f'videos[{video_index}][videoFile]' in request.files:
                video_file = request.files[f'videos[{video_index}][videoFile]']
                if video_file and video_file.filename:
                    # Generate unique filename
                    file_extension = os.path.splitext(video_file.filename)[1]
                    filename = f"series_video_{uuid.uuid4().hex}{file_extension}"
                    video_file_path = os.path.join('uploads/series/videos', filename)
                    
                    # Create directory if it doesn't exist
                    os.makedirs(os.path.dirname(video_file_path), exist_ok=True)
                    video_file.save(video_file_path)
            
            # Store video data as JSON
            videos_data.append({
                'title': video_title,
                'description': video_description,
                'duration': duration,
                'file_path': video_file_path,
                'is_preview': is_preview,
                'order': video_index + 1
            })
            video_index += 1
        
        # Generate sequential public ID following seed.py pattern
        # Get the highest existing tutorial ID to determine next sequential number
        max_tutorial = db.session.scalar(sa.select(sa.func.max(Tutorial.id)))
        next_id = (max_tutorial or 0) + 1
        
        # Get status from form data (draft or published)
        status = request.form.get('status', 'published')
        
        # Create the main series tutorial with video data stored as JSON
        series_tutorial = Tutorial(
            public_id=f"TUT-{datetime.now().strftime('%Y%m%d')}-{next_id:04d}",
            category_id=category_id,
            title=title,
            description=description,
            video_path='/uploads/series/intro.mp4',  # Placeholder
            status=status,
            difficulty=difficulty,
            author=current_user.name,
            thumbnail_path=thumbnail_path,
            series_type='series',
            learning_objectives=json.dumps(learning_objectives_list),
            prerequisites=json.dumps(prerequisites_list),
            tags=json.dumps(tags_list),
            # Store videos as JSON in a single field
            video_data=json.dumps(videos_data)
        )
        
        db.session.add(series_tutorial)
        db.session.flush()  # Get the ID
        
        # Commit all changes
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Tutorial series created successfully',
            'series': {
                'id': series_tutorial.id,
                'public_id': series_tutorial.public_id,
                'title': series_tutorial.title,
                'description': series_tutorial.description,
                'category_id': series_tutorial.category_id,
                'difficulty': series_tutorial.difficulty,
                'learning_objectives': learning_objectives_list,
                'prerequisites': prerequisites_list,
                'tags': tags_list,
                'thumbnail_path': series_tutorial.thumbnail_path,
                'created_at': series_tutorial.created_at.isoformat(),
                'videos_count': len(videos_data)
            },
            'videos': videos_data
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating tutorial series: {str(e)}")
        return jsonify({'error': 'Failed to create tutorial series'}), 500


