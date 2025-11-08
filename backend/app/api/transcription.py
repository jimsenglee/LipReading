"""
Transcription API endpoints - Thin layer delegating to services
Following README.txt separation of concerns
"""
import os
import time
from flask import Blueprint, request, current_app
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


@transcription_bp.route('/transcriptions/practice/realtime', methods=['POST'])
@jwt_required()
def process_practice_realtime():
    """Process real-time practice video frames for transcription (batch processing like realtime)"""
    try:
        current_user_id = get_jwt_identity()
        
        print("\n" + "="*60)
        print("[BACKEND] ===== PRACTICE REALTIME REQUEST RECEIVED =====")
        print("="*60)
        print(f"[BACKEND] User ID: {current_user_id}")
        print(f"[BACKEND] Request method: {request.method}")
        print(f"[BACKEND] Content-Type: {request.content_type}")
        print(f"[BACKEND] Has files: {bool(request.files)}")
        
        # check if frames are provided (support both single frame and batch)
        if 'frame' in request.files:
            # single frame mode (legacy support)
            frame_file = request.files['frame']
            frame_files = [frame_file]
            print(f"[BACKEND] Single frame mode detected")
        elif 'frames' in request.files:
            # batch frames mode (preferred)
            frame_files = request.files.getlist('frames')
            print(f"[BACKEND] Batch frames mode detected: {len(frame_files)} frames")
        else:
            print(f"[BACKEND] ERROR: No video frame(s) provided")
            print(f"[BACKEND] Available form keys: {list(request.form.keys())}")
            print(f"[BACKEND] Available file keys: {list(request.files.keys())}")
            return ResponseService.error_response('No video frame(s) provided', 400)
        
        word_id = request.form.get('word_id')
        print(f"[BACKEND] Word ID: {word_id}")
        
        if not frame_files or len(frame_files) == 0:
            return ResponseService.error_response('Empty frame file(s)', 400)
        
        # for single frame, we need to collect more frames or use existing batch logic
        # for now, if single frame, we'll create a minimal video (duplicate frame)
        if len(frame_files) == 1:
            print(f"[DEBUG] Single frame provided - duplicating to create minimal video")
            # duplicate frame 25 times to create 1 second video
            frame_files = frame_files * 25
        
        if len(frame_files) < 25:
            return ResponseService.error_response(f'Not enough frames. Need at least 25 frames, got {len(frame_files)}', 400)
        
        print(f"[BACKEND] Processing {len(frame_files)} frames for practice transcription")
        
        # save frames temporarily and create video from them (like realtime endpoint)
        import tempfile
        import cv2
        import numpy as np
        
        temp_dir = tempfile.gettempdir()
        frames_dir = os.path.join(temp_dir, f"practice_frames_{current_user_id}_{int(time.time() * 1000)}")
        os.makedirs(frames_dir, exist_ok=True)
        print(f"[BACKEND] Created frames directory: {frames_dir}")
        
        # save all frames
        frame_paths = []
        for idx, frame_file in enumerate(frame_files):
            frame_filename = f"frame_{idx:04d}.jpg"
            frame_path = os.path.join(frames_dir, frame_filename)
            frame_file.save(frame_path)
            frame_paths.append(frame_path)
        
        print(f"[BACKEND] Saved {len(frame_paths)} frames to {frames_dir}")
        
        # create video from frames
        video_output_path = os.path.join(temp_dir, f"practice_video_{current_user_id}_{int(time.time() * 1000)}.mp4")
        
        try:
            # read first frame to get dimensions
            first_frame = cv2.imread(frame_paths[0], cv2.IMREAD_GRAYSCALE)
            if first_frame is None:
                raise ValueError("Could not read first frame")
            
            height, width = first_frame.shape
            print(f"[DEBUG] Video dimensions: {width}x{height}, {len(frame_paths)} frames")
            
            # create video writer (25fps)
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')  # type: ignore[attr-defined]
            out = cv2.VideoWriter(video_output_path, fourcc, 25.0, (width, height), False)
            
            # write all frames to video
            for frame_path in frame_paths:
                frame = cv2.imread(frame_path, cv2.IMREAD_GRAYSCALE)
                if frame is not None:
                    out.write(frame)
            
            out.release()
            print(f"[BACKEND] Created practice video file: {video_output_path}")
            print(f"[BACKEND] Video file size: {os.path.getsize(video_output_path) if os.path.exists(video_output_path) else 'N/A'} bytes")
            
            # process video with colab ai
            print(f"[BACKEND] Sending practice video to Colab AI for processing...")
            ai_result = ColabAIService.process_video_file(video_output_path)
            
            print(f"[BACKEND] ===== PRACTICE COLAB AI RESULT ======")
            print(f"[BACKEND] AI Result success: {ai_result.get('success')}")
            print(f"[BACKEND] AI Result transcription: {ai_result.get('transcription', 'N/A')}")
            print(f"[BACKEND] AI Result error: {ai_result.get('error', 'N/A')}")
            print(f"[BACKEND] ===== END PRACTICE AI RESULT =====")
            
            # cleanup temp files
            try:
                if os.path.exists(video_output_path):
                    os.remove(video_output_path)
                for frame_path in frame_paths:
                    if os.path.exists(frame_path):
                        os.remove(frame_path)
                if os.path.exists(frames_dir):
                    os.rmdir(frames_dir)
            except Exception as cleanup_error:
                print(f"[DEBUG] Cleanup error (non-critical): {cleanup_error}")
            
            if ai_result.get('success'):
                transcription_text = ai_result.get('transcription', '')
                print(f"[BACKEND] ===== PRACTICE TRANSCRIPTION RESULT ======")
                print(f"[BACKEND] Transcription text: '{transcription_text}'")
                print(f"[BACKEND] Transcription length: {len(transcription_text)} characters")
                print(f"[BACKEND] Word ID: {word_id}")
                print(f"[BACKEND] ===== END PRACTICE RESULT ======")
                print("="*60 + "\n")
                return ResponseService.success_response({
                    'transcription': transcription_text,
                    'word_id': word_id
                }, message="Practice frame processed successfully")
            else:
                error_msg = ai_result.get('error', 'Unknown error')
                print(f"[BACKEND] ===== PRACTICE PROCESSING FAILED ======")
                print(f"[BACKEND] Error: {error_msg}")
                print(f"[BACKEND] Word ID: {word_id}")
                print(f"[BACKEND] ===== END PRACTICE ERROR ======")
                print("="*60 + "\n")
                return ResponseService.error_response(f"Processing failed: {error_msg}", 500)
                
        except Exception as video_error:
            print(f"[BACKEND] ===== PRACTICE VIDEO CREATION ERROR ======")
            print(f"[BACKEND] Error: {str(video_error)}")
            import traceback
            traceback.print_exc()
            print(f"[BACKEND] ===== END VIDEO CREATION ERROR ======")
            # cleanup on error
            try:
                if os.path.exists(video_output_path):
                    os.remove(video_output_path)
                for frame_path in frame_paths:
                    if os.path.exists(frame_path):
                        os.remove(frame_path)
                if os.path.exists(frames_dir):
                    os.rmdir(frames_dir)
            except Exception as cleanup_err:
                print(f"[BACKEND] Cleanup error (non-critical): {cleanup_err}")
            print("="*60 + "\n")
            return ResponseService.error_response(f"Video creation failed: {str(video_error)}", 500)
        
    except APIError as e:
        print(f"[BACKEND] API Error: {str(e)}")
        print("="*60 + "\n")
        return handle_api_error(e)
    except Exception as e:
        print(f"[BACKEND] ===== PRACTICE REALTIME ERROR ======")
        print(f"[BACKEND] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        print(f"[BACKEND] ===== END PRACTICE REALTIME ERROR ======")
        print("="*60 + "\n")
        return ResponseService.error_response(f"Failed to process frame: {str(e)}", 500)


@transcription_bp.route('/transcriptions/realtime', methods=['POST'])
@jwt_required()
def process_realtime_transcription():
    """Process real-time transcription - collect frames and create video for processing"""
    try:
        current_user_id = get_jwt_identity()
        
        # check if frames are provided (multiple frames for video creation)
        if 'frames' not in request.files:
            return ResponseService.error_response('No video frames provided', 400)
        
        frame_files = request.files.getlist('frames')
        
        if not frame_files or len(frame_files) < 25:  # need at least 1 second at 25fps
            return ResponseService.error_response(f'Not enough frames provided. Need at least 25 frames, got {len(frame_files) if frame_files else 0}', 400)
        
        print(f"[DEBUG] Received {len(frame_files)} frames for realtime transcription")
        
        # save frames temporarily and create video from them (like colab cell)
        import tempfile
        import cv2
        import numpy as np
        
        temp_dir = tempfile.gettempdir()
        frames_dir = os.path.join(temp_dir, f"realtime_frames_{current_user_id}_{int(time.time() * 1000)}")
        os.makedirs(frames_dir, exist_ok=True)
        
        # save all frames
        frame_paths = []
        for idx, frame_file in enumerate(frame_files):
            frame_filename = f"frame_{idx:04d}.jpg"
            frame_path = os.path.join(frames_dir, frame_filename)
            frame_file.save(frame_path)
            frame_paths.append(frame_path)
        
        print(f"[DEBUG] Saved {len(frame_paths)} frames to {frames_dir}")
        
        # create video from frames (like colab cell process_recorded_video)
        video_output_path = os.path.join(temp_dir, f"realtime_video_{current_user_id}_{int(time.time() * 1000)}.mp4")
        
        try:
            # read first frame to get dimensions
            first_frame = cv2.imread(frame_paths[0], cv2.IMREAD_GRAYSCALE)
            if first_frame is None:
                raise ValueError("Could not read first frame")
            
            height, width = first_frame.shape
            print(f"[DEBUG] Video dimensions: {width}x{height}, {len(frame_paths)} frames")
            
            # create video writer (25fps like colab cell)
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')  # type: ignore[attr-defined]
            out = cv2.VideoWriter(video_output_path, fourcc, 25.0, (width, height), False)
            
            # write all frames to video
            for frame_path in frame_paths:
                frame = cv2.imread(frame_path, cv2.IMREAD_GRAYSCALE)
                if frame is not None:
                    out.write(frame)
            
            out.release()
            print(f"[DEBUG] Created video file: {video_output_path}")
            
            # process video with colab ai (like video upload feature)
            print(f"[DEBUG] Sending video to Colab AI for processing...")
            print(f"[DEBUG] Video file exists: {os.path.exists(video_output_path)}")
            print(f"[DEBUG] Video file size: {os.path.getsize(video_output_path) if os.path.exists(video_output_path) else 'N/A'} bytes")
            
            ai_result = ColabAIService.process_video_file(video_output_path)
            
            print(f"[DEBUG] ===== COLAB AI RESULT ======")
            print(f"[DEBUG] AI Result success: {ai_result.get('success')}")
            print(f"[DEBUG] AI Result transcription: {ai_result.get('transcription', 'N/A')}")
            print(f"[DEBUG] AI Result error: {ai_result.get('error', 'N/A')}")
            print(f"[DEBUG] ===== END COLAB AI RESULT =====")
            
            # cleanup temp files
            try:
                if os.path.exists(video_output_path):
                    os.remove(video_output_path)
                for frame_path in frame_paths:
                    if os.path.exists(frame_path):
                        os.remove(frame_path)
                if os.path.exists(frames_dir):
                    os.rmdir(frames_dir)
            except Exception as cleanup_error:
                print(f"[DEBUG] Cleanup error (non-critical): {cleanup_error}")
            
            if ai_result.get('success'):
                transcription_text = ai_result.get('transcription', '')
                print(f"[DEBUG] ===== FINAL TRANSCRIPTION RESULT ======")
                print(f"[DEBUG] Transcription text: '{transcription_text}'")
                print(f"[DEBUG] Transcription length: {len(transcription_text)} characters")
                print(f"[DEBUG] ===== END FINAL RESULT ======")
                return ResponseService.success_response({
                    'transcription': transcription_text
                }, message="Frames processed successfully")
            else:
                error_msg = ai_result.get('error', 'Unknown error')
                print(f"[DEBUG] ===== PROCESSING FAILED ======")
                print(f"[DEBUG] Error: {error_msg}")
                print(f"[DEBUG] ===== END ERROR ======")
                return ResponseService.error_response(f"Processing failed: {error_msg}", 500)
                
        except Exception as video_error:
            print(f"[DEBUG] Video creation error: {str(video_error)}")
            import traceback
            traceback.print_exc()
            # cleanup on error
            try:
                if os.path.exists(video_output_path):
                    os.remove(video_output_path)
                for frame_path in frame_paths:
                    if os.path.exists(frame_path):
                        os.remove(frame_path)
                if os.path.exists(frames_dir):
                    os.rmdir(frames_dir)
            except:
                pass
            return ResponseService.error_response(f"Video creation failed: {str(video_error)}", 500)
        
    except APIError as e:
        return handle_api_error(e)
    except Exception as e:
        print(f"[DEBUG] Realtime transcription error: {str(e)}")
        import traceback
        traceback.print_exc()
        return ResponseService.error_response(f"Failed to process frames: {str(e)}", 500)

