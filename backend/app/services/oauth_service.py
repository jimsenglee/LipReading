"""
OAuth service for Google OAuth integration
"""
from flask import current_app
try:
    from requests_oauthlib import OAuth2Session
except ImportError:
    # fallback if library not installed yet
    OAuth2Session = None
import os


class OAuthService:
    """OAuth service for handling Google OAuth authentication"""
    
    @staticmethod
    def get_google_config():
        """get Google OAuth configuration from app config"""
        return {
            'client_id': current_app.config.get('GOOGLE_CLIENT_ID'),
            'client_secret': current_app.config.get('GOOGLE_CLIENT_SECRET'),
            'redirect_uri': current_app.config.get('GOOGLE_REDIRECT_URI'),
            'authorization_base_url': 'https://accounts.google.com/o/oauth2/v2/auth',
            'token_url': 'https://oauth2.googleapis.com/token',
            'userinfo_url': 'https://www.googleapis.com/oauth2/v2/userinfo',
            'scope': ['openid', 'https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile']
        }
    
    @staticmethod
    def get_google_auth_url():
        """generate Google OAuth authorization URL"""
        try:
            if OAuth2Session is None:
                raise ImportError("requests-oauthlib library is not installed. Please install it: pip install requests-oauthlib")
            
            config = OAuthService.get_google_config()
            
            if not config['client_id'] or not config['client_secret']:
                raise ValueError("Google OAuth credentials not configured")
            
            current_app.logger.info(f"[DEBUG] Google OAuth: client_id: {config['client_id'][:20]}...")
            current_app.logger.info(f"[DEBUG] Google OAuth: redirect_uri: {config['redirect_uri']}")
            current_app.logger.info(f"[DEBUG] Google OAuth: scopes: {config['scope']}")
            
            # create OAuth2 session
            oauth = OAuth2Session(
                config['client_id'],
                redirect_uri=config['redirect_uri'],
                scope=config['scope']
            )
            
            # get authorization URL
            authorization_url, state = oauth.authorization_url(
                config['authorization_base_url'],
                access_type='offline',
                prompt='select_account'
            )
            
            current_app.logger.info(f"[DEBUG] Google OAuth: generated authorization URL (first 100 chars): {authorization_url[:100]}...")
            current_app.logger.debug(f"[DEBUG] Google OAuth: state: {state}")
            
            return authorization_url, state
            
        except Exception as e:
            current_app.logger.error(f"[DEBUG] Google OAuth: failed to generate URL: {str(e)}", exc_info=True)
            raise
    
    @staticmethod
    def handle_google_callback(authorization_code: str):
        """exchange authorization code for user info"""
        try:
            if OAuth2Session is None:
                raise ImportError("requests-oauthlib library is not installed. Please install it: pip install requests-oauthlib")
            
            config = OAuthService.get_google_config()
            
            if not config['client_id'] or not config['client_secret']:
                raise ValueError("Google OAuth credentials not configured")
            
            current_app.logger.info(f"[DEBUG] Google OAuth callback: received authorization code (first 10 chars): {authorization_code[:10]}...")
            current_app.logger.debug(f"[DEBUG] Google OAuth callback: using redirect_uri: {config['redirect_uri']}")
            
            # create OAuth2 session
            oauth = OAuth2Session(
                config['client_id'],
                redirect_uri=config['redirect_uri']
            )
            
            # exchange code for token
            current_app.logger.debug(f"[DEBUG] Google OAuth callback: exchanging code for token...")
            token = oauth.fetch_token(
                config['token_url'],
                code=authorization_code,
                client_secret=config['client_secret']
            )
            
            current_app.logger.info(f"[DEBUG] Google OAuth callback: successfully exchanged code for token")
            
            # get user info
            current_app.logger.debug(f"[DEBUG] Google OAuth callback: fetching user info from Google...")
            user_info = oauth.get(config['userinfo_url']).json()
            
            current_app.logger.info(f"[DEBUG] Google OAuth callback: retrieved user info - email: {user_info.get('email')}")
            current_app.logger.debug(f"[DEBUG] Google OAuth callback: full user info: {user_info}")
            
            # combine first name and last name from google
            given_name = user_info.get('given_name', '')
            family_name = user_info.get('family_name', '')
            full_name = user_info.get('name', '')
            
            # if we have given_name and family_name, combine them
            if given_name and family_name:
                full_name = f"{given_name} {family_name}".strip()
                current_app.logger.debug(f"[DEBUG] Google OAuth callback: combined name from given_name and family_name: {full_name}")
            elif not full_name:
                # fallback to email if no name available
                full_name = user_info.get('email', 'User').split('@')[0]
                current_app.logger.debug(f"[DEBUG] Google OAuth callback: using email as fallback for name: {full_name}")
            
            current_app.logger.info(f"[DEBUG] Google OAuth callback: final name: {full_name}")
            
            return {
                'google_id': user_info.get('id'),
                'email': user_info.get('email'),
                'name': full_name,
                'given_name': given_name,
                'family_name': family_name,
                'picture': user_info.get('picture'),
                'verified_email': user_info.get('verified_email', False)
            }
            
        except Exception as e:
            current_app.logger.error(f"[DEBUG] Google OAuth callback: failed to handle callback: {str(e)}", exc_info=True)
            raise

