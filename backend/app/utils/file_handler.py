"""
File handling utilities
Following README.txt separation of concerns
"""
import os
import uuid
from werkzeug.utils import secure_filename
from flask import current_app


class FileHandler:
    """File upload and management utilities"""
    
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
