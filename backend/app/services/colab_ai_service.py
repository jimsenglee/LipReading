"""
Colab AI Service - Communicates with external Colab GPU server
Following README.txt separation of concerns
"""
import requests
import os
from flask import current_app
from typing import Dict, Any, Optional


class ColabAIService:
    """Service to communicate with Google Colab AI processing server"""
    
    @staticmethod
    def get_colab_url() -> Optional[str]:
        """Get Colab server URL from environment"""
        return os.getenv('COLAB_SERVER_URL') or current_app.config.get('COLAB_SERVER_URL')
    
    @staticmethod
    def is_colab_available() -> bool:
        """Check if Colab server is available"""
        url = ColabAIService.get_colab_url()
        if not url:
            return False
        
        try:
            response = requests.get(f"{url}/health", timeout=5)
            return response.status_code == 200
        except Exception as e:
            current_app.logger.error(f"Colab server check failed: {e}")
            return False
    
    @staticmethod
    def process_video_file(video_path: str) -> Dict[str, Any]:
        """
        Process video file through Colab AI server
        
        Args:
            video_path: Path to video file to process
            
        Returns:
            Dict with transcription result or error
        """
        url = ColabAIService.get_colab_url()
        if not url:
            return {
                'success': False,
                'error': 'Colab server URL not configured'
            }
        
        # Check if file exists
        if not os.path.exists(video_path):
            return {
                'success': False,
                'error': 'Video file not found'
            }
        
        try:
            # Prepare file for upload
            with open(video_path, 'rb') as f:
                files = {'video': (os.path.basename(video_path), f, 'video/mp4')}
                
                # Send to Colab
                current_app.logger.info(f"Sending video to Colab: {url}/process_video")
                response = requests.post(
                    f"{url}/process_video",
                    files=files,
                    timeout=300  # 5 minute timeout for AI processing
                )
                
                if response.status_code == 200:
                    result = response.json()
                    current_app.logger.info(f"Colab processing successful: {result.get('transcription')}")
                    return result
                else:
                    current_app.logger.error(f"Colab processing failed: {response.text}")
                    return {
                        'success': False,
                        'error': f"Colab server error: {response.status_code}",
                        'details': response.text
                    }
                    
        except requests.Timeout:
            current_app.logger.error("Colab processing timeout")
            return {
                'success': False,
                'error': 'AI processing timeout (video too long or server busy)'
            }
        except requests.ConnectionError:
            current_app.logger.error("Cannot connect to Colab server")
            return {
                'success': False,
                'error': 'Cannot connect to AI server. Is Colab cell running?'
            }
        except Exception as e:
            current_app.logger.error(f"Colab processing error: {str(e)}")
            return {
                'success': False,
                'error': f'AI processing failed: {str(e)}'
            }
    
    @staticmethod
    def process_video_base64(video_base64: str) -> Dict[str, Any]:
        """
        Process base64-encoded video through Colab AI server
        
        Args:
            video_base64: Base64-encoded video data
            
        Returns:
            Dict with transcription result or error
        """
        url = ColabAIService.get_colab_url()
        if not url:
            return {
                'success': False,
                'error': 'Colab server URL not configured'
            }
        
        try:
            # Send to Colab
            current_app.logger.info(f"Sending base64 video to Colab: {url}/process_base64")
            response = requests.post(
                f"{url}/process_base64",
                json={'video_base64': video_base64},
                timeout=300
            )
            
            if response.status_code == 200:
                result = response.json()
                current_app.logger.info(f"Colab processing successful: {result.get('transcription')}")
                return result
            else:
                current_app.logger.error(f"Colab processing failed: {response.text}")
                return {
                    'success': False,
                    'error': f"Colab server error: {response.status_code}",
                    'details': response.text
                }
                
        except requests.Timeout:
            current_app.logger.error("Colab processing timeout")
            return {
                'success': False,
                'error': 'AI processing timeout'
            }
        except requests.ConnectionError:
            current_app.logger.error("Cannot connect to Colab server")
            return {
                'success': False,
                'error': 'Cannot connect to AI server. Is Colab cell running?'
            }
        except Exception as e:
            current_app.logger.error(f"Colab processing error: {str(e)}")
            return {
                'success': False,
                'error': f'AI processing failed: {str(e)}'
            }

