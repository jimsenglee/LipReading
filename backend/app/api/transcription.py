"""
Transcription API endpoints - Thin layer delegating to services
Following README.txt separation of concerns
"""
import os
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..services.transcription_service import TranscriptionService
from ..services.colab_ai_service import ColabAIService
from ..services.auth_service import AuthService
from ..services.response_service import ResponseService
from ..services.error_service import APIError, handle_api_error
from ..utils.file_handler import FileHandler

transcription_bp = Blueprint('transcription', __name__)


@transcription_bp.route('/transcriptions', methods=['GET'])
@jwt_required()
def get_transcriptions():
    """Get paginated list of user's transcriptions with filtering and sorting"""
    try:
        current_user_id = get_jwt_identity()
        return TranscriptionService.get_transcriptions(request.args, current_user_id)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to retrieve transcriptions: {str(e)}", 500)


@transcription_bp.route('/transcriptions', methods=['POST'])
@jwt_required()
def create_transcription():
    """Create new transcription with video upload"""
    try:
        current_user_id = get_jwt_identity()
        
        # Handle both JSON and form data (with file upload)
        if request.is_json:
            data = request.get_json()
            video_file = None
        else:
            # Handle form data with file upload
            data = {
                'title': request.form.get('title', '').strip() or 'Untitled Transcription',
                'duration_seconds': int(request.form.get('duration_seconds', 0))
            }
            video_file = request.files.get('video')
        
        # Create transcription record first
        result = TranscriptionService.create_transcription(data, current_user_id)
        transcription_data = result.get_json()
        
        # Process video if provided
        if video_file and video_file.filename and transcription_data.get('success'):
            transcription_id = transcription_data['data']['id']
            
            # Validate file type
            if not FileHandler.validate_video_file(video_file.filename):
                return ResponseService.error_response('Invalid video file type. Allowed: MP4, AVI, MOV, WMV, FLV, WebM, MKV', 400)
            
            # Validate file size (100MB max)
            if not FileHandler.validate_file_size(video_file, max_size_mb=100):
                return ResponseService.error_response('File size exceeds 100MB limit', 400)
            
            # Create upload directory
            upload_dir = FileHandler.create_upload_directory('uploads/transcriptions/videos')
            
            # Generate unique filename
            filename = FileHandler.generate_unique_filename(video_file.filename, 'trans')
            
            # Save file
            full_path = FileHandler.save_uploaded_file(video_file, upload_dir, filename)
            video_path = os.path.relpath(full_path, os.path.dirname(__file__) + '/../../')
            
            # Update transcription with video path
            TranscriptionService.update_transcription(transcription_id, {'video_source_path': video_path}, current_user_id)
            
            # Process video with Colab AI
            TranscriptionService.update_transcription_status(transcription_id, 'processing')
            
            ai_result = ColabAIService.process_video_file(full_path)
            
            if ai_result.get('success'):
                TranscriptionService.update_transcription(
                    transcription_id,
                    {
                        'content_text': ai_result.get('transcription'),
                        'processing_status': 'completed'
                    },
                    current_user_id
                )
            else:
                TranscriptionService.update_transcription_status(transcription_id, 'failed')
                return ResponseService.error_response(f"AI processing failed: {ai_result.get('error')}", 500)
        
        return result
        
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to create transcription: {str(e)}", 500)


@transcription_bp.route('/transcriptions/upload', methods=['POST'])
@jwt_required()
def upload_video():
    """Upload video file for transcription (alternative to POST /transcriptions with file)"""
    try:
        current_user_id = get_jwt_identity()
        print("\n" + "="*60)
        print("📹 VIDEO UPLOAD REQUEST RECEIVED")
        print("="*60)
        
        if 'video' not in request.files:
            print("❌ No video file provided")
            return ResponseService.error_response('No video file provided', 400)
        
        video_file = request.files['video']
        title = request.form.get('title', 'Untitled Transcription')
        
        print(f"📝 Title: {title}")
        print(f"📄 Filename: {video_file.filename}")
        
        if not video_file.filename or video_file.filename == '':
            print("❌ Empty filename")
            return ResponseService.error_response('Empty file', 400)
        
        # Validate file type
        if not FileHandler.validate_video_file(video_file.filename):
            print("❌ Invalid file type")
            return ResponseService.error_response('Invalid video file type', 400)
        
        # Validate file size
        if not FileHandler.validate_file_size(video_file, max_size_mb=100):
            print("❌ File too large")
            return ResponseService.error_response('File size exceeds 100MB limit', 400)
        
        print("✅ File validation passed")
        
        # Create upload directory
        upload_dir = FileHandler.create_upload_directory('uploads/transcriptions/videos')
        
        # Generate unique filename
        filename = FileHandler.generate_unique_filename(video_file.filename or 'video.mp4', 'trans')
        
        # Save file
        full_path = FileHandler.save_uploaded_file(video_file, upload_dir, filename)
        video_path = os.path.relpath(full_path, os.path.dirname(__file__) + '/../../')
        
        print(f"💾 Saved to: {full_path}")
        
        # Create transcription record
        data = {
            'title': title,
            'video_source_path': video_path,
            'duration_seconds': 0  # Will be calculated if needed
        }
        result = TranscriptionService.create_transcription(data, current_user_id)
        transcription_data = result.get_json()
        transcription_id = transcription_data['data']['id']
        
        print(f"📊 Created transcription record ID: {transcription_id}")
        
        # Process video with Colab AI
        print("🔄 Updating status to 'processing'...")
        TranscriptionService.update_transcription_status(transcription_id, 'processing')
        
        print("🤖 Sending to Colab AI server...")
        ai_result = ColabAIService.process_video_file(full_path)
        
        print(f"📥 Colab response: success={ai_result.get('success')}")
        
        if ai_result.get('success'):
            TranscriptionService.update_transcription(
                transcription_id,
                {
                    'content_text': ai_result.get('transcription'),
                    'processing_status': 'completed'
                },
                current_user_id
            )
            print("✅ Transcription completed successfully!")
            print("="*60 + "\n")
            return ResponseService.success_response({'transcriptionId': transcription_id, 'transcription': ai_result.get('transcription')}, message="Transcription complete")
        else:
            print(f"❌ Colab processing failed: {ai_result.get('error')}")
            TranscriptionService.update_transcription_status(transcription_id, 'failed')
            print("="*60 + "\n")
            return ResponseService.error_response(f"AI processing failed: {ai_result.get('error')}", 500)
        
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        print(f"❌ Upload error: {str(e)}")
        print("="*60 + "\n")
        return ResponseService.error_response(f"Failed to upload video: {str(e)}", 500)


@transcription_bp.route('/transcriptions/<int:transcription_id>', methods=['GET'])
@jwt_required()
def get_transcription(transcription_id: int):
    """Get single transcription by ID"""
    try:
        current_user_id = get_jwt_identity()
        return TranscriptionService.get_transcription(transcription_id, current_user_id)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to retrieve transcription: {str(e)}", 500)


@transcription_bp.route('/transcriptions/<int:transcription_id>', methods=['PUT'])
@jwt_required()
def update_transcription(transcription_id: int):
    """Update existing transcription"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        if not data:
            return ResponseService.error_response('No data provided', 400)
        
        return TranscriptionService.update_transcription(transcription_id, data, current_user_id)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to update transcription: {str(e)}", 500)


@transcription_bp.route('/transcriptions/<int:transcription_id>', methods=['DELETE'])
@jwt_required()
def delete_transcription(transcription_id: int):
    """Delete transcription"""
    try:
        current_user_id = get_jwt_identity()
        return TranscriptionService.delete_transcription(transcription_id, current_user_id)
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        return ResponseService.error_response(f"Failed to delete transcription: {str(e)}", 500)

