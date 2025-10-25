"""Simple script to run the Flask development server"""
import os
from app import create_app

# load environment variables from .flaskenv
try:
    from dotenv import load_dotenv
    env_path = os.path.join(os.path.dirname(__file__), '.flaskenv')
    load_dotenv(env_path)
except ImportError:
    print("Warning: python-dotenv not installed, using system environment variables")

app = create_app()

if __name__ == '__main__':
    # For debugging, we want to catch all exceptions
    try:
        app.run(host='0.0.0.0', port=5000, debug=True)
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()

