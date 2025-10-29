"""
File handling utilities for admin and user education modules
Following README.txt separation of concerns
"""
import os
import uuid
import mimetypes
from werkzeug.utils import secure_filename
from flask import current_app
from typing import Dict, Any, Optional


class FileHandler:
    """File upload and management utilities for both admin and user education modules"""
    
    # supported file types for different modules
    SUPPORTED_VIDEO_TYPES = {'.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'}
    SUPPORTED_IMAGE_TYPES = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'}
    SUPPORTED_SUBTITLE_TYPES = {'.vtt', '.srt', '.ass', '.ssa'}
    SUPPORTED_DOCUMENT_TYPES = {'.pdf', '.doc', '.docx', '.txt', '.md'}
    
    @staticmethod
    def generate_unique_filename(original_filename: str, prefix: str = ""):
        """Generate unique filename with prefix"""
        file_extension = os.path.splitext(original_filename)[1]
        unique_id = uuid.uuid4().hex
        filename = f"{prefix}_{unique_id}{file_extension}" if prefix else f"{unique_id}{file_extension}"
        return secure_filename(filename)
    
    @staticmethod
    def create_upload_directory(path: str):
        """Create upload directory if it doesn't exist"""
        full_path = os.path.join(current_app.root_path, '..', path)
        os.makedirs(full_path, exist_ok=True)
        return full_path
    
    @staticmethod
    def save_uploaded_file(file, upload_path: str, filename: str):
        """Save uploaded file to specified path"""
        full_path = os.path.join(upload_path, filename)
        file.save(full_path)
        return full_path
    
    @staticmethod
    def get_relative_path(full_path: str):
        """Convert absolute path to relative path for storage"""
        # Remove the backend root path to get relative path
        backend_root = os.path.join(current_app.root_path, '..')
        return os.path.relpath(full_path, backend_root)
    
    @staticmethod
    def validate_file_type(filename: str, allowed_types: set) -> bool:
        """Validate file type against allowed types"""
        file_extension = os.path.splitext(filename)[1].lower()
        return file_extension in allowed_types
    
    @staticmethod
    def get_file_info(file_path: str) -> Dict[str, Any]:
        """Get file information including size, type, and metadata"""
        try:
            if not os.path.exists(file_path):
                return {}
            
            stat = os.stat(file_path)
            mime_type, _ = mimetypes.guess_type(file_path)
            
            return {
                'size': stat.st_size,
                'mime_type': mime_type,
                'extension': os.path.splitext(file_path)[1].lower(),
                'created_at': stat.st_ctime,
                'modified_at': stat.st_mtime
            }
        except Exception as e:
            current_app.logger.error(f"Error getting file info: {str(e)}")
            return {}
    
    @staticmethod
    def validate_video_file(filename: str) -> bool:
        """Validate video file type for user education module"""
        return FileHandler.validate_file_type(filename, FileHandler.SUPPORTED_VIDEO_TYPES)
    
    @staticmethod
    def validate_image_file(filename: str) -> bool:
        """Validate image file type for user education module"""
        return FileHandler.validate_file_type(filename, FileHandler.SUPPORTED_IMAGE_TYPES)
    
    @staticmethod
    def validate_subtitle_file(filename: str) -> bool:
        """Validate subtitle file type for user education module"""
        return FileHandler.validate_file_type(filename, FileHandler.SUPPORTED_SUBTITLE_TYPES)
    
    @staticmethod
    def get_education_upload_paths() -> Dict[str, str]:
        """Get upload paths for user education module"""
        return {
            'videos': 'uploads/series/videos',
            'thumbnails': 'uploads/series/thumbnails', 
            'subtitles': 'uploads/series/subtitles',
            'documents': 'uploads/education/documents'
        }
    
    @staticmethod
    def create_education_directories():
        """Create all necessary directories for user education module"""
        paths = FileHandler.get_education_upload_paths()
        for path_type, path in paths.items():
            FileHandler.create_upload_directory(path)
    
    @staticmethod
    def cleanup_orphaned_files(file_paths: list[str]) -> int:
        """Clean up orphaned files (files not referenced in database)"""
        cleaned_count = 0
        try:
            for file_path in file_paths:
                full_path = os.path.join(current_app.root_path, '..', file_path)
                if os.path.exists(full_path):
                    os.remove(full_path)
                    cleaned_count += 1
                    current_app.logger.info(f"Cleaned up orphaned file: {file_path}")
        except Exception as e:
            current_app.logger.error(f"Error cleaning up files: {str(e)}")
        
        return cleaned_count
    
    @staticmethod
    def get_file_url(file_path: str, base_url: str | None = None) -> str:
        """Generate file URL for frontend access"""
        if not file_path:
            return ""
        
        # convert backslashes to forward slashes for URLs
        normalized_path = file_path.replace('\\', '/')
        
        if base_url:
            return f"{base_url}/{normalized_path}"
        else:
            # return relative path for frontend to handle
            return f"/{normalized_path}"
    
    @staticmethod
    def validate_file_size(file, max_size_mb: int = 100) -> bool:
        """Validate file size"""
        try:
            file.seek(0, 2)  # seek to end
            file_size = file.tell()
            file.seek(0)  # reset to beginning
            
            max_size_bytes = max_size_mb * 1024 * 1024
            return file_size <= max_size_bytes
        except Exception:
            return False

    @staticmethod
    def organize_education_files():
        """organize files in education directories for better management"""
        try:
            paths = FileHandler.get_education_upload_paths()
            organized_count = 0
            
            for path_type, path in paths.items():
                full_path = os.path.join(current_app.root_path, '..', path)
                if os.path.exists(full_path):
                    # ensure directory structure is clean
                    FileHandler.create_upload_directory(path)
                    organized_count += 1
            
            current_app.logger.info(f"organized {organized_count} education directories")
            return organized_count
            
        except Exception as e:
            current_app.logger.error(f"error organizing education files: {str(e)}")
            return 0

    @staticmethod
    def get_education_file_statistics() -> Dict[str, Any]:
        """get statistics about education files for monitoring"""
        try:
            paths = FileHandler.get_education_upload_paths()
            stats = {}
            total_files = 0
            total_size = 0
            
            for path_type, path in paths.items():
                full_path = os.path.join(current_app.root_path, '..', path)
                if os.path.exists(full_path):
                    files = os.listdir(full_path)
                    file_count = len([f for f in files if os.path.isfile(os.path.join(full_path, f))])
                    
                    # calculate total size for this directory
                    dir_size = 0
                    for file in files:
                        file_path = os.path.join(full_path, file)
                        if os.path.isfile(file_path):
                            dir_size += os.path.getsize(file_path)
                    
                    stats[path_type] = {
                        'file_count': file_count,
                        'total_size_mb': round(dir_size / (1024 * 1024), 2)
                    }
                    
                    total_files += file_count
                    total_size += dir_size
            
            stats['total'] = {
                'file_count': total_files,
                'total_size_mb': round(total_size / (1024 * 1024), 2)
            }
            
            return stats
            
        except Exception as e:
            current_app.logger.error(f"error getting education file statistics: {str(e)}")
            return {}

    @staticmethod
    def validate_education_file_access(file_path: str) -> bool:
        """validate that file is accessible for user education module"""
        try:
            if not file_path:
                return False
            
            # check if file exists
            full_path = os.path.join(current_app.root_path, '..', file_path)
            if not os.path.exists(full_path):
                return False
            
            # check if file is in allowed education directories
            education_paths = FileHandler.get_education_upload_paths()
            allowed_dirs = list(education_paths.values())
            
            for allowed_dir in allowed_dirs:
                if file_path.startswith(allowed_dir):
                    return True
            
            return False
            
        except Exception as e:
            current_app.logger.error(f"error validating education file access: {str(e)}")
            return False
