from flask import Flask
from .extensions import db, migrate, jwt
from .config import Config
from flask_cors import CORS
import os


def create_app() -> Flask:
    # create and configure the flask app
    app = Flask(__name__)
    app.config.from_object(Config)

    # init extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app, resources={
        r"/api/*": {"origins": "*"},
        r"/uploads/*": {"origins": "*"}
    })

    # serve static files from uploads directory
    from flask import send_from_directory
    uploads_dir = os.path.join(os.path.dirname(__file__), '..', 'uploads')
    
    @app.route('/uploads/<path:filename>')
    def uploaded_file(filename):
        return send_from_directory(uploads_dir, filename)

    # import models so migrations can detect them
    # note: keep local import to avoid circulars during app creation
    from . import models  # noqa: F401

    # register api blueprint
    from .api import bp as api_bp
    app.register_blueprint(api_bp, url_prefix='/api')

    # DEBUG: Print Colab configuration at startup
    colab_url = os.getenv('COLAB_SERVER_URL') or app.config.get('COLAB_SERVER_URL')
    print("\n" + "="*60)
    print("AI SERVER CONFIGURATION")
    print("="*60)
    if colab_url:
        print(f"[OK] Colab URL configured: {colab_url}")
        
        # Test connection
        try:
            import requests
            response = requests.get(f"{colab_url}/health", timeout=5)
            if response.status_code == 200:
                print(f"[OK] Colab server is AVAILABLE and responding")
            else:
                print(f"[WARN] Colab server returned status: {response.status_code}")
        except Exception as e:
            print(f"[ERROR] Colab server is NOT accessible: {e}")
    else:
        print("[ERROR] Colab URL NOT configured - AI transcription will fail!")
        print("   Add COLAB_SERVER_URL to backend/.flaskenv")
    print("="*60 + "\n")

    return app


 