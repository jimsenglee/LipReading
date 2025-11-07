import os


class Config:
    # basic secret key; override via env in production
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')

    # mysql connection string; expects env vars in both dev and prod
    # example: MYSQL_USER=root, MYSQL_PASSWORD=pass, MYSQL_HOST=127.0.0.1, MYSQL_DB=lip_reading
    MYSQL_USER = os.getenv('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', 'root')
    MYSQL_HOST = os.getenv('MYSQL_HOST', '127.0.0.1')
    MYSQL_PORT = int(os.getenv('MYSQL_PORT', '3306'))
    MYSQL_DB = os.getenv('MYSQL_DB', 'my_fyp_database')

    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # uploads base directory; backend resolves and ensures folders exist at runtime
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'uploads')))
    
    # default profile image path (relative to UPLOAD_FOLDER)
    DEFAULT_PROFILE_IMAGE_PATH = 'profiles/avatar.jpg'
    
    # Colab AI server configuration
    COLAB_SERVER_URL = os.getenv('COLAB_SERVER_URL', None)
    MAX_VIDEO_SIZE_MB = int(os.getenv('MAX_VIDEO_SIZE_MB', 100))
    
    # Email configuration for password reset and 2FA
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', '587'))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
    MAIL_USERNAME = os.getenv('MAIL_USERNAME', 'chikiongboon@gmail.com')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD', 'ehyizsqusmaqujvz')
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:8080')
    
    # Google OAuth configuration
    GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '404495636811-4vncopqk1m6oado3n81jcskhdi6lrvvm.apps.googleusercontent.com')
    GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET', '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')
    GOOGLE_REDIRECT_URI = os.getenv('GOOGLE_REDIRECT_URI', 'http://127.0.0.1:5000/api/auth/google/callback')
    
    # App name for 2FA QR code
    APP_NAME = os.getenv('APP_NAME', 'LipReading')


